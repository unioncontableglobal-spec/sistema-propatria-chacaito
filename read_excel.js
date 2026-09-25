const xlsx = require('xlsx');
const path = require('path');

const filePath = '/Users/leydizerpa/Desktop/Sistema  Propatria Chacaito /Sistema de Contabilidad MS369.xlsm';
const workbook = xlsx.readFile(filePath);

console.log("Sheet names:");
console.log(workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const worksheet = workbook.Sheets[sheetName];
    // Convert up to 10 rows to JSON to inspect headers and data
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(JSON.stringify(data.slice(0, 10), null, 2));
});
