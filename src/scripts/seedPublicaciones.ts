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
  console.log('Iniciando Seeder de Publicaciones...');

  const filePath = path.join(process.cwd(), '..', 'BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error('No se encontró el archivo Excel en', filePath);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  
  const sheetCxp = workbook.Sheets['CxP_PUBLICACIONES'];
  const sheetCxc = workbook.Sheets['CxC_PUBLICACIONES'];

  if (!sheetCxp || !sheetCxc) {
    console.error('No se encontraron las pestañas CxP_PUBLICACIONES o CxC_PUBLICACIONES');
    process.exit(1);
  }

  // 1. Procesar CxC_PUBLICACIONES (Las reglas mensuales)
  const dataCxc: any[][] = xlsx.utils.sheet_to_json(sheetCxc, { header: 1 });
  const mesesReglas: Record<string, any> = {};

  // Empieza a leer desde la fila 4 (índice 4)
  for (let i = 4; i < dataCxc.length; i++) {
    const row = dataCxc[i];
    if (!row || !row[0]) continue;
    
    const mesOriginal = row[0];
    const mesCode = mesParse(mesOriginal);
    
    mesesReglas[mesCode] = {
      finanzas: row[1] || 0,
      ayudas: row[2] || 0,
      vidrios: row[3] || 0,
      montepio: row[4] || 0,
      grua: row[5] || 0
    };
  }

  console.log('Reglas maestras obtenidas:', mesesReglas);

  // 2. Procesar CxP_PUBLICACIONES (Los eventos a pagar)
  const dataCxp: any[][] = xlsx.utils.sheet_to_json(sheetCxp, { header: 1 });
  const eventosPorMes: Record<string, any[]> = {};

  for (let i = 1; i < dataCxp.length; i++) {
    const row = dataCxp[i];
    if (!row || !row[0]) continue;

    const tipo = row[0]; // VIDRIOS $ BCV, etc.
    const ficha = row[1];
    const parentesco = row[3] === 'N/A' ? '' : row[3];
    const monto = row[4] || 0;
    const mesCode = mesParse(row[5]);

    if (!eventosPorMes[mesCode]) eventosPorMes[mesCode] = [];
    eventosPorMes[mesCode].push({ tipo, ficha, parentesco, monto });
  }

  // 3. Crear las deudas (CxC) y pagos (CxP) masivos
  const sociosActivos = await prisma.socio.findMany({ where: { status: 'ACTIVO' } });
  
  let publicacionesInsertadas = 0;
  let cxcInsertadas = 0;
  let cxpInsertadas = 0;

  for (const mesCode of Object.keys(mesesReglas)) {
    const reglas = mesesReglas[mesCode];
    const eventos = eventosPorMes[mesCode] || [];

    // Ver si ya está publicado
    const existe = await prisma.publicacionMensual.findUnique({ where: { mes: mesCode } });
    if (existe) {
      console.log(`El mes ${mesCode} ya está publicado. Saltando...`);
      continue;
    }

    // Preparar JSON para PublicacionMensual
    const reglasJson = {
      finanzas: reglas.finanzas,
      eventos: eventos.map(ev => ({
        tipo: ev.tipo,
        montoTotal: ev.monto,
        costoPorSocio: 0 // Simplificación de la data importada
      }))
    };

    await prisma.$transaction(async (tx) => {
      // a. Insertar Publicación
      await tx.publicacionMensual.create({
        data: {
          mes: mesCode,
          estado: 'APROBADO',
          reglas_json: JSON.stringify(reglasJson)
        }
      });
      publicacionesInsertadas++;

      // b. Insertar CxP (Eventos para los beneficiarios)
      for (const ev of eventos) {
        // Buscar el socio beneficiario
        const socio = sociosActivos.find(s => s.ficha === ev.ficha);
        if (socio) {
          await tx.cuentaPorPagar.create({
            data: {
              socioId: socio.id,
              tipo_publicacion: ev.tipo,
              parentesco: ev.parentesco,
              mes: mesCode,
              monto: ev.monto,
              estado: 'PENDIENTE'
            }
          });
          cxpInsertadas++;
        }
      }

      // c. Insertar CxC masivas
      const cxcInserts: any[] = [];
      sociosActivos.forEach(socio => {
        if (reglas.finanzas > 0) {
          cxcInserts.push({ socioId: socio.id, tipo_publicacion: 'FINANZAS', mes: mesCode, monto_a_cobrar: reglas.finanzas, estado: 'PENDIENTE' });
        }
        if (reglas.vidrios > 0) {
          cxcInserts.push({ socioId: socio.id, tipo_publicacion: 'VIDRIOS', mes: mesCode, monto_a_cobrar: reglas.vidrios, estado: 'PENDIENTE' });
        }
        if (reglas.montepio > 0) {
          cxcInserts.push({ socioId: socio.id, tipo_publicacion: 'MONTEPIO', mes: mesCode, monto_a_cobrar: reglas.montepio, estado: 'PENDIENTE' });
        }
        if (reglas.grua > 0) {
          cxcInserts.push({ socioId: socio.id, tipo_publicacion: 'GRUA', mes: mesCode, monto_a_cobrar: reglas.grua, estado: 'PENDIENTE' });
        }
        if (reglas.ayudas > 0) {
          cxcInserts.push({ socioId: socio.id, tipo_publicacion: 'AYUDAS', mes: mesCode, monto_a_cobrar: reglas.ayudas, estado: 'PENDIENTE' });
        }
      });

      await tx.cuentaPorCobrar.createMany({ data: cxcInserts });
      cxcInsertadas += cxcInserts.length;
    });

    console.log(`✅ Mes ${mesCode} procesado exitosamente.`);
  }

  console.log('\n--- RESUMEN DE IMPORTACIÓN ---');
  console.log(`Publicaciones insertadas: ${publicacionesInsertadas}`);
  console.log(`Cuentas Por Pagar (CxP) creadas: ${cxpInsertadas}`);
  console.log(`Cuentas Por Cobrar (CxC) masivas creadas: ${cxcInsertadas}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
