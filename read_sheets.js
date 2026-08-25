const xlsx = require('xlsx');
const workbook = xlsx.readFile('../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
console.log("Sheets:", workbook.SheetNames);
