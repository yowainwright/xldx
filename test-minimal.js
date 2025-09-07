import { Xldx } from './dist/index.js';
import fs from 'fs/promises';

// Test data
const testData = [
  { id: 1, name: 'John', age: 30, status: 'active' },
  { id: 2, name: 'Jane', age: 25, status: 'inactive' },
  { id: 3, name: 'Bob', age: 35, status: 'active' }
];

async function test() {
  console.log('Creating XLSX file with minimal implementation...');
  
  // Create XLSX
  const xlsx = new Xldx(testData);
  
  xlsx.createSheet(
    { name: 'Users' },
    { key: 'id', header: 'ID', width: 10 },
    { key: 'name', header: 'Name', width: 20 },
    { key: 'age', header: 'Age', width: 10 },
    { key: 'status', header: 'Status', width: 15 }
  );
  
  // Write to file
  await xlsx.write('test-output.xlsx');
  console.log('✅ Created test-output.xlsx');
  
  // Convert to JSON
  const json = xlsx.toJSON();
  console.log('📄 JSON representation:', JSON.stringify(json, null, 2));
  
  // Read back the file
  const fileData = await fs.readFile('test-output.xlsx');
  const readResult = await Xldx.read(fileData);
  console.log('📖 Read back result:', JSON.stringify(readResult, null, 2));
  
  console.log('✅ Test completed successfully!');
}

test().catch(console.error);