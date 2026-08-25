const xlsx = require('xlsx');
const path = require('path');

const workbook = xlsx.readFile(path.join(__dirname, 'data/db.xlsx'));
console.log(workbook.SheetNames);
