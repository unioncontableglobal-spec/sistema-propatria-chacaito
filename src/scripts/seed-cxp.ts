import prisma from '../lib/prisma';
import * as xlsx from 'xlsx';
import path from 'path';

const filePath = path.join(process.cwd(), '../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');

async function main() {
  console.log('Iniciando carga de CxP Históricas...');
  const workbook = xlsx.readFile(filePath);
  const cxpSheet = workbook.Sheets['CxP_PUBLICACIONES'];
  
  if (!cxpSheet) {
    throw new Error('No se encontró la hoja CxP_PUBLICACIONES');
  }

  const data = xlsx.utils.sheet_to_json<any[]>(cxpSheet, { header: 1 });
  const rows = data.slice(1).filter(r => r[0] && r[1] && r[5]); // tipo, ficha, mes no vacíos

  const socios = await prisma.socio.findMany();
  const sociosMap = new Map();
  socios.forEach(s => {
    if (s.codigo) sociosMap.set(s.codigo.trim(), s.id);
    if (s.ficha) sociosMap.set(s.ficha.trim(), s.id);
  });

  const cxpInserts: any[] = [];
  const eventosPorMes: Record<string, any[]> = {
    '01-2026': [],
    '02-2026': [],
    '03-2026': []
  };

  const mesesToCode: any = { 'ENERO': '01-2026', 'FEBRERO': '02-2026', 'MARZO': '03-2026' };

  for (const row of rows) {
    const tipo = row[0].toString().trim();
    const ficha = row[1].toString().trim();
    const parentesco = row[3] ? row[3].toString().trim() : '';
    let monto = row[4];
    if (monto === '-') monto = 0;
    monto = parseFloat(monto) || 0;
    const mesStr = row[5].toString().trim().toUpperCase();
    
    const mesCode = mesesToCode[mesStr];
    if (!mesCode) continue;

    const socioId = sociosMap.get(ficha);
    if (!socioId) {
      console.warn(`Socio con ficha ${ficha} no encontrado. Omitiendo CxP de ${monto}`);
      continue;
    }

    if (monto > 0) {
      cxpInserts.push({
        socioId,
        tipo_publicacion: tipo,
        parentesco,
        mes: mesCode,
        monto,
        estado: 'PENDIENTE'
      });

      eventosPorMes[mesCode].push({
        tipo,
        montoTotal: monto,
        monto,
        ficha,
        nombre: row[2].toString().trim(),
        parentesco
      });
    }
  }

  await prisma.cuentaPorPagar.deleteMany({});
  
  const chunkSize = 100;
  for (let i = 0; i < cxpInserts.length; i += chunkSize) {
    const chunk = cxpInserts.slice(i, i + chunkSize);
    await prisma.cuentaPorPagar.createMany({ data: chunk });
  }
  console.log(`Creadas ${cxpInserts.length} Cuentas por Pagar.`);

  // Update PublicacionMensual
  for (const [mesCode, eventos] of Object.entries(eventosPorMes)) {
    const pub = await prisma.publicacionMensual.findUnique({ where: { mes: mesCode } });
    if (pub && pub.reglas_json) {
      const reglas = JSON.parse(pub.reglas_json);
      reglas.eventos = eventos;
      await prisma.publicacionMensual.update({
        where: { mes: mesCode },
        data: { reglas_json: JSON.stringify(reglas) }
      });
      console.log(`Publicacion ${mesCode} actualizada con ${eventos.length} eventos.`);
    }
  }

  console.log('Carga de CxP Históricas completada!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
