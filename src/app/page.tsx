"use client";

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatBs, formatUsd } from '@/lib/formatters';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import DistributionPieChart from '@/components/charts/DistributionPieChart';
import CxCStackedBarChart from '@/components/charts/CxCStackedBarChart';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Wallet, 
  CreditCard,
  PieChart,
  BarChart2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  FileSpreadsheet,
  DollarSign
} from 'lucide-react';
import { normalizarMes } from '@/lib/mesUtils';

const TASA_CAMBIO = 35.00;

const monthOrder: Record<string, number> = { 
  'ENERO': 1, 'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4, 
  'MAYO': 5, 'JUNIO': 6, 'JULIO': 7, 'AGOSTO': 8, 
  'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12 
};
const orderToMonth: Record<number, string> = Object.fromEntries(
  Object.entries(monthOrder).map(([k, v]) => [v, k])
);

function groupTopCategories(map: Map<string, number>, maxCategories: number = 5) {
  const entries = Array.from(map.entries());
  entries.sort((a, b) => b[1] - a[1]);
  if (entries.length <= maxCategories) return entries.map(([name, value]) => ({ name, value }));
  
  const top = entries.slice(0, maxCategories - 1);
  const others = entries.slice(maxCategories - 1);
  const othersTotal = others.reduce((acc, curr) => acc + curr[1], 0);
  
  const result = top.map(([name, value]) => ({ name, value }));
  if (othersTotal > 0) result.push({ name: 'OTROS', value: othersTotal });
  return result;
}

