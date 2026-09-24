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
  DollarSign, 
  CreditCard,
  PieChart,
  BarChart2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
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
      
      // Tendencia mensual siempre se calcula completa
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

    // Socios Activos (Acumulado hasta el mes actual)
    rawData.sociosActivosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      const rowMonthIdx = monthOrder[mes] || 1; 
      if (filterMonthUpper && rowMonthIdx > currentMonthIdx) return; 
      
      if (row.tipo === 'SA') totalSociosActivosSA++;
      else if (row.tipo === 'SB') totalSociosActivosSB++;
    });

    // Nuevos Ingresos
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

    // KPIs & Comparativas
    const flujoCajaBs = totalIngresosBs - totalEgresosBs;
    const prevFlujoCajaBs = prevIngresosBs - prevEgresosBs;
    
    const varIngresos = prevIngresosBs > 0 ? ((totalIngresosBs - prevIngresosBs) / prevIngresosBs) * 100 : 0;
    const varEgresos = prevEgresosBs > 0 ? ((totalEgresosBs - prevEgresosBs) / prevEgresosBs) * 100 : 0;
    const varFlujo = prevFlujoCajaBs !== 0 ? ((flujoCajaBs - prevFlujoCajaBs) / Math.abs(prevFlujoCajaBs)) * 100 : 0;
    const varCxc = prevCxcBs > 0 ? ((cxcBs - prevCxcBs) / prevCxcBs) * 100 : 0;
    
    // Eficiencia Financiera
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

  // Components para comparativas
  const TrendBadge = ({ value, invert = false }: { value: number, invert?: boolean }) => {
    if (value === 0) return <span className="text-xs text-gray-400 font-medium">0% vs mes ant.</span>;
    const isPositive = value > 0;
    const isGood = invert ? !isPositive : isPositive;
    return (
      <span className={`text-xs font-bold flex items-center gap-0.5 ${isGood ? 'text-green-600' : 'text-red-500'}`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(value).toFixed(1)}% <span className="text-gray-400 font-medium ml-1">vs ant.</span>
      </span>
    );
  };

  return (
    <div className="pb-10 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 tracking-tight">
            Dashboard Analítico Avanzado
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Visión global del desempeño financiero y operativo
            {filtroMesGlobal !== 'HISTÓRICO TOTAL' && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-bold uppercase">{filtroMesGlobal} 2026</span>}
          </p>
        </div>
      </header>
      
      {/* 🚀 METRICS SUPERIORES (Core Financials) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* INGRESOS */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:shadow-lg transition-all group">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp size={22} />
            </div>
            {filterMonthUpper && <TrendBadge value={data.varIngresos} />}
          </div>
          <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Ingresos</h4>
          <p className="text-2xl font-black text-slate-800 tracking-tight truncate" title={formatBs(data.totalIngresosBs)}>
            {formatBs(data.totalIngresosBs)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400 flex justify-between">
            <span>Eqv. USD</span>
            <span className="font-semibold text-slate-600">{formatUsd(data.totalIngresosBs / TASA_CAMBIO)}</span>
          </div>
        </div>

        {/* EGRESOS */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:shadow-lg transition-all group">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingDown size={22} />
            </div>
            {filterMonthUpper && <TrendBadge value={data.varEgresos} invert />}
          </div>
          <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Egresos</h4>
          <p className="text-2xl font-black text-slate-800 tracking-tight truncate" title={formatBs(data.totalEgresosBs)}>
            {formatBs(data.totalEgresosBs)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400 flex justify-between">
            <span>Eqv. USD</span>
            <span className="font-semibold text-slate-600">{formatUsd(data.totalEgresosBs / TASA_CAMBIO)}</span>
          </div>
        </div>

        {/* FLUJO DE CAJA */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 shadow-lg border border-slate-700 hover:shadow-xl transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-2 bg-white/10 text-white rounded-lg backdrop-blur-sm">
              <DollarSign size={22} />
            </div>
            {filterMonthUpper && <TrendBadge value={data.varFlujo} />}
          </div>
          <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Flujo de Caja Neto</h4>
          <p className={`text-2xl font-black tracking-tight truncate relative z-10 ${data.flujoCajaBs >= 0 ? 'text-green-400' : 'text-red-400'}`} title={formatBs(data.flujoCajaBs)}>
            {formatBs(data.flujoCajaBs)}
          </p>
          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-400 flex justify-between relative z-10">
            <span>Margen / Solvencia</span>
            <span className="font-bold text-white">{data.indiceSolvencia.toFixed(2)}x</span>
          </div>
        </div>

        {/* CUENTAS POR COBRAR */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:shadow-lg transition-all group border-b-4 border-b-amber-400">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
              <AlertTriangle size={22} />
            </div>
            {filterMonthUpper && <TrendBadge value={data.varCxc} invert />}
          </div>
          <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Cuentas por Cobrar</h4>
          <p className="text-2xl font-black text-slate-800 tracking-tight truncate" title={formatBs(data.cxcBs)}>
            {formatBs(data.cxcBs)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400 flex items-center justify-between">
            <span>Eficiencia de Cobro</span>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${data.eficienciaCobro > 80 ? 'bg-green-500' : data.eficienciaCobro > 50 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${data.eficienciaCobro}%` }}></div>
            </div>
            <span className="font-bold text-slate-600 ml-2">{data.eficienciaCobro.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* 📈 GRAFICOS PRINCIPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity size={20} className="text-blue-500" /> Tendencia Operativa Anual
              </h3>
              <p className="text-xs text-slate-400 mt-1">Evolución de Ingresos vs Egresos en Bs.</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <MonthlyTrendChart data={data.monthlyTrend} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Users size={20} className="text-blue-500" /> Capital Humano
          </h3>
          <p className="text-xs text-slate-400 mb-6">Estado actual de asociados activos</p>
          
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="text-center">
              <p className="text-6xl font-black text-blue-600 mb-2">{totalSocios}</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Socios Activos</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span className="text-slate-600">Cupos SA (Socio Activo)</span>
                  <span className="text-blue-600">{data.totalSociosActivosSA}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalSocios > 0 ? (data.totalSociosActivosSA/totalSocios)*100 : 0}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span className="text-slate-600">Cupos SB (Socio Beneficiario)</span>
                  <span className="text-sky-400">{data.totalSociosActivosSB}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${totalSocios > 0 ? (data.totalSociosActivosSB/totalSocios)*100 : 0}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Nuevas Inscripciones</p>
                <p className="text-lg font-black text-slate-800">+{totalNuevos} este periodo</p>
              </div>
              {filterMonthUpper && <TrendBadge value={varNuevos} />}
            </div>
          </div>
        </div>
      </div>

      {/* 📊 GRAFICOS SECUNDARIOS Y DISTRIBUCIONES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <PieChart size={16} className="text-green-500" /> Distribución de Ingresos
          </h3>
          <div className="flex-1 min-h-[220px]">
            <DistributionPieChart data={data.incomeDistribution} type="income" />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <PieChart size={16} className="text-red-500" /> Distribución de Egresos
          </h3>
          <div className="flex-1 min-h-[220px]">
            <DistributionPieChart data={data.expenseDistribution} type="expense" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
            <BarChart2 size={16} className="text-amber-500" /> Análisis de Morosidad CxC
          </h3>
          <p className="text-xs text-slate-400 mb-3">Composición de deuda por periodo</p>
          <div className="flex-1 min-h-[200px]">
            <CxCStackedBarChart data={data.cxcComposition} />
          </div>
        </div>
      </div>
      
      {/* 💡 MINI KPIS EXTRAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-400"><DollarSign size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Otros Ingresos</p>
            <p className="text-lg font-bold text-slate-700">{formatBs(data.otrosIngresosBs)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-400"><CreditCard size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Otros Egresos</p>
            <p className="text-lg font-bold text-slate-700">{formatBs(data.otrosEgresosBs)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-500"><TrendingUp size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Préstamos Otorgados</p>
            <p className="text-lg font-bold text-slate-700">{formatBs(data.prestamosBs)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 border-r-4 border-r-red-400">
          <div className="p-3 bg-red-50 rounded-lg text-red-500"><AlertTriangle size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Cuentas por Pagar</p>
            <p className="text-lg font-bold text-slate-700">{formatBs(data.cxpBs)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
