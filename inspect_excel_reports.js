const xlsx = require('xlsx');
const workbook = xlsx.readFile('../Sistema de Contabilidad MS369.xlsm');

const diarioSheet = workbook.SheetNames.find(s => s.toLowerCase().includes('diario'));
const mayorSheet = workbook.SheetNames.find(s => s.toLowerCase().includes('mayor'));

if (diarioSheet) {
  console.log('\n--- Libro Diario (First 20 rows) ---');
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[diarioSheet], { header: 1 }).slice(0, 20);
  console.log(JSON.stringify(data, null, 2));
}

if (mayorSheet) {
  console.log('\n--- Libro Mayor (First 20 rows) ---');
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[mayorSheet], { header: 1 }).slice(0, 20);
  console.log(JSON.stringify(data, null, 2));
}
