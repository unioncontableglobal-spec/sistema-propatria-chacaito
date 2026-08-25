import * as xlsx from 'xlsx';
import path from 'path';
import * as fs from 'fs';

export type DashboardData = {
  flujoCajaBs: number;
  flujoCajaUsd: number;
  cxcBs: number;
  cxcUsd: number;
  cxpBs: number;
  cxpUsd: number;
  totalSociosActivosSA: number;
  totalSociosActivosSB: number;
  nuevosIngresosMesSA: number;
  nuevosIngresosMesSB: number;
  monthlyTrend: { name: string; ingresos: number; egresos: number }[];
  incomeDistribution: { name: string; value: number }[];
  expenseDistribution: { name: string; value: number }[];
  cxcComposition: { name: string; fianzas: number; ayudasBs: number; vidrios: number; montepio: number; grua: number }[];
  totalIngresosBs: number;
  totalEgresosBs: number;
};

const TASA_CAMBIO = 35.00;

function excelDateToMonth(serial: number): string {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  const month = date_info.toLocaleString('es-ES', { month: 'long', timeZone: 'UTC' });
  return month.charAt(0).toUpperCase() + month.slice(1);
}

function cleanString(str: any): string {
  if (typeof str !== 'string') return 'OTROS';
  return str.trim().toUpperCase();
}

function groupTopCategories(map: Map<string, number>, maxCategories: number = 6): { name: string, value: number }[] {
  const entries = Array.from(map.entries());
  entries.sort((a, b) => b[1] - a[1]); // Descending order
  if (entries.length <= maxCategories) {
    return entries.map(([name, value]) => ({ name, value }));
  }
  
  const top = entries.slice(0, maxCategories - 1);
  const others = entries.slice(maxCategories - 1);
  const othersTotal = others.reduce((acc, curr) => acc + curr[1], 0);
  
  const result = top.map(([name, value]) => ({ name, value }));
  result.push({ name: 'OTROS', value: othersTotal });
  return result;
}

