import type { XldxPlugin, WorkbookContext } from "xldx";
import pkg from "../package.json";
import type {
  ChartType,
  ChartOptions,
  ChartData,
  ChartHooksPluginState,
  ChartSeries,
  CellPosition,
} from "./types";
import {
  CHART_NS,
  DRAWING_NS,
  SPREADSHEET_DRAWING_NS,
  RELATIONSHIPS_NS,
  RELS_NS,
  CHART_REL_TYPE,
  DRAWING_REL_TYPE,
  CHART_CONTENT_TYPE,
  DRAWING_CONTENT_TYPE,
  XML_DECLARATION,
  DEFAULT_CHART_WIDTH,
  DEFAULT_CHART_HEIGHT,
  EMU_PER_PIXEL,
} from "./constants";

export type {
  ChartType,
  ChartOptions,
  ChartData,
  ChartSeries,
  ChartPosition,
} from "./types";

function parseCellRef(cell: string): CellPosition {
  const match = cell.match(/^([A-Z]+)(\d+)$/);
  if (!match) return { col: 0, row: 0 };

  const colStr = match[1];
  const row = parseInt(match[2], 10) - 1;

  const col =
    colStr.split("").reduce((acc, char, i) => {
      return (
        acc + (char.charCodeAt(0) - 64) * Math.pow(26, colStr.length - 1 - i)
      );
    }, 0) - 1;

  return { col, row };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getChartTypeElement(type: ChartType): string {
  const typeMap: Record<ChartType, string> = {
    bar: "barChart",
    column: "barChart",
    line: "lineChart",
    pie: "pieChart",
    area: "areaChart",
    scatter: "scatterChart",
  };
  return typeMap[type];
}

function generateSeriesXml(
  series: ChartSeries[],
  chartType: ChartType,
  sheetName: string,
): string {
  return series
    .map((s, idx) => {
      const nameXml = s.name
        ? `<c:tx><c:v>${escapeXml(s.name)}</c:v></c:tx>`
        : `<c:tx><c:v>Series ${idx + 1}</c:v></c:tx>`;

      const catXml = s.labelRange
        ? `<c:cat><c:strRef><c:f>${sheetName}!${s.labelRange}</c:f></c:strRef></c:cat>`
        : "";

      const valRef = chartType === "scatter" ? "c:xVal" : "c:val";
      const valXml = `<${valRef}><c:numRef><c:f>${sheetName}!${s.dataRange}</c:f></c:numRef></${valRef}>`;

      return `<c:ser><c:idx val="${idx}"/><c:order val="${idx}"/>${nameXml}${catXml}${valXml}</c:ser>`;
    })
    .join("");
}

function generateChartXml(chart: ChartData): string {
  const { options } = chart;
  const chartTypeEl = getChartTypeElement(options.type);
  const isBarHorizontal = options.type === "bar";

  const titleXml = options.title
    ? `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${escapeXml(options.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>`
    : "";

  const legendXml =
    options.showLegend !== false
      ? `<c:legend><c:legendPos val="${options.legendPosition || "r"}"/><c:overlay val="0"/></c:legend>`
      : "";

  const seriesXml = generateSeriesXml(
    options.series,
    options.type,
    options.sheet || "Sheet1",
  );

  const barDirXml =
    chartTypeEl === "barChart"
      ? `<c:barDir val="${isBarHorizontal ? "bar" : "col"}"/><c:grouping val="clustered"/>`
      : "";

  const axisXml =
    options.type !== "pie" ? `<c:axId val="1"/><c:axId val="2"/>` : "";

  const catAxisXml =
    options.type !== "pie"
      ? `<c:catAx><c:axId val="1"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:crossAx val="2"/></c:catAx>`
      : "";

  const valAxisXml =
    options.type !== "pie"
      ? `<c:valAx><c:axId val="2"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:crossAx val="1"/></c:valAx>`
      : "";

  return `${XML_DECLARATION}
<c:chartSpace xmlns:c="${CHART_NS}" xmlns:a="${DRAWING_NS}" xmlns:r="${RELATIONSHIPS_NS}">
<c:chart>
${titleXml}
<c:plotArea>
<c:layout/>
<c:${chartTypeEl}>${barDirXml}${seriesXml}${axisXml}</c:${chartTypeEl}>
${catAxisXml}
${valAxisXml}
</c:plotArea>
${legendXml}
</c:chart>
</c:chartSpace>`;
}

function generateDrawingXml(charts: ChartData[]): string {
  const anchors = charts
    .map((chart, idx) => {
      const pos =
        typeof chart.options.position === "string"
          ? { cell: chart.options.position }
          : chart.options.position;

      const { col, row } = parseCellRef(pos.cell);
      const width = (pos.width || DEFAULT_CHART_WIDTH) * EMU_PER_PIXEL;
      const height = (pos.height || DEFAULT_CHART_HEIGHT) * EMU_PER_PIXEL;

      return `<xdr:twoCellAnchor>
<xdr:from><xdr:col>${col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
<xdr:to><xdr:col>${col + 8}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row + 15}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
<xdr:graphicFrame macro="">
<xdr:nvGraphicFramePr><xdr:cNvPr id="${idx + 2}" name="Chart ${idx + 1}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>
<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="${width}" cy="${height}"/></xdr:xfrm>
<a:graphic><a:graphicData uri="${CHART_NS}"><c:chart xmlns:c="${CHART_NS}" r:id="rId${idx + 1}"/></a:graphicData></a:graphic>
</xdr:graphicFrame>
<xdr:clientData/>
</xdr:twoCellAnchor>`;
    })
    .join("\n");

  return `${XML_DECLARATION}
<xdr:wsDr xmlns:xdr="${SPREADSHEET_DRAWING_NS}" xmlns:a="${DRAWING_NS}" xmlns:r="${RELATIONSHIPS_NS}" xmlns:c="${CHART_NS}">
${anchors}
</xdr:wsDr>`;
}

function generateDrawingRelsXml(chartCount: number): string {
  const rels = Array.from(
    { length: chartCount },
    (_, idx) =>
      `<Relationship Id="rId${idx + 1}" Type="${CHART_REL_TYPE}" Target="../charts/chart${idx + 1}.xml"/>`,
  ).join("\n");

  return `${XML_DECLARATION}
<Relationships xmlns="${RELS_NS}">
${rels}
</Relationships>`;
}

function findSheetIndex(
  files: Map<string, string | Uint8Array>,
  sheetName: string,
): number {
  const workbookContent = files.get("xl/workbook.xml");
  if (typeof workbookContent !== "string") return -1;

  const sheetRegex = /<sheet[^>]*name="([^"]*)"[^>]*>/g;
  let match;
  let index = 0;

  while ((match = sheetRegex.exec(workbookContent)) !== null) {
    if (match[1] === sheetName) return index;
    index++;
  }

  return -1;
}

