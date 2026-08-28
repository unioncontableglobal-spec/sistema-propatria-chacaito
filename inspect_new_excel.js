const xlsx = require('xlsx');
const fs = require('fs');

const filePath = '../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx';
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

const workbook = xlsx.readFile(filePath);
console.log('Sheets found:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n--- Sheet: ${sheetName} ---`);
  if (data.length > 0) {
    console.log('Row 1 (usually headers):', data[0]);
    if (data.length > 1) {
      console.log('Row 2 (data example):', data[1]);
    }
  } else {
    console.log('Empty sheet');
  }
});