export function getDashboardDataFromExcel(filtroMes?: string): DashboardData {
  const defaultData: DashboardData = {
    flujoCajaBs: 0, flujoCajaUsd: 0, cxcBs: 0, cxcUsd: 0, cxpBs: 0, cxpUsd: 0,
    totalSociosActivosSA: 0, totalSociosActivosSB: 0, nuevosIngresosMesSA: 0, nuevosIngresosMesSB: 0,
    monthlyTrend: [], incomeDistribution: [], expenseDistribution: [], cxcComposition: [],
    totalIngresosBs: 0, totalEgresosBs: 0
  };

  try {
    const filePath = path.join(process.cwd(), 'data/db.xlsx');
    if (!fs.existsSync(filePath)) return defaultData;

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

    let totalIngresosBs = 0;
    let totalEgresosBs = 0;
    let cxcBs = 0;
    let cxcUsd = 0;
    let cxpUsd = 0;
    let totalSociosActivosSA = 0;
    let totalSociosActivosSB = 0;
    let nuevosIngresosMesSA = 0;
    let nuevosIngresosMesSB = 0;

    const monthlyTrendMap = new Map<string, { ingresos: number, egresos: number }>();
    const incomeDistributionMap = new Map<string, number>();
    const expenseDistributionMap = new Map<string, number>();
    const cxcCompositionMap = new Map<string, any>();

    const filterMonthUpper = filtroMes ? cleanString(filtroMes) : null;

    // Ingresos Categorías & Flujo de Caja
    const sheetIngCat = workbook.Sheets['INGRESOS CATEGORIAS'];
    if (sheetIngCat) {
      const data: any[][] = xlsx.utils.sheet_to_json(sheetIngCat, { header: 1 });
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row && typeof row[0] === 'number') {
          const mes = cleanString(excelDateToMonth(row[0]));
          // Filtrado
          if (filterMonthUpper && !mes.includes(filterMonthUpper) && filterMonthUpper !== 'HISTÓRICO TRIMESTRAL' && filterMonthUpper !== 'HISTORICO TRIMESTRAL') continue;

          const clasificacion = cleanString(row[2]);
          const montoBs = typeof row[5] === 'number' ? row[5] : 0;
          
          totalIngresosBs += montoBs;
          
          if (!monthlyTrendMap.has(mes)) monthlyTrendMap.set(mes, { ingresos: 0, egresos: 0 });
          monthlyTrendMap.get(mes)!.ingresos += montoBs;

          incomeDistributionMap.set(clasificacion, (incomeDistributionMap.get(clasificacion) || 0) + montoBs);
        }
      }
    }

    // Egresos Categorías & Flujo de Caja
    const sheetEgrCat = workbook.Sheets['EGRESOS CATEGORIAS'];
    if (sheetEgrCat) {
      const data: any[][] = xlsx.utils.sheet_to_json(sheetEgrCat, { header: 1 });
      for (let i = 4; i < data.length; i++) {
        const row = data[i];
        if (row && typeof row[0] === 'number') {
          const mes = cleanString(excelDateToMonth(row[0]));
          
          if (filterMonthUpper && !mes.includes(filterMonthUpper) && filterMonthUpper !== 'HISTÓRICO TRIMESTRAL' && filterMonthUpper !== 'HISTORICO TRIMESTRAL') continue;

          const clasificacion = cleanString(row[2]);
          const montoBs = typeof row[7] === 'number' ? row[7] : 0;
          
          totalEgresosBs += montoBs;

          if (!monthlyTrendMap.has(mes)) monthlyTrendMap.set(mes, { ingresos: 0, egresos: 0 });
          monthlyTrendMap.get(mes)!.egresos += montoBs;

          expenseDistributionMap.set(clasificacion, (expenseDistributionMap.get(clasificacion) || 0) + montoBs);
        }
      }
    }

    // CxC Composición
    const sheetCxC = workbook.Sheets['CxC_PUBLICACIONES'];
    if (sheetCxC) {
      const data: any[][] = xlsx.utils.sheet_to_json(sheetCxC, { header: 1 });
      for (let i = 4; i < data.length; i++) {
        const row = data[i];
        if (row && typeof row[0] === 'string') {
          const mes = cleanString(row[0]);
          if (filterMonthUpper && mes !== filterMonthUpper && filterMonthUpper !== 'HISTÓRICO TRIMESTRAL' && filterMonthUpper !== 'HISTORICO TRIMESTRAL') continue;

          const fianzas = typeof row[1] === 'number' ? row[1] : 0;
          const ayudasBs = typeof row[2] === 'number' ? row[2] : 0;
          const vidrios = typeof row[3] === 'number' ? row[3] : 0;
          const montepio = typeof row[4] === 'number' ? row[4] : 0;
          const grua = typeof row[5] === 'number' ? row[5] : 0;

          cxcBs += ayudasBs;
          cxcUsd += (fianzas + vidrios + montepio + grua);

          cxcCompositionMap.set(mes, {
            name: mes,
            fianzas, ayudasBs, vidrios, montepio, grua
          });
        }
      }
      cxcBs += cxcUsd * TASA_CAMBIO; 
    }

    // CxP 
    const sheetCxP = workbook.Sheets['CxP_PUBLICACIONES'];
    if (sheetCxP) {
      const data: any[][] = xlsx.utils.sheet_to_json(sheetCxP, { header: 1 });
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row && row.length > 4) {
          const mes = cleanString(row[5]);
          if (filterMonthUpper && mes !== filterMonthUpper && filterMonthUpper !== 'HISTÓRICO TRIMESTRAL' && filterMonthUpper !== 'HISTORICO TRIMESTRAL') continue;
          
          if (typeof row[4] === 'number') {
            cxpUsd += row[4];
          }
        }
      }
    }

    // Status Asociados
    const sheetStatus = workbook.Sheets['STATUS ASOCIADOS'];
    if (sheetStatus) {
      const data: any[][] = xlsx.utils.sheet_to_json(sheetStatus, { header: 1 });
      for (let i = 2; i < data.length; i++) {
        if (data[i] && cleanString(data[i][2]) === 'ACTIVO') {
          const mes = cleanString(data[i][6]);
          if (filterMonthUpper && mes !== filterMonthUpper && filterMonthUpper !== 'HISTÓRICO TRIMESTRAL' && filterMonthUpper !== 'HISTORICO TRIMESTRAL') continue;
          
          const tipo = cleanString(data[i][0]);
          if (tipo === 'SA') totalSociosActivosSA++;
          else if (tipo === 'SB') totalSociosActivosSB++;
        }
      }
    }

    // Inscripciones
    const sheetInscripciones = workbook.Sheets['INSCRIPCIONES Y CAMBIOS'];
    if (sheetInscripciones) {
      const data: any[][] = xlsx.utils.sheet_to_json(sheetInscripciones, { header: 1 });
      for (let i = 1; i < data.length; i++) {
        if (data[i] && cleanString(data[i][0]) === 'INSCRIPCIONES') {
          const mesNum = typeof data[i][4] === 'number' ? excelDateToMonth(data[i][4]) : null;
          if (mesNum) {
            const mesStr = cleanString(mesNum);
            if (filterMonthUpper && !mesStr.includes(filterMonthUpper) && filterMonthUpper !== 'HISTÓRICO TRIMESTRAL' && filterMonthUpper !== 'HISTORICO TRIMESTRAL') continue;
            
            const ficha = cleanString(data[i][1]); // Ficha ej: SA40665 o SB40667
            if (ficha.startsWith('SA')) nuevosIngresosMesSA++;
            else if (ficha.startsWith('SB')) nuevosIngresosMesSB++;
          }
        }
      }
    }

    return {
      flujoCajaBs: totalIngresosBs - totalEgresosBs,
      flujoCajaUsd: (totalIngresosBs - totalEgresosBs) / TASA_CAMBIO,
      cxcBs,
      cxcUsd,
      cxpBs: cxpUsd * TASA_CAMBIO,
      cxpUsd,
      totalSociosActivosSA,
      totalSociosActivosSB,
      nuevosIngresosMesSA,
      nuevosIngresosMesSB,
      monthlyTrend: Array.from(monthlyTrendMap.entries()).map(([name, data]) => ({ name, ...data })),
      incomeDistribution: groupTopCategories(incomeDistributionMap),
      expenseDistribution: groupTopCategories(expenseDistributionMap),
      cxcComposition: Array.from(cxcCompositionMap.values()),
      totalIngresosBs,
      totalEgresosBs
    };

  } catch (error) {
    console.error("Error reading Excel file:", error);
    return defaultData;
  }
}



