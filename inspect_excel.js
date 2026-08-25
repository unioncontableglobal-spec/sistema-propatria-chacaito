const xlsx = require('xlsx');
const workbook = xlsx.readFile('../Sistema de Contabilidad MS369.xlsm');
console.log('Sheets:', workbook.SheetNames);

// Find sheets related to Plan de Cuentas or Asientos
const planSheet = workbook.SheetNames.find(s => s.toLowerCase().includes('plan') || s.toLowerCase().includes('cuenta'));
const asientosSheet = workbook.SheetNames.find(s => s.toLowerCase().includes('asiento') || s.toLowerCase().includes('diario'));

if (planSheet) {
  console.log('\n--- Plan de Cuentas (First 15 rows) ---');
  const planData = xlsx.utils.sheet_to_json(workbook.Sheets[planSheet], { header: 1 }).slice(0, 15);
  console.log(JSON.stringify(planData, null, 2));
}

if (asientosSheet) {
  console.log('\n--- Asientos Contables / Diario (First 15 rows) ---');
  const asientosData = xlsx.utils.sheet_to_json(workbook.Sheets[asientosSheet], { header: 1 }).slice(0, 15);
  console.log(JSON.stringify(asientosData, null, 2));
}
