import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const libsql = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Iniciando migración de historial inicial...");

  const result = await libsql.execute(`
    SELECT * FROM Socio WHERE codigo IS NOT NULL AND codigo != ''
  `);

  const socios = result.rows;
  console.log(`Encontrados ${socios.length} socios con cupo asignado.`);

  let insertados = 0;
  for (const socio of socios) {
    // Check if movement exists
    const check = await libsql.execute({
      sql: `SELECT * FROM MovimientoSocio WHERE socioId = ?`,
      args: [socio.id]
    });

    if (check.rows.length === 0) {
      await libsql.execute({
        sql: `INSERT INTO MovimientoSocio (tipo, ficha, cupo, nombre_apellido, f_afiliacion, fecha, detalle, socioId) 
              VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`,
        args: [
          'Inscripciones',
          socio.ficha || null,
          socio.codigo,
          socio.nombre_apellido,
          socio.f_afiliacion || null,
          `Registro inicial del sistema (Migración de data histórica)`,
          socio.id
        ]
      });
      insertados++;
    }
  }

  console.log(`Migración completada. ${insertados} movimientos generados.`);
}

main().catch(console.error);