export default function Home() {
  const { data: rawData, filtroMesGlobal } = useAppStore();
  const filterMonthUpper = filtroMesGlobal === 'HISTÓRICO TOTAL' ? null : normalizarMes(filtroMesGlobal);

  const data = useMemo(() => {
    if (!rawData) return null;

    const currentMonthIdx = filterMonthUpper ? (monthOrder[filterMonthUpper] || 99) : 99;
    const prevMonthIdx = currentMonthIdx !== 99 ? currentMonthIdx - 1 : 99;
    const prevMonthUpper = orderToMonth[prevMonthIdx] || null;

    let totalIngresosBs = 0;
    let totalEgresosBs = 0;
    let prevIngresosBs = 0;
    let prevEgresosBs = 0;
    
    let cxcBs = 0;
    let cxcUsd = 0;
    let prevCxcBs = 0;
    
    let cxpUsd = 0;
    let prevCxpUsd = 0;

    let totalSociosActivosSA = 0;
    let totalSociosActivosSB = 0;
    let nuevosIngresosMesSA = 0;
    let nuevosIngresosMesSB = 0;
    let prevNuevosIngresos = 0;

    const monthlyTrendMap = new Map<string, { ingresos: number, egresos: number }>();
    const incomeDistributionMap = new Map<string, number>();
    const expenseDistributionMap = new Map<string, number>();
    const cxcCompositionMap = new Map<string, any>();

    let otrosIngresosBs = 0;
    let otrosEgresosBs = 0;
    let prestamosBs = 0;

    // Ingresos
    rawData.ingresosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      
      if (!monthlyTrendMap.has(mes)) monthlyTrendMap.set(mes, { ingresos: 0, egresos: 0 });
      monthlyTrendMap.get(mes)!.ingresos += row.montoBs;

      if (!filterMonthUpper || mes === filterMonthUpper) {
        totalIngresosBs += row.montoBs;
        incomeDistributionMap.set(row.clasificacion, (incomeDistributionMap.get(row.clasificacion) || 0) + row.montoBs);
      }
      if (prevMonthUpper && mes === prevMonthUpper) {
        prevIngresosBs += row.montoBs;
      }
    });

    // Egresos
    rawData.egresosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      
      if (!monthlyTrendMap.has(mes)) monthlyTrendMap.set(mes, { ingresos: 0, egresos: 0 });
      monthlyTrendMap.get(mes)!.egresos += row.montoBs;

      if (!filterMonthUpper || mes === filterMonthUpper) {
        totalEgresosBs += row.montoBs;
        expenseDistributionMap.set(row.clasificacion, (expenseDistributionMap.get(row.clasificacion) || 0) + row.montoBs);
        if (row.clasificacion.toUpperCase() === 'PRESTAMOS' || row.clasificacion.toUpperCase() === 'PRESTAMO') prestamosBs += row.montoBs;
      }
      if (prevMonthUpper && mes === prevMonthUpper) {
        prevEgresosBs += row.montoBs;
      }
    });

    // CxC
    rawData.cxcRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      
      if (!filterMonthUpper || mes === filterMonthUpper) {
        cxcBs += row.ayudasBs;
        const rowUsd = row.fianzas + row.vidrios + row.montepio + row.grua;
        cxcUsd += rowUsd;

        if (!cxcCompositionMap.has(mes)) {
          cxcCompositionMap.set(mes, { name: mes, fianzas: 0, ayudasBs: 0, vidrios: 0, montepio: 0, grua: 0 });
        }
        const c = cxcCompositionMap.get(mes);
        c.fianzas += row.fianzas;
        c.ayudasBs += row.ayudasBs;
        c.vidrios += row.vidrios;
        c.montepio += row.montepio;
        c.grua += row.grua;
      }
      
      if (prevMonthUpper && mes === prevMonthUpper) {
        prevCxcBs += row.ayudasBs + ((row.fianzas + row.vidrios + row.montepio + row.grua) * TASA_CAMBIO);
      }
    });
    cxcBs += cxcUsd * TASA_CAMBIO;

    // CxP
    rawData.cxpRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      if (!filterMonthUpper || mes === filterMonthUpper) cxpUsd += row.montoUsd;
      if (prevMonthUpper && mes === prevMonthUpper) prevCxpUsd += row.montoUsd;
    });

    // Socios
    rawData.sociosActivosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      const rowMonthIdx = monthOrder[mes] || 1; 
      if (filterMonthUpper && rowMonthIdx > currentMonthIdx) return; 
      
      if (row.tipo === 'SA') totalSociosActivosSA++;
      else if (row.tipo === 'SB') totalSociosActivosSB++;
    });

    rawData.nuevosIngresosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      if (!filterMonthUpper || mes === filterMonthUpper) {
        if (row.ficha.startsWith('SA')) nuevosIngresosMesSA++;
        else if (row.ficha.startsWith('SB')) nuevosIngresosMesSB++;
      }
      if (prevMonthUpper && mes === prevMonthUpper) {
        prevNuevosIngresos++;
      }
    });

    const incomeDistribution = groupTopCategories(incomeDistributionMap);
    const expenseDistribution = groupTopCategories(expenseDistributionMap);

    otrosIngresosBs = incomeDistribution.find(d => d.name === 'OTROS')?.value || 0;
    otrosEgresosBs = expenseDistribution.find(d => d.name === 'OTROS')?.value || 0;

    const flujoCajaBs = totalIngresosBs - totalEgresosBs;
    const prevFlujoCajaBs = prevIngresosBs - prevEgresosBs;
    
    const varIngresos = prevIngresosBs > 0 ? ((totalIngresosBs - prevIngresosBs) / prevIngresosBs) * 100 : 0;
    const varEgresos = prevEgresosBs > 0 ? ((totalEgresosBs - prevEgresosBs) / prevEgresosBs) * 100 : 0;
    const varFlujo = prevFlujoCajaBs !== 0 ? ((flujoCajaBs - prevFlujoCajaBs) / Math.abs(prevFlujoCajaBs)) * 100 : 0;
    const varCxc = prevCxcBs > 0 ? ((cxcBs - prevCxcBs) / prevCxcBs) * 100 : 0;
    
    const facturacionTotal = totalIngresosBs + cxcBs; 
    const eficienciaCobro = facturacionTotal > 0 ? (totalIngresosBs / facturacionTotal) * 100 : 0;
    const indiceSolvencia = totalEgresosBs > 0 ? (totalIngresosBs / totalEgresosBs) : 0;

    return {
      flujoCajaBs,
      flujoCajaUsd: flujoCajaBs / TASA_CAMBIO,
      varFlujo,
      totalIngresosBs,
      varIngresos,
      totalEgresosBs,
      varEgresos,
      cxcBs,
      cxcUsd,
      varCxc,
      cxpBs: cxpUsd * TASA_CAMBIO,
      cxpUsd,
      totalSociosActivosSA,
      totalSociosActivosSB,
      nuevosIngresosMesSA,
      nuevosIngresosMesSB,
      prevNuevosIngresos,
      otrosIngresosBs,
      otrosEgresosBs,
      prestamosBs,
      eficienciaCobro,
      indiceSolvencia,
      monthlyTrend: Array.from(monthlyTrendMap.entries()).map(([name, data]) => ({ name, ...data })),
      incomeDistribution,
      expenseDistribution,
      cxcComposition: Array.from(cxcCompositionMap.values())
    };
  }, [rawData, filterMonthUpper]);

  if (!data) return null;

  const totalSocios = data.totalSociosActivosSA + data.totalSociosActivosSB;
  const totalNuevos = data.nuevosIngresosMesSA + data.nuevosIngresosMesSB;
  const varNuevos = data.prevNuevosIngresos > 0 ? ((totalNuevos - data.prevNuevosIngresos) / data.prevNuevosIngresos) * 100 : 0;

  const TrendBadge = ({ value, invert = false }: { value: number, invert?: boolean }) => {
    if (value === 0) return <span className="text-[10px] text-slate-400 font-medium tracking-wide">0.0% vs ANT.</span>;
    const isPositive = value > 0;
    const isGood = invert ? !isPositive : isPositive;
    return (
      <span className={`text-[10px] font-semibold flex items-center gap-0.5 tracking-wide ${isGood ? 'text-emerald-600' : 'text-rose-500'}`}>
        {isPositive ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
        {Math.abs(value).toFixed(1)}% vs ant.
      </span>
    );
  };

  return (
    <div className="pb-12 max-w-[1400px] mx-auto space-y-8 font-sans">
      
      {/* 👑 HEADER PREMIUM */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-light tracking-tight text-slate-800">
              Resumen <span className="font-semibold">Ejecutivo</span>
            </h2>
            {filtroMesGlobal !== 'HISTÓRICO TOTAL' && (
              <span className="px-2.5 py-0.5 bg-slate-800 text-white rounded-full text-[10px] font-semibold uppercase tracking-widest shadow-sm">
                {filtroMesGlobal} 2026
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 font-light">
            Análisis consolidado de rentabilidad y operaciones institucionales.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tasa Ref.</p>
            <p className="text-sm font-medium text-slate-600">Bs. {TASA_CAMBIO.toFixed(2)} / USD</p>
          </div>
        </div>
      </header>
      
      {/* 🚀 METRICS SUPERIORES (Estilo Delicado y Limpio) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* FLUJO DE CAJA (Hero Metric) */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-500"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/10 rounded-xl text-blue-300 backdrop-blur-md">
                  <Wallet size={20} strokeWidth={1.5} />
                </div>
                {filterMonthUpper && (
                  <span className={`text-[10px] font-semibold flex items-center gap-0.5 tracking-wide ${data.varFlujo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {data.varFlujo >= 0 ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
                    {Math.abs(data.varFlujo).toFixed(1)}%
                  </span>
                )}
              </div>
              <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Flujo de Caja Neto</h4>
              <p className="text-3xl font-light text-white tracking-tight truncate">
                {formatBs(data.flujoCajaBs)}
              </p>
              <p className="text-sm text-slate-400 mt-1 font-medium">{formatUsd(data.flujoCajaUsd)} USD</p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Índice Solvencia</span>
              <span className="text-xs text-blue-300 font-bold bg-blue-500/10 px-2 py-1 rounded-md">{data.indiceSolvencia.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* INGRESOS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <TrendingUp size={20} strokeWidth={1.5} />
              </div>
              {filterMonthUpper && <TrendBadge value={data.varIngresos} />}
            </div>
            <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Ingresos Operativos</h4>
            <p className="text-3xl font-light text-slate-800 tracking-tight truncate">
              {formatBs(data.totalIngresosBs)}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Equivalente</span>
            <span className="text-xs text-slate-600 font-medium">{formatUsd(data.totalIngresosBs / TASA_CAMBIO)} USD</span>
          </div>
        </div>

        {/* EGRESOS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                <TrendingDown size={20} strokeWidth={1.5} />
              </div>
              {filterMonthUpper && <TrendBadge value={data.varEgresos} invert />}
            </div>
            <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Egresos Totales</h4>
            <p className="text-3xl font-light text-slate-800 tracking-tight truncate">
              {formatBs(data.totalEgresosBs)}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Equivalente</span>
            <span className="text-xs text-slate-600 font-medium">{formatUsd(data.totalEgresosBs / TASA_CAMBIO)} USD</span>
          </div>
        </div>

        {/* CUENTAS POR COBRAR */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-400/20"></div>
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                <AlertTriangle size={20} strokeWidth={1.5} />
              </div>
              {filterMonthUpper && <TrendBadge value={data.varCxc} invert />}
            </div>
            <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Cuentas x Cobrar</h4>
            <p className="text-3xl font-light text-slate-800 tracking-tight truncate">
              {formatBs(data.cxcBs)}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Eficiencia</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${data.eficienciaCobro > 80 ? 'bg-emerald-500' : data.eficienciaCobro > 50 ? 'bg-amber-400' : 'bg-rose-500'}`} 
                  style={{ width: `${data.eficienciaCobro}%` }}
                ></div>
              </div>
              <span className="text-xs text-slate-600 font-bold">{data.eficienciaCobro.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📈 GRAFICOS & CAPITAL HUMANO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* TENDENCIA */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-lg font-light tracking-tight text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-slate-400" strokeWidth={1.5} /> 
                <span className="font-semibold">Tendencia</span> Operativa
              </h3>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-2">Evolución Ingresos vs Egresos</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#16A34A]"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ingreso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#DC2626]"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Egreso</span>
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <MonthlyTrendChart data={data.monthlyTrend} />
          </div>
        </div>

        {/* CAPITAL HUMANO */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-[0.03]">
            <Users size={200} strokeWidth={1} />
          </div>
          <div>
            <h3 className="text-lg font-light tracking-tight text-slate-800 flex items-center gap-2 mb-2">
              <Users size={18} className="text-slate-400" strokeWidth={1.5} /> 
              <span className="font-semibold">Capital</span> Humano
            </h3>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Base societaria</p>
            
            <div className="mt-8 mb-10">
              <p className="text-6xl font-light text-slate-800 tracking-tighter">{totalSocios}</p>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1">Activos Totales</p>
            </div>
            
            <div className="space-y-5 relative z-10">
              <div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span className="text-slate-500">Cupos SA</span>
                  <span className="text-slate-700">{data.totalSociosActivosSA}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 rounded-full" style={{ width: `${totalSocios > 0 ? (data.totalSociosActivosSA/totalSocios)*100 : 0}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span className="text-slate-500">Cupos SB</span>
                  <span className="text-slate-700">{data.totalSociosActivosSB}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 rounded-full" style={{ width: `${totalSocios > 0 ? (data.totalSociosActivosSB/totalSocios)*100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-50 flex justify-between items-center relative z-10">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inscripciones</p>
              <p className="text-sm font-semibold text-slate-700">+{totalNuevos} Socios</p>
            </div>
            {filterMonthUpper && <TrendBadge value={varNuevos} />}
          </div>
        </div>
      </div>

      {/* 📊 DISTRIBUCIONES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Layers size={16} className="text-emerald-500" strokeWidth={1.5} /> 
              Composición de Ingresos
            </h3>
          </div>
          <div className="flex-1 min-h-[220px]">
            <DistributionPieChart data={data.incomeDistribution} type="income" />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Layers size={16} className="text-rose-500" strokeWidth={1.5} /> 
              Composición de Egresos
            </h3>
          </div>
          <div className="flex-1 min-h-[220px]">
            <DistributionPieChart data={data.expenseDistribution} type="expense" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <BarChart2 size={16} className="text-amber-500" strokeWidth={1.5} /> 
              Morosidad por Concepto (CxC)
            </h3>
          </div>
          <div className="flex-1 min-h-[200px]">
            <CxCStackedBarChart data={data.cxcComposition} />
          </div>
        </div>
      </div>
      
      {/* 💡 MINI KPIS (FOOTER DASHBOARD) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-transparent border border-slate-200/60 p-4 rounded-xl flex items-center gap-4 hover:bg-white hover:shadow-sm transition-all">
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-500"><DollarSign size={16} strokeWidth={2} /></div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ingresos Atípicos</p>
            <p className="text-base font-semibold text-slate-700">{formatBs(data.otrosIngresosBs)}</p>
          </div>
        </div>
        
        <div className="bg-transparent border border-slate-200/60 p-4 rounded-xl flex items-center gap-4 hover:bg-white hover:shadow-sm transition-all">
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-500"><CreditCard size={16} strokeWidth={2} /></div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Egresos Atípicos</p>
            <p className="text-base font-semibold text-slate-700">{formatBs(data.otrosEgresosBs)}</p>
          </div>
        </div>
        
        <div className="bg-transparent border border-slate-200/60 p-4 rounded-xl flex items-center gap-4 hover:bg-white hover:shadow-sm transition-all">
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-500"><FileSpreadsheet size={16} strokeWidth={2} /></div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Préstamos Emitidos</p>
            <p className="text-base font-semibold text-slate-700">{formatBs(data.prestamosBs)}</p>
          </div>
        </div>
        
        <div className="bg-transparent border border-slate-200/60 p-4 rounded-xl flex items-center gap-4 hover:bg-white hover:shadow-sm transition-all relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400"></div>
          <div className="p-2.5 bg-rose-50 rounded-lg text-rose-500 ml-2"><AlertTriangle size={16} strokeWidth={2} /></div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pasivos (CxP)</p>
            <p className="text-base font-semibold text-slate-700">{formatBs(data.cxpBs)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
