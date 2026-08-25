import prisma from '../lib/prisma';
import * as xlsx from 'xlsx';
import path from 'path';
import * as fs from 'fs';

function cleanString(str: any): string | null {
  if (typeof str !== 'string') {
    if (typeof str === 'number') return str.toString();
    return null;
  }
  const s = str.trim().toUpperCase();
  return s === '' || s === 'S/N' ? null : s;
}

async function main() {
  console.log('Iniciando Seeder de Socios...');

  const filePath = path.join(process.cwd(), 'data/db.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error('No se encontró el archivo Excel en', filePath);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  
  const sheetStatus = workbook.Sheets['STATUS ASOCIADOS'];
  if (!sheetStatus) {
    console.error('No se encontró la pestaña STATUS ASOCIADOS');
    process.exit(1);
  }

  const data: any[][] = xlsx.utils.sheet_to_json(sheetStatus, { header: 1 });
  
  let inserted = 0;
  let updated = 0;

  // Empezamos en la fila 2 (índice 2) ya que 0 y 1 son encabezados
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[4]) continue; // Sin nombre no hay socio

    const escalafon = cleanString(row[0]); // TIPO DE SOCIO
    const codigo = cleanString(row[1]); // CUPOS
    const status = cleanString(row[2]) || 'ACTIVO'; // STATUS
    const ficha = cleanString(row[3]); // FICHA
    const nombre_apellido = cleanString(row[4]) || 'DESCONOCIDO'; // NOMBRE Y APELLIDO
    const cedula = cleanString(row[5]); // CEDULA

    // Buscar si ya existe por Cédula o Ficha o Código
    let existingSocio = null;
    if (cedula) {
      existingSocio = await prisma.socio.findFirst({ where: { cedula } });
    }
    if (!existingSocio && codigo) {
      existingSocio = await prisma.socio.findFirst({ where: { codigo } });
    }

    if (existingSocio) {
      await prisma.socio.update({
        where: { id: existingSocio.id },
        data: {
          codigo,
          ficha,
          escalafon,
          nombre_apellido,
          status
        }
      });
      updated++;
    } else {
      await prisma.socio.create({
        data: {
          codigo,
          ficha,
          escalafon,
          nombre_apellido,
          cedula,
          status
        }
      });
      inserted++;
    }
  }

  console.log(`Seeder finalizado. Insertados: ${inserted}. Actualizados: ${updated}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
