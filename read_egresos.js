const xlsx = require('xlsx');
const workbook = xlsx.readFile('../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
const sheet = workbook.Sheets['EGRESOS RECIBOS'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
for(let i=0; i<10; i++) {
  console.log(`Row ${i}:`, data[i]);
}
