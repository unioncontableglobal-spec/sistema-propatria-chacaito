import xlsx from 'xlsx';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const libsql = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Helper to convert Excel date to JS Date
function excelDateToJSDate(serial) {
  if (!serial) return new Date();
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  // Add timezone offset to fix local date
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  total_seconds -= seconds;
  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

async function main() {
  console.log("Limpiando registros antiguos...");
  await libsql.execute(`DELETE FROM MovimientoSocio`);

  console.log("Leyendo Excel...");
  const workbook = xlsx.readFile('/Users/leydizerpa/Desktop/Sistema  Propatria Chacaito /BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
  const sheet = workbook.Sheets['INSCRIPCIONES Y CAMBIOS'];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  let insertados = 0;
  
  // Skip header (i=1)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 4) continue;
    
    const [tipo, ficha, cupo, nombre_apellido, fechaExcel, detalle] = row;
    if (!tipo) continue; // Si la fila está vacía
    
    // Attempt to match socio to get socioId
    const searchName = nombre_apellido ? nombre_apellido.trim().split(" ")[0] : "";
    let socioId = null;
    
    if (searchName) {
      const match = await libsql.execute({
        sql: `SELECT id FROM Socio WHERE nombre_apellido LIKE ? LIMIT 1`,
        args: [`%${searchName}%`]
      });
      if (match.rows.length > 0) {
        socioId = match.rows[0].id;
      }
    }
    
    let fechaJS = new Date();
    if (fechaExcel && !isNaN(fechaExcel)) {
       fechaJS = excelDateToJSDate(fechaExcel);
    }
    
    // Si no encontró socioId, igual lo guardamos como registro huérfano para historial
    await libsql.execute({
      sql: `INSERT INTO MovimientoSocio (tipo, ficha, cupo, nombre_apellido, fecha, detalle, socioId) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        tipo || 'Cambio',
        ficha ? String(ficha) : null,
        cupo ? String(cupo) : null,
        nombre_apellido || 'Desconocido',
        fechaJS.toISOString(),
        detalle ? String(detalle) : '',
        socioId
      ]
    });
    insertados++;
  }
  
  console.log(`Migración desde Excel completada. ${insertados} movimientos reales insertados.`);
}

main().catch(console.error);
