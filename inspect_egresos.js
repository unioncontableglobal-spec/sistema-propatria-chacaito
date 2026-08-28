const xlsx = require('xlsx');

const filePath = '../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx';
const workbook = xlsx.readFile(filePath);

['CxC_PUBLICACIONES', 'EGRESOS RECIBOS', 'EGRESOS CATEGORIAS', 'EGRESOS FORMAS DE PAGO'].forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return;
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n--- Sheet: ${sheetName} ---`);
  // Find first row with more than 3 columns (usually the header)
  const headerIdx = data.findIndex(row => row && row.length > 3);
  if (headerIdx !== -1) {
    console.log(`Header found at row ${headerIdx + 1}:`, data[headerIdx]);
    console.log(`Data row example:`, data[headerIdx + 1]);
  } else {
    console.log('No obvious header found, showing first 5 rows:');
    console.log(data.slice(0, 5));
  }
});
