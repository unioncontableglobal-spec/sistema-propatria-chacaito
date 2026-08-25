import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

function mesParse(mesStr: string): string {
  const m = mesStr.toLowerCase().trim();
  if (m === 'enero') return '01-2026';
  if (m === 'febrero') return '02-2026';
  if (m === 'marzo') return '03-2026';
  if (m === 'abril') return '04-2026';
  if (m === 'mayo') return '05-2026';
  if (m === 'junio') return '06-2026';
  if (m === 'julio') return '07-2026';
  if (m === 'agosto') return '08-2026';
  if (m === 'septiembre') return '09-2026';
  if (m === 'octubre') return '10-2026';
  if (m === 'noviembre') return '11-2026';
  if (m === 'diciembre') return '12-2026';
  return mesStr; // fallback
}

async function main() {
  console.log('Iniciando Patch de Publicaciones...');

  const filePath = path.join(process.cwd(), '..', 'BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error('No se encontró el archivo Excel en', filePath);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  
  const sheetCxp = workbook.Sheets['CxP_PUBLICACIONES'];
  const sheetCxc = workbook.Sheets['CxC_PUBLICACIONES'];

  // 1. Procesar CxC_PUBLICACIONES
  const dataCxc: any[][] = xlsx.utils.sheet_to_json(sheetCxc, { header: 1 });
  const mesesReglas: Record<string, any> = {};

  for (let i = 4; i < dataCxc.length; i++) {
    const row = dataCxc[i];
    if (!row || !row[0]) continue;
    
    const mesCode = mesParse(row[0]);
    mesesReglas[mesCode] = {
      finanzas: row[1] || 0,
      ayudas: row[2] || 0,
      vidrios: row[3] || 0,
      montepio: row[4] || 0,
      grua: row[5] || 0
    };
  }

  // 2. Procesar CxP_PUBLICACIONES
  const dataCxp: any[][] = xlsx.utils.sheet_to_json(sheetCxp, { header: 1 });
  const eventosPorMes: Record<string, any[]> = {};

  for (let i = 1; i < dataCxp.length; i++) {
    const row = dataCxp[i];
    if (!row || !row[0]) continue;

    const tipo = row[0]; // VIDRIOS $ BCV, etc.
    const ficha = row[1] || '---';
    const nombre = row[2] || '---';
    const parentesco = row[3] === 'N/A' ? '' : (row[3] || '');
    const monto = row[4] || 0;
    const mesCode = mesParse(row[5] || '');

    if (!eventosPorMes[mesCode]) eventosPorMes[mesCode] = [];
    eventosPorMes[mesCode].push({ tipo, ficha, nombre, parentesco, monto });
  }

  // 3. Actualizar la BD
  for (const mesCode of ['01-2026', '02-2026', '03-2026']) {
    const reglas = mesesReglas[mesCode];
    const eventos = eventosPorMes[mesCode] || [];

    const existe = await prisma.publicacionMensual.findUnique({ where: { mes: mesCode } });
    if (existe) {
      const reglasJson = {
        finanzas: reglas.finanzas,
        perCapita: {
          vidrios: reglas.vidrios,
          montepio: reglas.montepio,
          grua: reglas.grua,
          ayudas: reglas.ayudas
        },
        eventos: eventos.map(ev => ({
          tipo: ev.tipo,
          montoTotal: ev.monto,
          ficha: ev.ficha,
          nombre: ev.nombre,
          parentesco: ev.parentesco,
          costoPorSocio: 0
        }))
      };

      await prisma.publicacionMensual.update({
        where: { mes: mesCode },
        data: { reglas_json: JSON.stringify(reglasJson) }
      });
      console.log(`✅ Mes ${mesCode} actualizado exitosamente.`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
