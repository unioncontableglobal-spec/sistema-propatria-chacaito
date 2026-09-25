"use client";

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatBs, formatUsd } from '@/lib/formatters';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import DistributionPieChart from '@/components/charts/DistributionPieChart';
import CxCStackedBarChart from '@/components/charts/CxCStackedBarChart';
import {
  Users, TrendingUp, TrendingDown, Activity, Wallet, CreditCard,
  BarChart2, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Layers, FileSpreadsheet, DollarSign, ShieldCheck, Target,
  CheckCircle2, XCircle, MinusCircle, Landmark, ReceiptText
} from 'lucide-react';
import { normalizarMes } from '@/lib/mesUtils';

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

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

function getSaludColor(valor: number, umbrales: [number, number]) {
  if (valor >= umbrales[1]) return { bg: 'bg-emerald-500', text: 'text-emerald-600' };
  if (valor >= umbrales[0]) return { bg: 'bg-amber-400',  text: 'text-amber-600'  };
  return                         { bg: 'bg-rose-500',    text: 'text-rose-600'    };
}

const TrendBadge = ({ value, invert = false }: { value: number; invert?: boolean }) => {
  if (value === 0) return <span className="text-[10px] text-slate-400 font-semibold">0.0% vs ant.</span>;
  const isPositive = value > 0;
  const isGood = invert ? !isPositive : isPositive;
  return (
    <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isGood ? 'text-emerald-600' : 'text-rose-500'}`}>
      {isPositive ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
      {Math.abs(value).toFixed(1)}% vs ant.
    </span>
  );
};

const SaludBar = ({ valor, umbrales, label }: { valor: number; umbrales: [number, number]; label: string }) => {
  const salud = getSaludColor(valor, umbrales);
  const pct = Math.min(Math.max(valor, 0), 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className={`text-[10px] font-black ${salud.text}`}>{fmtPct(valor)}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${salud.bg}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const HealthIcon = ({ ok, warn, label }: { ok: boolean; warn?: boolean; label: string }) => {
  if (ok)   return <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" /><span className="text-xs text-slate-600">{label}</span></div>;
  if (warn) return <div className="flex items-center gap-2"><MinusCircle  size={14} className="text-amber-500 flex-shrink-0"  /><span className="text-xs text-slate-600">{label}</span></div>;
  return          <div className="flex items-center gap-2"><XCircle       size={14} className="text-rose-500 flex-shrink-0"   /><span className="text-xs text-slate-600">{label}</span></div>;
};

export default function Home() {
  const { data: rawData, filtroMesGlobal } = useAppStore();
  const filterMonthUpper = filtroMesGlobal === 'HISTÓRICO TOTAL' ? null : normalizarMes(filtroMesGlobal);

  const TASA_CAMBIO = useMemo(() => {
    if (!rawData) return 35.00;
    if (filterMonthUpper && rawData.tasaPorMes?.[filterMonthUpper]) return rawData.tasaPorMes[filterMonthUpper];
    return rawData.tasaReferencial || 35.00;
  }, [rawData, filterMonthUpper]);

  const data = useMemo(() => {
    if (!rawData) return null;
    const currentMonthIdx = filterMonthUpper ? (monthOrder[filterMonthUpper] || 99) : 99;
    const prevMonthIdx    = currentMonthIdx !== 99 ? currentMonthIdx - 1 : 99;
    const prevMonthUpper  = orderToMonth[prevMonthIdx] || null;

    let totalIngresosBs = 0, totalIngresosUsd = 0;
    let totalEgresosBs  = 0, totalEgresosUsd  = 0;
    let prevIngresosBs  = 0, prevIngresosUsd  = 0;
    let prevEgresosBs   = 0, prevEgresosUsd   = 0;
    let cxcBs = 0, cxcUsd = 0, prevCxcBs = 0, cxpUsd = 0;
    let totalSociosActivosSA = 0, totalSociosActivosSB = 0;
    let nuevosIngresosMesSA  = 0, nuevosIngresosMesSB  = 0, prevNuevosIngresos = 0;
    let ingresosAtipicosBs   = 0, egresosAtipicosBs    = 0, prestamosBs        = 0;

    const monthlyTrendMap     = new Map<string, { ingresos: number; egresos: number }>();
    const incomeDistributionMap  = new Map<string, number>();
    const expenseDistributionMap = new Map<string, number>();
    const cxcCompositionMap   = new Map<string, any>();
    const ingCategorias       = new Map<string, number>();
    const egrCategorias       = new Map<string, number>();

    rawData.ingresosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      if (!monthlyTrendMap.has(mes)) monthlyTrendMap.set(mes, { ingresos: 0, egresos: 0 });
      monthlyTrendMap.get(mes)!.ingresos += row.montoBs;
      if (!filterMonthUpper || mes === filterMonthUpper) {
        totalIngresosBs += row.montoBs; totalIngresosUsd += row.montoUsd;
        const clase = row.clasificacion?.toUpperCase() || 'OTROS';
        incomeDistributionMap.set(clase, (incomeDistributionMap.get(clase) || 0) + row.montoBs);
        ingCategorias.set(clase, (ingCategorias.get(clase) || 0) + row.montoBs);
        if (!clase.includes('MENSUALIDAD') && !clase.includes('AFILIACION') && !clase.includes('INSCRIPCION')) ingresosAtipicosBs += row.montoBs;
      }
      if (prevMonthUpper && mes === prevMonthUpper) { prevIngresosBs += row.montoBs; prevIngresosUsd += row.montoUsd; }
    });

    rawData.egresosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      if (!monthlyTrendMap.has(mes)) monthlyTrendMap.set(mes, { ingresos: 0, egresos: 0 });
      monthlyTrendMap.get(mes)!.egresos += row.montoBs;
      if (!filterMonthUpper || mes === filterMonthUpper) {
        totalEgresosBs += row.montoBs; totalEgresosUsd += row.montoUsd;
        const clase = row.clasificacion?.toUpperCase() || 'OTROS';
        expenseDistributionMap.set(clase, (expenseDistributionMap.get(clase) || 0) + row.montoBs);
        egrCategorias.set(clase, (egrCategorias.get(clase) || 0) + row.montoBs);
        if (clase.includes('PRESTAMO')) prestamosBs += row.montoBs;
        else if (!clase.includes('NOMINA') && !clase.includes('HONORARIOS') && !clase.includes('PROVEEDORES')) egresosAtipicosBs += row.montoBs;
      }
      if (prevMonthUpper && mes === prevMonthUpper) { prevEgresosBs += row.montoBs; prevEgresosUsd += row.montoUsd; }
    });

    rawData.cxcRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      if (!filterMonthUpper || mes === filterMonthUpper) {
        cxcBs += row.ayudasBs;
        const rowUsd = row.fianzas + row.vidrios + row.montepio + row.grua;
        cxcUsd += rowUsd;
        if (!cxcCompositionMap.has(mes)) cxcCompositionMap.set(mes, { name: mes, fianzas: 0, ayudasBs: 0, vidrios: 0, montepio: 0, grua: 0 });
        const c = cxcCompositionMap.get(mes);
        c.fianzas += row.fianzas; c.ayudasBs += row.ayudasBs; c.vidrios += row.vidrios; c.montepio += row.montepio; c.grua += row.grua;
      }
      if (prevMonthUpper && mes === prevMonthUpper) prevCxcBs += row.ayudasBs + ((row.fianzas + row.vidrios + row.montepio + row.grua) * TASA_CAMBIO);
    });
    cxcBs += cxcUsd * TASA_CAMBIO;

    rawData.cxpRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      if (!filterMonthUpper || mes === filterMonthUpper) cxpUsd += row.montoUsd;
    });

    rawData.sociosActivosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      const rowMonthIdx = monthOrder[mes] || 1;
      if (filterMonthUpper && rowMonthIdx > currentMonthIdx) return;
      if (row.tipo === 'SA') totalSociosActivosSA++; else if (row.tipo === 'SB') totalSociosActivosSB++;
    });

    rawData.nuevosIngresosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      if (!filterMonthUpper || mes === filterMonthUpper) {
        if (row.ficha.startsWith('SA')) nuevosIngresosMesSA++; else if (row.ficha.startsWith('SB')) nuevosIngresosMesSB++;
      }
      if (prevMonthUpper && mes === prevMonthUpper) prevNuevosIngresos++;
    });

    const flujoCajaBs       = totalIngresosBs - totalEgresosBs;
    const facturacionTotal  = totalIngresosBs + cxcBs;
    const eficienciaCobro   = facturacionTotal > 0 ? (totalIngresosBs / facturacionTotal) * 100 : 0;
    const indiceSolvencia   = totalEgresosBs  > 0 ? totalIngresosBs / totalEgresosBs : 0;
    const margenNeto        = totalIngresosBs > 0 ? (flujoCajaBs / totalIngresosBs) * 100 : 0;
    const ratioGastoIngreso = totalIngresosBs > 0 ? (totalEgresosBs / totalIngresosBs) * 100 : 0;
    const cxpBs             = cxpUsd * TASA_CAMBIO;
    const activoTotalBs     = totalIngresosBs + cxcBs;
    const pasivoTotalBs     = cxpBs + prestamosBs;
    const patrimonioNetoUsd = (activoTotalBs - pasivoTotalBs) / TASA_CAMBIO;

    const topIngCat = Array.from(ingCategorias.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([cat, bs]) => ({ cat, bs, pct: totalIngresosBs > 0 ? (bs / totalIngresosBs) * 100 : 0 }));
    const topEgrCat = Array.from(egrCategorias.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([cat, bs]) => ({ cat, bs, pct: totalEgresosBs > 0 ? (bs / totalEgresosBs) * 100 : 0 }));

    return {
      flujoCajaBs, flujoCajaUsd: totalIngresosUsd - totalEgresosUsd,
      totalIngresosBs, totalIngresosUsd, totalEgresosBs, totalEgresosUsd,
      varIngresos: prevIngresosBs > 0 ? ((totalIngresosBs - prevIngresosBs) / prevIngresosBs) * 100 : 0,
      varEgresos:  prevEgresosBs  > 0 ? ((totalEgresosBs  - prevEgresosBs)  / prevEgresosBs)  * 100 : 0,
      varFlujo:    (prevIngresosBs - prevEgresosBs) !== 0 ? ((flujoCajaBs - (prevIngresosBs - prevEgresosBs)) / Math.abs(prevIngresosBs - prevEgresosBs)) * 100 : 0,
      varCxc:      prevCxcBs > 0 ? ((cxcBs - prevCxcBs) / prevCxcBs) * 100 : 0,
      cxcBs, cxcUsd, cxpBs, cxpUsd,
      totalSociosActivosSA, totalSociosActivosSB,
      nuevosIngresosMesSA, nuevosIngresosMesSB, prevNuevosIngresos,
      ingresosAtipicosBs, egresosAtipicosBs, prestamosBs,
      eficienciaCobro, indiceSolvencia, margenNeto, ratioGastoIngreso,
      activoTotalBs, pasivoTotalBs, patrimonioNetoUsd,
      topIngCat, topEgrCat,
      incomeDistribution:  groupTopCategories(incomeDistributionMap,  6),
      expenseDistribution: groupTopCategories(expenseDistributionMap, 6),
      monthlyTrend:    Array.from(monthlyTrendMap.entries()).map(([name, d]) => ({ name, ...d })),
      cxcComposition:  Array.from(cxcCompositionMap.values()),
    };
  }, [rawData, filterMonthUpper, TASA_CAMBIO]);

  if (!data) return null;

  const totalSocios  = data.totalSociosActivosSA + data.totalSociosActivosSB;
  const totalNuevos  = data.nuevosIngresosMesSA  + data.nuevosIngresosMesSB;
  const varNuevos    = data.prevNuevosIngresos > 0 ? ((totalNuevos - data.prevNuevosIngresos) / data.prevNuevosIngresos) * 100 : 0;
  const periodoLabel = filtroMesGlobal === 'HISTÓRICO TOTAL' ? 'Histórico Total' : `${filtroMesGlobal} 2026`;

  return (
    <div className="pb-16 max-w-[1440px] mx-auto space-y-6 font-sans">

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-light tracking-tight text-slate-800">Balance <span className="font-bold">General</span></h1>
            <span className="px-3 py-1 bg-[#0A1128] text-[#FDE047] rounded-lg text-[10px] font-black uppercase tracking-widest shadow">{periodoLabel}</span>
          </div>
          <p className="text-sm text-slate-400 font-light">A.C. Propatria Carmelitas Chacaíto · RIF: J-00188684-2 · Estado financiero consolidado</p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tasa Ref.</p>
            <p className="text-sm font-bold text-slate-700">Bs. {TASA_CAMBIO.toFixed(2)} / USD</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Socios Activos</p>
            <p className="text-sm font-bold text-slate-700">{totalSocios} asociados</p>
          </div>
        </div>
      </header>

      {/* ── S1: KPIs FINANCIEROS ──────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">01 · Resultados del Período</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          <div className="bg-[#0A1128] rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-white/10 rounded-xl text-[#FDE047]"><Wallet size={18} strokeWidth={1.5} /></div>
                {filterMonthUpper && <TrendBadge value={data.varFlujo} />}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Resultado Neto del Período</p>
              <p className={`text-3xl font-bold tracking-tight ${data.flujoCajaBs >= 0 ? 'text-[#FDE047]' : 'text-rose-400'}`}>{formatBs(data.flujoCajaBs)}</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">{formatUsd(data.flujoCajaUsd)} USD</p>
            </div>
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 relative z-10">
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Solvencia</p>
                <p className={`text-base font-black ${data.indiceSolvencia >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>{data.indiceSolvencia.toFixed(2)}x</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Margen</p>
                <p className={`text-base font-black ${data.margenNeto >= 0 ? 'text-blue-300' : 'text-rose-400'}`}>{fmtPct(data.margenNeto)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><TrendingUp size={18} strokeWidth={1.5} /></div>
                {filterMonthUpper && <TrendBadge value={data.varIngresos} />}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Ingresos Operativos</p>
              <p className="text-2xl font-bold text-slate-800">{formatBs(data.totalIngresosBs)}</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">{formatUsd(data.totalIngresosUsd)} USD</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50">
              <SaludBar valor={data.eficienciaCobro} umbrales={[60, 85]} label="Eficiencia de Cobro" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600"><TrendingDown size={18} strokeWidth={1.5} /></div>
                {filterMonthUpper && <TrendBadge value={data.varEgresos} invert />}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Egresos Totales</p>
              <p className="text-2xl font-bold text-slate-800">{formatBs(data.totalEgresosBs)}</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">{formatUsd(data.totalEgresosUsd)} USD</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50">
              <SaludBar valor={100 - Math.min(data.ratioGastoIngreso, 100)} umbrales={[25, 40]} label="Holgura Operativa" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-500"><AlertTriangle size={18} strokeWidth={1.5} /></div>
                {filterMonthUpper && <TrendBadge value={data.varCxc} invert />}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Cuentas por Cobrar</p>
              <p className="text-2xl font-bold text-slate-800">{formatBs(data.cxcBs)}</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">{formatUsd(data.cxcUsd)} USD ref.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between text-xs font-semibold text-slate-500">
              <span>Pasivos (CxP)</span>
              <span className="text-rose-600 font-black">{formatUsd(data.cxpUsd)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── S2: BALANCE PATRIMONIAL + SALUD + CAPITAL HUMANO ─────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-indigo-50 rounded-lg"><Landmark size={16} className="text-indigo-600" strokeWidth={1.5} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Balance Patrimonial</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Activos vs Pasivos</p>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">▸ ACTIVOS</p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-xs text-slate-600">Ingresos Realizados</span>
                <span className="text-xs font-black text-blue-700">{formatBs(data.totalIngresosBs)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-xs text-slate-600">Cuentas por Cobrar (CxC)</span>
                <span className="text-xs font-bold text-amber-600">{formatBs(data.cxcBs)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 font-black">
                <span className="text-xs text-slate-800">Total Activo</span>
                <span className="text-xs text-blue-700">{formatBs(data.activoTotalBs)}</span>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-2">▸ PASIVOS</p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-xs text-slate-600">Cuentas por Pagar (CxP)</span>
                <span className="text-xs font-bold text-rose-600">{formatBs(data.cxpBs)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-xs text-slate-600">Préstamos Emitidos</span>
                <span className="text-xs font-bold text-rose-600">{formatBs(data.prestamosBs)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 font-black">
                <span className="text-xs text-slate-800">Total Pasivo</span>
                <span className="text-xs text-rose-700">{formatBs(data.pasivoTotalBs)}</span>
              </div>
            </div>
          </div>
          <div className={`rounded-xl p-3 ${data.patrimonioNetoUsd >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Patrimonio Neto</span>
              <span className={`text-sm font-black ${data.patrimonioNetoUsd >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatUsd(data.patrimonioNetoUsd)}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{data.patrimonioNetoUsd >= 0 ? '✓ Posición financiera positiva' : '✗ Posición financiera negativa'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-emerald-50 rounded-lg"><ShieldCheck size={16} className="text-emerald-600" strokeWidth={1.5} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Salud Financiera</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Indicadores con Semáforo</p>
            </div>
          </div>
          <div className="space-y-4">
            <SaludBar valor={data.eficienciaCobro} umbrales={[60, 85]} label="Eficiencia de Cobro (%)" />
            <SaludBar valor={data.margenNeto < 0 ? 0 : data.margenNeto} umbrales={[15, 30]} label="Margen Neto (%)" />
            <SaludBar valor={Math.min(data.indiceSolvencia * 50, 100)} umbrales={[50, 75]} label="Solvencia (1x = 50%)" />
            <SaludBar valor={100 - Math.min(data.ratioGastoIngreso, 100)} umbrales={[25, 40]} label="Holgura Operativa (%)" />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-50 space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Diagnóstico Rápido</p>
            <HealthIcon ok={data.indiceSolvencia >= 1} warn={data.indiceSolvencia >= 0.8 && data.indiceSolvencia < 1} label={`Solvencia ${data.indiceSolvencia.toFixed(2)}x (meta ≥ 1.0x)`} />
            <HealthIcon ok={data.margenNeto >= 20} warn={data.margenNeto >= 0 && data.margenNeto < 20} label={`Margen neto ${fmtPct(data.margenNeto)} (meta ≥ 20%)`} />
            <HealthIcon ok={data.eficienciaCobro >= 85} warn={data.eficienciaCobro >= 60 && data.eficienciaCobro < 85} label={`Cobro ${fmtPct(data.eficienciaCobro)} (meta ≥ 85%)`} />
            <HealthIcon ok={data.ratioGastoIngreso <= 70} warn={data.ratioGastoIngreso <= 85 && data.ratioGastoIngreso > 70} label={`Gasto/Ingreso ${fmtPct(data.ratioGastoIngreso)} (meta ≤ 70%)`} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-[0.025]"><Users size={200} strokeWidth={1} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-slate-100 rounded-lg"><Users size={16} className="text-slate-600" strokeWidth={1.5} /></div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Capital Humano</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Base Societaria</p>
              </div>
            </div>
            <div className="text-center my-4">
              <p className="text-6xl font-light text-slate-800 tracking-tighter">{totalSocios}</p>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">Socios Activos Totales</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600">Cupos SA</span>
                  <span className="text-slate-800">{data.totalSociosActivosSA} · {totalSocios > 0 ? fmtPct((data.totalSociosActivosSA / totalSocios) * 100) : '0%'}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0A1128] rounded-full" style={{ width: `${totalSocios > 0 ? (data.totalSociosActivosSA / totalSocios) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600">Cupos SB</span>
                  <span className="text-slate-800">{data.totalSociosActivosSB} · {totalSocios > 0 ? fmtPct((data.totalSociosActivosSB / totalSocios) * 100) : '0%'}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${totalSocios > 0 ? (data.totalSociosActivosSB / totalSocios) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center relative z-10">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nuevos Registros</p>
              <p className="text-base font-bold text-slate-800">+{totalNuevos} socios</p>
            </div>
            {filterMonthUpper && <TrendBadge value={varNuevos} />}
          </div>
        </div>
      </section>

      {/* ── S3: TENDENCIA + MÉTRICAS SECUNDARIAS ──────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-slate-400" strokeWidth={1.5} />
                <h3 className="text-sm font-black text-slate-800">Tendencia Operativa</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Evolución Mensual: Ingresos vs Egresos</p>
            </div>
            <div className="flex gap-3 bg-slate-50 p-2 rounded-lg">
              <div className="flex items-center gap-1.5 px-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Ingreso</span>
              </div>
              <div className="flex items-center gap-1.5 px-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Egreso</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full"><MonthlyTrendChart data={data.monthlyTrend} /></div>
        </div>

        <div className="space-y-3">
          {[
            { Icon: DollarSign,     bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'Otros Ingresos',     val: data.ingresosAtipicosBs, sub: `${data.totalIngresosBs > 0 ? fmtPct((data.ingresosAtipicosBs / data.totalIngresosBs) * 100) : '0%'} del total` },
            { Icon: CreditCard,     bg: 'bg-rose-50',    color: 'text-rose-500',    label: 'Otros Egresos',      val: data.egresosAtipicosBs,  sub: `${data.totalEgresosBs > 0 ? fmtPct((data.egresosAtipicosBs / data.totalEgresosBs) * 100) : '0%'} del total` },
            { Icon: FileSpreadsheet,bg: 'bg-amber-50',   color: 'text-amber-500',   label: 'Préstamos Emitidos', val: data.prestamosBs,         sub: formatUsd(data.prestamosBs / TASA_CAMBIO) + ' USD' },
            { Icon: ReceiptText,    bg: 'bg-rose-50',    color: 'text-rose-600',    label: 'Pasivos CxP',        val: data.cxpBs,               sub: formatUsd(data.cxpUsd) + ' USD' },
          ].map(({ Icon, bg, color, label, val, sub }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
              <div className={`p-3 ${bg} rounded-xl ${color} flex-shrink-0`}><Icon size={16} strokeWidth={1.5} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-black text-slate-700 truncate">{formatBs(val)}</p>
                <p className="text-[10px] text-slate-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── S4: TOP CATEGORÍAS ────────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">04 · Análisis por Categoría</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Top Categorías de Ingreso', sub: '% sobre total recaudado', cats: data.topIngCat, color: 'text-blue-700', barColor: 'bg-blue-500', iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
            { title: 'Top Categorías de Egreso',  sub: '% sobre total gastado',   cats: data.topEgrCat, color: 'text-rose-700', barColor: 'bg-rose-500',  iconColor: 'text-rose-600',  iconBg: 'bg-rose-50'  },
          ].map(({ title, sub, cats, color, barColor, iconColor, iconBg }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-5">
                <div className={`p-2 ${iconBg} rounded-lg`}><Target size={14} className={iconColor} strokeWidth={1.5} /></div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">{title}</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{sub}</p>
                </div>
              </div>
              <div className="space-y-3">
                {cats.map((c, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[55%]">{c.cat}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black ${color}`}>{formatBs(c.bs)}</span>
                        <span className="text-[10px] font-black text-slate-400 w-10 text-right">{fmtPct(c.pct)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── S5: DISTRIBUCIONES ───────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">05 · Distribución Gráfica por Concepto</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <Layers size={14} className="text-emerald-500" strokeWidth={1.5} />
              <div><h3 className="text-xs font-black text-slate-800">Ingresos por Concepto</h3><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Distribución del Flujo</p></div>
            </div>
            <div className="flex-1 min-h-[220px]"><DistributionPieChart data={data.incomeDistribution} type="income" /></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <Layers size={14} className="text-rose-500" strokeWidth={1.5} />
              <div><h3 className="text-xs font-black text-slate-800">Gastos por Concepto</h3><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Distribución Operativa</p></div>
            </div>
            <div className="flex-1 min-h-[220px]"><DistributionPieChart data={data.expenseDistribution} type="expense" /></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 size={14} className="text-amber-500" strokeWidth={1.5} />
              <div><h3 className="text-xs font-black text-slate-800">Composición CxC</h3><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Morosidad por Tipo</p></div>
            </div>
            <div className="flex-1 min-h-[200px]"><CxCStackedBarChart data={data.cxcComposition} /></div>
          </div>
        </div>
      </section>

    </div>
  );
}
