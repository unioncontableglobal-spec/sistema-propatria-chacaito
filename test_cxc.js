const xlsx = require('xlsx');
const path = require('path');

const workbook = xlsx.readFile(path.join(__dirname, 'data/db.xlsx'));
const sheet = workbook.Sheets['CxC_PUBLICACIONES'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log("Primeras 10 filas de CxC_PUBLICACIONES:");
for(let i=0; i<10; i++) {
  console.log(data[i]);
}
