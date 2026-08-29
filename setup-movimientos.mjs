import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const libsql = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    console.log("Creating MovimientoSocio...");
    
    await libsql.execute(`
      CREATE TABLE IF NOT EXISTS MovimientoSocio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        ficha TEXT,
        cupo TEXT,
        nombre_apellido TEXT,
        f_afiliacion DATETIME,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        detalle TEXT,
        socioId INTEGER,
        FOREIGN KEY (socioId) REFERENCES Socio(id)
      )
    `);
    console.log("MovimientoSocio table created.");
    
  } catch (e) {
    console.error("Error creating tables:", e);
  }
}
main();
