const baseUrl = 'https://sistema-propatria-chacaito.vercel.app';

const meses = [
  {
    mes: '01-2026',
    payload: {
      mes: '01-2026',
      cuotaFinanzas: 35,
      perCapitaFijos: { vidrios: 0.48, montepio: 9, grua: 0, ayudas: 0 },
      eventos: [
        { tipo: 'VIDRIOS $ BCV', monto: 75.41, ficha: 'SA139', nombre: 'JULIO OSPINO', parentesco: '' },
        { tipo: 'VIDRIOS $ BCV', monto: 166.32, ficha: 'SA250', nombre: 'GUDIÑO CONTRERAS', parentesco: '' },
        { tipo: 'MONTEPIO $ BCV', monto: 1000, ficha: 'SA020', nombre: 'FREITEZ GUEDEZ', parentesco: 'DIFUNTO' },
        { tipo: 'MONTEPIO $ BCV', monto: 1000, ficha: 'SB099', nombre: 'ROMERO JAIMES', parentesco: 'PADRE' },
        { tipo: 'MONTEPIO $ BCV', monto: 1000, ficha: 'SB220', nombre: 'OSORIO HERNANDEZ', parentesco: 'DIFUNTO' }
      ]
    }
  },
  {
    mes: '02-2026',
    payload: {
      mes: '02-2026',
      cuotaFinanzas: 35,
      perCapitaFijos: { vidrios: 0.32, montepio: 3, grua: 0, ayudas: 0 },
      eventos: [
        { tipo: 'VIDRIOS $ BCV', monto: 160, ficha: 'SA180', nombre: 'FLOREZ GAMEZ', parentesco: '' },
        { tipo: 'MONTEPIO $ BCV', monto: 1000, ficha: 'SA037', nombre: 'MONTOYA GLORIA', parentesco: 'DIFUNTA' }
      ]
    }
  },
  {
    mes: '03-2026',
    payload: {
      mes: '03-2026',
      cuotaFinanzas: 35,
      perCapitaFijos: { vidrios: 0.2, montepio: 0, grua: 0, ayudas: 0 },
      eventos: [
        { tipo: 'VIDRIOS $ BCV', monto: 100, ficha: 'SA220', nombre: 'CONTRERAS MORENO', parentesco: '' }
      ]
    }
  },
  {
    mes: '04-2026',
    payload: {
      mes: '04-2026',
      cuotaFinanzas: 35,
      perCapitaFijos: {},
      eventos: [
        { tipo: 'VIDRIOS', monto: 100, ficha: '', nombre: '', parentesco: '' }
      ]
    }
  }
];

async function run() {
  for (const m of meses) {
    console.log(`Borrando ${m.mes}...`);
    try {
      const delRes = await fetch(`${baseUrl}/api/publicaciones/eliminar/${m.mes}`, { method: 'DELETE' });
      const delText = await delRes.text();
      console.log(`Borrado ${m.mes}:`, delRes.status, delText);
    } catch(e) { console.error('Error borrando', e); }

    console.log(`Aprobando ${m.mes}...`);
    try {
      const apRes = await fetch(`${baseUrl}/api/publicaciones/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m.payload)
      });
      const apText = await apRes.text();
      console.log(`Aprobado ${m.mes}:`, apRes.status, apText);
    } catch(e) { console.error('Error aprobando', e); }
  }
}

run();
