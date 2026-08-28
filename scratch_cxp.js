const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join('../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
const workbook = xlsx.readFile(filePath);

console.log('--- CxP_PUBLICACIONES ---');
const cxpSheet = workbook.Sheets['CxP_PUBLICACIONES'];
if (cxpSheet) {
  const cxpData = xlsx.utils.sheet_to_json(cxpSheet, { header: 1 });
  console.log('First 10 rows:');
  console.log(cxpData.slice(0, 10));
}
