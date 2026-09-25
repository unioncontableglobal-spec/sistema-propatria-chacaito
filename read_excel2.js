const xlsx = require('xlsx');
const filePath = '/Users/leydizerpa/Desktop/Sistema  Propatria Chacaito /Sistema de Contabilidad MS369.xlsm';
const workbook = xlsx.readFile(filePath);

console.log("\n--- Plan de Cuentas (primeras 20 filas) ---");
const pCuentas = xlsx.utils.sheet_to_json(workbook.Sheets['P. CUENTAS'], { header: 1 });
console.log(JSON.stringify(pCuentas.slice(0, 20), null, 2));

console.log("\n--- Libro Diario (primeras 20 filas) ---");
const libroDiario = xlsx.utils.sheet_to_json(workbook.Sheets['Libro Diario'], { header: 1 });
console.log(JSON.stringify(libroDiario.slice(4, 25), null, 2));
