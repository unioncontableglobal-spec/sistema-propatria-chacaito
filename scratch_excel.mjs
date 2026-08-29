import xlsx from 'xlsx';

const workbook = xlsx.readFile('/Users/leydizerpa/Desktop/Sistema  Propatria Chacaito /BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
console.log("Hojas disponibles:", workbook.SheetNames);

if (workbook.SheetNames.includes('INSCRIPCIONES Y CAMBIOS')) {
  const sheet = workbook.Sheets['INSCRIPCIONES Y CAMBIOS'];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log("Primeras 20 filas de INSCRIPCIONES Y CAMBIOS:");
  for (let i = 0; i < Math.min(20, data.length); i++) {
    console.log(data[i]);
  }
} else {
  console.log("No se encontró la hoja INSCRIPCIONES Y CAMBIOS.");
}
