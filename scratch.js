const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join('../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
const workbook = xlsx.readFile(filePath);

console.log('--- CxC_PUBLICACIONES ---');
const cxcSheet = workbook.Sheets['CxC_PUBLICACIONES'];
if (cxcSheet) {
  const cxcData = xlsx.utils.sheet_to_json(cxcSheet, { header: 1 });
  console.log('First 10 rows:');
  console.log(cxcData.slice(0, 10));
}

console.log('\n--- INSCRIPCIONES Y CAMBIOS ---');
const insSheet = workbook.Sheets['INSCRIPCIONES Y CAMBIOS'];
if (insSheet) {
  const insData = xlsx.utils.sheet_to_json(insSheet, { header: 1 });
  console.log('First 15 rows:');
  console.log(insData.slice(0, 15));
}
