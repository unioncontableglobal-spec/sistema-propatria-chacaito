import prisma from '../lib/prisma';
import * as xlsx from 'xlsx';
import path from 'path';

const filePath = path.join(process.cwd(), '../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
const workbook = xlsx.readFile(filePath);

function excelDateToDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  return new Date(utc_value * 1000);
}

function cleanString(str: any): string | null {
  if (typeof str !== 'string') return str ? String(str).trim() : null;
  const trimmed = str.trim();
  return trimmed === '' ? null : trimmed;
}

async function updateAffiliations() {
  console.log('Reading INSCRIPCIONES Y CAMBIOS...');
  const sheet = workbook.Sheets['INSCRIPCIONES Y CAMBIOS'];
  if (!sheet) {
    console.error('Sheet not found');
    return;
  }

  const data = xlsx.utils.sheet_to_json<any>(sheet, { header: 1 });
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 5) continue;

    const status = cleanString(row[0]);
    const ficha = cleanString(row[1]);
    const cupo = cleanString(row[2]);
    const fechaNum = row[4];

    if (status === 'Inscripciones' && typeof fechaNum === 'number' && cupo) {
      const fecha = excelDateToDate(fechaNum);
      
      const socio = await prisma.socio.findFirst({
        where: {
          OR: [
            { codigo: cupo },
            { ficha: ficha || cupo }
          ]
        }
      });

      if (socio) {
        await prisma.socio.update({
          where: { id: socio.id },
          data: { f_afiliacion: fecha }
        });
        count++;
        console.log(`Updated socio ${socio.codigo} with f_afiliacion: ${fecha.toISOString()}`);
      }
    }
  }

  console.log(`Successfully updated ${count} socios.`);
}

updateAffiliations()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
