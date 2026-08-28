"use client";

import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatBs, formatUsd } from '@/lib/formatters';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import DistributionPieChart from '@/components/charts/DistributionPieChart';
import CxCStackedBarChart from '@/components/charts/CxCStackedBarChart';
import { Users, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

const TASA_CAMBIO = 35.00;

const monthOrder: Record<string, number> = { 
  'ENERO': 1, 'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4, 
  'MAYO': 5, 'JUNIO': 6, 'JULIO': 7, 'AGOSTO': 8, 
  'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12 
};

function groupTopCategories(map: Map<string, number>, maxCategories: number = 6) {
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
  const mesFiltro = filtroMesGlobal === 'HISTÓRICO TOTAL' ? 'HISTÓRICO TRIMESTRAL' : filtroMesGlobal;

  const data = useMemo(() => {
    if (!rawData) return null;

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

    const filterMonthUpper = mesFiltro !== 'HISTÓRICO TRIMESTRAL' && mesFiltro !== 'HISTORICO TRIMESTRAL' ? mesFiltro.toUpperCase() : null;
    const filterMonthIdx = filterMonthUpper ? (monthOrder[filterMonthUpper] || 99) : 99;

    let otrosIngresosBs = 0;
    let otrosEgresosBs = 0;
    let prestamosBs = 0;

    // Ingresos
    rawData.ingresosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      if (filterMonthUpper && !mes.includes(filterMonthUpper)) return;
      
      totalIngresosBs += row.montoBs;
      if (!monthlyTrendMap.has(mes)) monthlyTrendMap.set(mes, { ingresos: 0, egresos: 0 });
      monthlyTrendMap.get(mes)!.ingresos += row.montoBs;
      incomeDistributionMap.set(row.clasificacion, (incomeDistributionMap.get(row.clasificacion) || 0) + row.montoBs);
    });

    // Egresos
    rawData.egresosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      if (filterMonthUpper && !mes.includes(filterMonthUpper)) return;

      totalEgresosBs += row.montoBs;
      if (!monthlyTrendMap.has(mes)) monthlyTrendMap.set(mes, { ingresos: 0, egresos: 0 });
      monthlyTrendMap.get(mes)!.egresos += row.montoBs;
      expenseDistributionMap.set(row.clasificacion, (expenseDistributionMap.get(row.clasificacion) || 0) + row.montoBs);

      if (row.clasificacion.toUpperCase() === 'PRESTAMOS' || row.clasificacion.toUpperCase() === 'PRESTAMO') prestamosBs += row.montoBs;
    });

    // CxC
    rawData.cxcRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      if (filterMonthUpper && mes !== filterMonthUpper) return;

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
    });
    cxcBs += cxcUsd * TASA_CAMBIO;

    // CxP
    rawData.cxpRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      if (filterMonthUpper && mes !== filterMonthUpper) return;
      cxpUsd += row.montoUsd;
    });

    // Socios Activos (Histórico hasta el mes seleccionado)
    rawData.sociosActivosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      const rowMonthIdx = monthOrder[mes] || 1; 
      
      if (filterMonthUpper && rowMonthIdx > filterMonthIdx) return; 
      
      if (row.tipo === 'SA') totalSociosActivosSA++;
      else if (row.tipo === 'SB') totalSociosActivosSB++;
    });

    // Nuevos Ingresos (Solo los del mes filtrado, o todos si es histórico total)
    rawData.nuevosIngresosRaw.forEach(row => {
      const mes = row.mes.toUpperCase();
      if (filterMonthUpper && !mes.includes(filterMonthUpper)) return;
      
      if (row.ficha.startsWith('SA')) nuevosIngresosMesSA++;
      else if (row.ficha.startsWith('SB')) nuevosIngresosMesSB++;
    });

    const incomeDistribution = groupTopCategories(incomeDistributionMap);
    const expenseDistribution = groupTopCategories(expenseDistributionMap);

    otrosIngresosBs = incomeDistribution.find(d => d.name === 'OTROS')?.value || 0;
    otrosEgresosBs = expenseDistribution.find(d => d.name === 'OTROS')?.value || 0;

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
      otrosIngresosBs,
      otrosEgresosBs,
      prestamosBs,
      monthlyTrend: Array.from(monthlyTrendMap.entries()).map(([name, data]) => ({ name, ...data })),
      incomeDistribution,
      expenseDistribution,
      cxcComposition: Array.from(cxcCompositionMap.values()),
      totalIngresosBs,
      totalEgresosBs
    };
  }, [rawData, mesFiltro]);

  if (!data) return null;

  const totalSocios = data.totalSociosActivosSA + data.totalSociosActivosSB;
  const pctSA = totalSocios > 0 ? Math.round((data.totalSociosActivosSA / totalSocios) * 100) : 0;
  const pctSB = totalSocios > 0 ? Math.round((data.totalSociosActivosSB / totalSocios) * 100) : 0;

  const totalNuevos = data.nuevosIngresosMesSA + data.nuevosIngresosMesSB;
  const crecimientoSocios = totalSocios > 0 ? ((totalNuevos / totalSocios) * 100).toFixed(1) : 0;

  const margenCaja = data.totalIngresosBs > 0 ? ((data.flujoCajaBs / data.totalIngresosBs) * 100).toFixed(1) : 0;
  const pesoDeudaCxC = (data.flujoCajaBs + data.cxcBs) > 0 ? ((data.cxcBs / (data.flujoCajaBs + data.cxcBs)) * 100).toFixed(1) : 0;
  const pesoPasivosCxP = data.totalEgresosBs > 0 ? ((data.cxpBs / data.totalEgresosBs) * 100).toFixed(1) : 0;
  
  return (
    <div className="pb-8">
      <header className="mb-6 bg-transparent shadow-none p-0 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Dashboard Analítico Avanzado</h2>
          <p className="text-text-muted text-sm mt-1">Periodo Fiscal: <strong>{mesFiltro}</strong></p>
        </div>
      </header>
      
      {/* KPIs Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-[#16A34A] p-4 flex flex-col gap-1 hover:shadow-md transition-all hover:-translate-y-1">
          <h4 className="text-text-muted text-xs uppercase tracking-wider font-semibold leading-tight">Flujo de Caja</h4>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-[#16A34A] truncate" title={formatBs(data.flujoCajaBs)}>{formatBs(data.flujoCajaBs)}</p>
            <span className="bg-[#DCFCE7] text-[#16A34A] text-[0.65rem] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">{margenCaja}%</span>
          </div>
          <p className="text-xs text-text-muted">{formatUsd(data.flujoCajaUsd)} USD</p>
        </div>
        
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-[#16A34A] p-4 flex flex-col gap-1 hover:shadow-md transition-all hover:-translate-y-1">
          <h4 className="text-text-muted text-xs uppercase tracking-wider font-semibold leading-tight">CxC por Publicaciones</h4>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-[#16A34A] truncate" title={formatBs(data.cxcBs)}>{formatBs(data.cxcBs)}</p>
            <span className="bg-[#DBEAFE] text-[#1E3A8A] text-[0.65rem] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">{pesoDeudaCxC}%</span>
          </div>
          <p className="text-xs text-text-muted">{formatUsd(data.cxcUsd)} USD</p>
        </div>
        
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-[#DC2626] p-4 flex flex-col gap-1 hover:shadow-md transition-all hover:-translate-y-1">
          <h4 className="text-text-muted text-xs uppercase tracking-wider font-semibold leading-tight">CxP por Publicaciones</h4>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-[#DC2626] truncate" title={formatBs(data.cxpBs)}>{formatBs(data.cxpBs)}</p>
            <span className="bg-[#FEE2E2] text-[#DC2626] text-[0.65rem] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">{pesoPasivosCxP}%</span>
          </div>
          <p className="text-xs text-text-muted">{formatUsd(data.cxpUsd)} USD</p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-primary p-4 flex justify-between items-start relative hover:shadow-md transition-all hover:-translate-y-1">
          <div className="flex flex-col justify-center w-full">
            <h4 className="text-text-muted text-xs uppercase tracking-wider font-semibold">Socios Activos</h4>
            <div className="flex justify-between items-center mt-1">
              <p className="text-3xl font-bold text-primary">{totalSocios}</p>
              <Users size={24} className="text-primary opacity-50" />
            </div>
            <div className="flex justify-between mt-2 text-[0.7rem] text-text-muted">
              <span>SA: <strong>{data.totalSociosActivosSA}</strong> ({pctSA}%)</span>
              <span>SB: <strong>{data.totalSociosActivosSB}</strong> ({pctSB}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-[#3B82F6] p-4 flex justify-between items-start relative hover:shadow-md transition-all hover:-translate-y-1">
          <div className="flex flex-col justify-center w-full">
            <h4 className="text-text-muted text-xs uppercase tracking-wider font-semibold">Nuevos Ingresos</h4>
            <div className="flex justify-between items-center mt-1">
              <p className="text-3xl font-bold text-[#3B82F6]">+{totalNuevos}</p>
              <UserPlus size={24} className="text-[#3B82F6] opacity-50" />
            </div>
            <div className="flex justify-between mt-2 text-[0.7rem] text-text-muted">
              <span className="bg-[#EFF6FF] text-[#3B82F6] px-2 py-0.5 rounded font-semibold">+{crecimientoSocios}% Crecimiento</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fila secundaria de KPIs (Otros) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted uppercase font-semibold">Otros Ingresos</p>
            <p className="text-lg font-bold text-[#16A34A]">{formatBs(data.otrosIngresosBs)}</p>
          </div>
          <div className="bg-[#DCFCE7] text-[#16A34A] px-2 py-1 rounded text-xs font-bold">~ {formatUsd(data.otrosIngresosBs / TASA_CAMBIO)} USD</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted uppercase font-semibold">Otros Egresos</p>
            <p className="text-lg font-bold text-[#DC2626]">{formatBs(data.otrosEgresosBs)}</p>
          </div>
          <div className="bg-[#FEE2E2] text-[#DC2626] px-2 py-1 rounded text-xs font-bold">~ {formatUsd(data.otrosEgresosBs / TASA_CAMBIO)} USD</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted uppercase font-semibold">Préstamos a Socios (Emitidos)</p>
            <p className="text-lg font-bold text-[#D97706]">{formatBs(data.prestamosBs)}</p>
          </div>
          <div className="bg-[#FEF3C7] text-[#D97706] px-2 py-1 rounded text-xs font-bold">~ {formatUsd(data.prestamosBs / TASA_CAMBIO)} USD</div>
        </div>
      </div>

      {/* Gráfico Principal (Ancho Completo) */}
      <div className="w-full mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-4 text-primary">Tendencia Mensual (Ingresos vs Egresos)</h3>
          <div className="h-80 w-full">
            <MonthlyTrendChart data={data.monthlyTrend} />
          </div>
        </div>
      </div>

      {/* Grid Secundario de Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-base font-semibold mb-4 text-primary">Distribución de Ingresos</h3>
          <div className="flex-1 min-h-[250px]">
            <DistributionPieChart data={data.incomeDistribution} type="income" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-base font-semibold mb-4 text-primary">Distribución de Egresos</h3>
          <div className="flex-1 min-h-[250px]">
            <DistributionPieChart data={data.expenseDistribution} type="expense" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-base font-semibold mb-2 text-primary">Composición CxC por Publicaciones</h3>
          <p className="text-text-muted text-xs mb-4">Deuda agrupada por concepto.</p>
          <div className="flex-1 min-h-[250px]">
            <CxCStackedBarChart data={data.cxcComposition} />
          </div>
        </div>
      </div>
    </div>
  );
}
