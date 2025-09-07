/**
 * Minimal XLSX implementation without external dependencies
 */

import { MiniZip, MiniUnzip } from './zip';

interface Cell {
  value: string | number | boolean | Date | null;
  style?: CellStyle;
}

interface CellStyle {
  font?: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    color?: string;
  };
  fill?: {
    color?: string;
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
  };
  numberFormat?: string;
}

interface Worksheet {
  name: string;
  data: (Cell | string | number | boolean | null)[][];
  columnWidths?: number[];
}

export class XlsxWriter {
  private worksheets: Worksheet[] = [];
  private sharedStrings: string[] = [];
  private stringMap: Map<string, number> = new Map();
  
  addWorksheet(name: string, data: any[][], columnWidths?: number[]): void {
    const cells: (Cell | string | number | boolean | null)[][] = data.map(row =>
      row.map(value => {
        if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
          return value as Cell;
        }
        return value;
      })
    );
    
    this.worksheets.push({ name, data: cells, columnWidths });
  }
  
  private addSharedString(str: string): number {
    if (this.stringMap.has(str)) {
      return this.stringMap.get(str)!;
    }
    const index = this.sharedStrings.length;
    this.sharedStrings.push(str);
    this.stringMap.set(str, index);
    return index;
  }
  
  private getCellValue(cell: Cell | string | number | boolean | null): { type: string; value: string } {
    if (cell === null || cell === undefined) {
      return { type: '', value: '' };
    }
    
    const actualValue = typeof cell === 'object' && 'value' in cell ? cell.value : cell;
    
    if (actualValue === null || actualValue === undefined) {
      return { type: '', value: '' };
    }
    
    if (typeof actualValue === 'boolean') {
      return { type: 'b', value: actualValue ? '1' : '0' };
    }
    
    if (typeof actualValue === 'number') {
      return { type: 'n', value: actualValue.toString() };
    }
    
    if (actualValue instanceof Date) {
      // Excel stores dates as numbers (days since 1900-01-01)
      const excelDate = Math.floor((actualValue.getTime() - new Date(1900, 0, 1).getTime()) / 86400000) + 2;
      return { type: 'n', value: excelDate.toString() };
    }
    
    // String - use shared strings table
    const stringValue = String(actualValue);
    const index = this.addSharedString(stringValue);
    return { type: 's', value: index.toString() };
  }
  
  private columnToLetters(col: number): string {
    let letters = '';
    col++;
    while (col > 0) {
      col--;
      letters = String.fromCharCode(65 + (col % 26)) + letters;
      col = Math.floor(col / 26);
    }
    return letters;
  }
  
  private generateContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${this.worksheets.map((_, i) => 
    `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join('\n  ')}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`;
  }
  
  private generateRels(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  }
  
  private generateWorkbook(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${this.worksheets.map((sheet, i) => 
      `<sheet name="${this.escapeXml(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
    ).join('\n    ')}
  </sheets>
</workbook>`;
  }
  
  private generateWorkbookRels(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${this.worksheets.map((_, i) => 
    `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
  ).join('\n  ')}
  <Relationship Id="rId${this.worksheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId${this.worksheets.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`;
  }
  
  private generateWorksheet(sheet: Worksheet): string {
    const cols = sheet.columnWidths ? `
  <cols>
    ${sheet.columnWidths.map((width, i) => 
      `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`
    ).join('\n    ')}
  </cols>` : '';
    
    const rows = sheet.data.map((row, rowIndex) => {
      const cells = row.map((cell, colIndex) => {
        const cellRef = `${this.columnToLetters(colIndex)}${rowIndex + 1}`;
        const { type, value } = this.getCellValue(cell);
        
        if (!value) return '';
        
        const typeAttr = type ? ` t="${type}"` : '';
        const styleAttr = this.getCellStyle(cell);
        
        return `      <c r="${cellRef}"${typeAttr}${styleAttr}>
        <v>${value}</v>
      </c>`;
      }).filter(c => c).join('\n');
      
      return cells ? `    <row r="${rowIndex + 1}">
${cells}
    </row>` : '';
    }).filter(r => r).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}
  <sheetData>
${rows}
  </sheetData>
</worksheet>`;
  }
  
  private getCellStyle(_cell: Cell | string | number | boolean | null): string {
    return '';
  }
  
  private generateStyles(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1">
    <font>
      <sz val="11"/>
      <name val="Calibri"/>
    </font>
  </fonts>
  <fills count="2">
    <fill>
      <patternFill patternType="none"/>
    </fill>
    <fill>
      <patternFill patternType="gray125"/>
    </fill>
  </fills>
  <borders count="1">
    <border>
      <left/>
      <right/>
      <top/>
      <bottom/>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  </cellXfs>
</styleSheet>`;
  }
  
  private generateSharedStrings(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${this.sharedStrings.length}" uniqueCount="${this.sharedStrings.length}">
  ${this.sharedStrings.map(str => `<si><t>${this.escapeXml(str)}</t></si>`).join('\n  ')}
</sst>`;
  }
  
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  
  generate(): Uint8Array {
    const zip = new MiniZip();
    
    // Add required files
    zip.addFile('[Content_Types].xml', this.generateContentTypes());
    zip.addFile('_rels/.rels', this.generateRels());
    zip.addFile('xl/workbook.xml', this.generateWorkbook());
    zip.addFile('xl/_rels/workbook.xml.rels', this.generateWorkbookRels());
    zip.addFile('xl/styles.xml', this.generateStyles());
    zip.addFile('xl/sharedStrings.xml', this.generateSharedStrings());
    
    // Add worksheets
    this.worksheets.forEach((sheet, i) => {
      zip.addFile(`xl/worksheets/sheet${i + 1}.xml`, this.generateWorksheet(sheet));
    });
    
    return zip.generate();
  }
}

export class XlsxReader {
  private zip: MiniUnzip;
  
  constructor(data: Uint8Array) {
    this.zip = new MiniUnzip(data);
  }
  
  private parseSharedStrings(): string[] {
    const content = this.zip.getFile('xl/sharedStrings.xml');
    if (!content) return [];
    
    const strings: string[] = [];
    const regex = /<t[^>]*>(.*?)<\/t>/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      strings.push(this.unescapeXml(match[1]));
    }
    
    return strings;
  }
  
  private unescapeXml(str: string): string {
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }
  
  private parseWorksheetNames(): string[] {
    const content = this.zip.getFile('xl/workbook.xml');
    if (!content) return [];
    
    const names: string[] = [];
    const regex = /<sheet[^>]*name="([^"]*)"[^>]*>/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      names.push(this.unescapeXml(match[1]));
    }
    
    return names;
  }
  
  private parseWorksheet(sheetIndex: number, sharedStrings: string[]): any[][] {
    const content = this.zip.getFile(`xl/worksheets/sheet${sheetIndex + 1}.xml`);
    if (!content) return [];
    
    const rows: any[][] = [];
    const rowRegex = /<row[^>]*r="(\d+)"[^>]*>(.*?)<\/row>/gs;
    const cellRegex = /<c[^>]*r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]*)")?[^>]*>(?:<v[^>]*>(.*?)<\/v>)?/g;
    
    let rowMatch;
    while ((rowMatch = rowRegex.exec(content)) !== null) {
      const rowNum = parseInt(rowMatch[1]) - 1;
      const rowContent = rowMatch[2];
      const row: any[] = [];
      
      let cellMatch;
      cellRegex.lastIndex = 0;
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        const colLetters = cellMatch[1];
        const type = cellMatch[3];
        const value = cellMatch[4];
        
        if (value !== undefined) {
          let cellValue: any;
          
          if (type === 's') {
            // Shared string
            cellValue = sharedStrings[parseInt(value)] || '';
          } else if (type === 'b') {
            // Boolean
            cellValue = value === '1';
          } else if (type === 'str') {
            // Inline string
            cellValue = this.unescapeXml(value);
          } else {
            // Number (or date)
            const num = parseFloat(value);
            cellValue = isNaN(num) ? value : num;
          }
          
          const colIndex = this.lettersToColumn(colLetters);
          row[colIndex] = cellValue;
        }
      }
      
      rows[rowNum] = row;
    }
    
    return rows;
  }
  
  private lettersToColumn(letters: string): number {
    let col = 0;
    for (let i = 0; i < letters.length; i++) {
      col = col * 26 + (letters.charCodeAt(i) - 64);
    }
    return col - 1;
  }
  
  read(): { sheets: { name: string; data: any[][] }[] } {
    const sharedStrings = this.parseSharedStrings();
    const sheetNames = this.parseWorksheetNames();
    
    const sheets = sheetNames.map((name, i) => ({
      name,
      data: this.parseWorksheet(i, sharedStrings)
    }));
    
    return { sheets };
  }
}