function groupChartsBySheet(
  charts: Map<string, ChartData[]>,
): Map<string, ChartData[]> {
  return charts;
}

export function chartHooksPlugin(): XldxPlugin & ChartHooksPluginState {
  const state: ChartHooksPluginState = {
    charts: new Map(),
    chartCounter: 0,
  };

  return {
    name: pkg.name,
    version: pkg.version,
    charts: state.charts,
    chartCounter: state.chartCounter,

    afterGenerate(files: Map<string, string | Uint8Array>): void {
      let globalChartIndex = 0;

      state.charts.forEach((charts, sheetName) => {
        const sheetIndex = findSheetIndex(files, sheetName);
        if (sheetIndex === -1) return;

        const sheetPath = `xl/worksheets/sheet${sheetIndex + 1}.xml`;
        const sheetContent = files.get(sheetPath);
        if (typeof sheetContent !== "string") return;

        charts.forEach((chart) => {
          globalChartIndex++;
          const chartXml = generateChartXml(chart);
          files.set(`xl/charts/chart${globalChartIndex}.xml`, chartXml);
        });

        const drawingXml = generateDrawingXml(charts);
        files.set(`xl/drawings/drawing${sheetIndex + 1}.xml`, drawingXml);

        const drawingRelsXml = generateDrawingRelsXml(charts.length);
        files.set(
          `xl/drawings/_rels/drawing${sheetIndex + 1}.xml.rels`,
          drawingRelsXml,
        );

        const sheetRelsPath = `xl/worksheets/_rels/sheet${sheetIndex + 1}.xml.rels`;
        const existingRels = files.get(sheetRelsPath);
        const drawingRel = `<Relationship Id="rId1" Type="${DRAWING_REL_TYPE}" Target="../drawings/drawing${sheetIndex + 1}.xml"/>`;

        if (typeof existingRels === "string") {
          const updatedRels = existingRels.replace(
            "</Relationships>",
            `${drawingRel}</Relationships>`,
          );
          files.set(sheetRelsPath, updatedRels);
        } else {
          files.set(
            sheetRelsPath,
            `${XML_DECLARATION}\n<Relationships xmlns="${RELS_NS}">${drawingRel}</Relationships>`,
          );
        }

        const updatedSheetContent = sheetContent.replace(
          "</worksheet>",
          `<drawing r:id="rId1"/></worksheet>`,
        );
        files.set(sheetPath, updatedSheetContent);
      });

      if (globalChartIndex > 0) {
        const contentTypes = files.get("[Content_Types].xml");
        if (typeof contentTypes === "string") {
          const chartOverrides = Array.from(
            { length: globalChartIndex },
            (_, i) =>
              `<Override PartName="/xl/charts/chart${i + 1}.xml" ContentType="${CHART_CONTENT_TYPE}"/>`,
          ).join("");

          const drawingOverrides = Array.from(state.charts.keys())
            .map(
              (_, i) =>
                `<Override PartName="/xl/drawings/drawing${i + 1}.xml" ContentType="${DRAWING_CONTENT_TYPE}"/>`,
            )
            .join("");

          const updatedContentTypes = contentTypes.replace(
            "</Types>",
            `${chartOverrides}${drawingOverrides}</Types>`,
          );
          files.set("[Content_Types].xml", updatedContentTypes);
        }
      }
    },
  };
}

export function addChart(
  plugin: ChartHooksPluginState,
  options: ChartOptions,
): void {
  const sheetName = options.sheet || "Sheet1";
  const existingCharts = plugin.charts.get(sheetName) || [];

  plugin.chartCounter++;
  const chartData: ChartData = {
    id: plugin.chartCounter,
    options: { ...options, sheet: sheetName },
    sheet: sheetName,
  };

  existingCharts.push(chartData);
  plugin.charts.set(sheetName, existingCharts);
}