export function getRawDashboardDataFromExcel() {
  const data = {
    ingresosRaw: [] as any[],
    egresosRaw: [] as any[],
    cxcRaw: [] as any[],
    cxpRaw: [] as any[],
    sociosActivosRaw: [] as any[],
    nuevosIngresosRaw: [] as any[]
  };
  try {
    const filePath = path.join(process.cwd(), 'data/db.xlsx');
    if (!fs.existsSync(filePath)) return data;
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

    const sheetIngCat = workbook.Sheets['INGRESOS CATEGORIAS'];
    if (sheetIngCat) {
      const rows = xlsx.utils.sheet_to_json<any[]>(sheetIngCat, { header: 1 });
      for (let i = 1; i < rows.length; i++) {
        if (rows[i] && typeof rows[i][0] === 'number') {
          data.ingresosRaw.push({
            mes: cleanString(excelDateToMonth(rows[i][0])),
            clasificacion: cleanString(rows[i][2]),
            montoBs: typeof rows[i][5] === 'number' ? rows[i][5] : 0
          });
        }
      }
    }

    const sheetEgrCat = workbook.Sheets['EGRESOS CATEGORIAS'];
    if (sheetEgrCat) {
      const rows = xlsx.utils.sheet_to_json<any[]>(sheetEgrCat, { header: 1 });
      for (let i = 4; i < rows.length; i++) {
        if (rows[i] && typeof rows[i][0] === 'number') {
          data.egresosRaw.push({
            mes: cleanString(excelDateToMonth(rows[i][0])),
            clasificacion: cleanString(rows[i][2]),
            montoBs: typeof rows[i][7] === 'number' ? rows[i][7] : 0
          });
        }
      }
    }

    const sheetCxC = workbook.Sheets['CxC_PUBLICACIONES'];
    if (sheetCxC) {
      const rows = xlsx.utils.sheet_to_json<any[]>(sheetCxC, { header: 1 });
      for (let i = 4; i < rows.length; i++) {
        if (rows[i] && typeof rows[i][0] === 'string') {
          data.cxcRaw.push({
            mes: cleanString(rows[i][0]),
            fianzas: typeof rows[i][1] === 'number' ? rows[i][1] : 0,
            ayudasBs: typeof rows[i][2] === 'number' ? rows[i][2] : 0,
            vidrios: typeof rows[i][3] === 'number' ? rows[i][3] : 0,
            montepio: typeof rows[i][4] === 'number' ? rows[i][4] : 0,
            grua: typeof rows[i][5] === 'number' ? rows[i][5] : 0
          });
        }
      }
    }

    const sheetCxP = workbook.Sheets['CxP_PUBLICACIONES'];
    if (sheetCxP) {
      const rows = xlsx.utils.sheet_to_json<any[]>(sheetCxP, { header: 1 });
      for (let i = 1; i < rows.length; i++) {
        if (rows[i] && rows[i].length > 4) {
          data.cxpRaw.push({
            mes: cleanString(rows[i][5]),
            montoUsd: typeof rows[i][4] === 'number' ? rows[i][4] : 0
          });
        }
      }
    }

    const sheetStatus = workbook.Sheets['STATUS ASOCIADOS'];
    if (sheetStatus) {
      const rows = xlsx.utils.sheet_to_json<any[]>(sheetStatus, { header: 1 });
      for (let i = 2; i < rows.length; i++) {
        if (rows[i] && cleanString(rows[i][2]) === 'ACTIVO') {
          data.sociosActivosRaw.push({
            mes: cleanString(rows[i][6]),
            tipo: cleanString(rows[i][0])
          });
        }
      }
    }

    const sheetInscripciones = workbook.Sheets['INSCRIPCIONES Y CAMBIOS'];
    if (sheetInscripciones) {
      const rows = xlsx.utils.sheet_to_json<any[]>(sheetInscripciones, { header: 1 });
      for (let i = 1; i < rows.length; i++) {
        if (rows[i] && cleanString(rows[i][0]) === 'INSCRIPCIONES') {
          const mesNum = typeof rows[i][4] === 'number' ? excelDateToMonth(rows[i][4]) : null;
          if (mesNum) {
            data.nuevosIngresosRaw.push({
              mes: cleanString(mesNum),
              ficha: cleanString(rows[i][1])
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error reading raw Excel data:", error);
  }
  return data;
}
