const xlsx = require('xlsx');
const workbook = xlsx.readFile('../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
const sheet = workbook.Sheets['INGRESOS FORMAS DE PAGO'];
if (sheet) {
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log("Columns:", data[0]);
  console.log("Row 1:", data[1]);
} else {
  console.log("Sheet not found.");
}
