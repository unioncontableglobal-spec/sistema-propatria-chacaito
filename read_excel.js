const xlsx = require('xlsx');

const workbook = xlsx.readFile('../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
const sheetName = workbook.SheetNames[0];
console.log("Sheet Name:", sheetName);
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
console.log("Columns:", data[0]);
console.log("Row 1:", data[1]);
console.log("Row 2:", data[2]);
