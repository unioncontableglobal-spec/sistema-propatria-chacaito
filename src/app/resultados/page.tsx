'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';

// ─── Tipos correctos que coinciden con la API ───────────────────────────────
type FormaPago = {
  tipo_pago: string;
  monto_bs: number;
  monto_usd: number | null;
  tasa_cambio: number | null;
};

type Transaccion = {
  id: string;
  tipo: 'INGRESO' | 'EGRESO';
  fecha: string;
  mes: string;
  monto_bs: number;
  monto_usd: number | null;
  tasa_cambio: number | null;   // ← campo real de la BD
  clasificacion: string | null;
  codigo_concepto: string | null;
  detalle: string | null;
  formas_pago: FormaPago[];
};

// ─── Orden de meses para ordenar la tabla ──────────────────────────────────
const ORDER_MESES = [
  'ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
  'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'
];

// ─── Convierte una transacción a USD real usando avgTasa ───────────────────
function toRealUsd(tx: Transaccion, avgTasa: number): number {
  const usd  = Number(tx.monto_usd  || 0);
  const bs   = Number(tx.monto_bs   || 0);
  const tasa = Number(tx.tasa_cambio || 0);
  // "Efecto 1 USD" o sin USD: convertir desde Bs
  if (usd === 0 || (usd === 1 && tasa > 0 && Math.abs(tasa - bs) < 1)) {
    return bs / (avgTasa > 0 ? avgTasa : 1);
  }
  return usd;
}

// ─── Calcula tasa promedio de un conjunto de transacciones ─────────────────
function calcAvgTasa(list: Transaccion[]): number {
  let sum = 0; let count = 0;
  list.forEach(tx => {
    const usd  = Number(tx.monto_usd  || 0);
    const bs   = Number(tx.monto_bs   || 0);
    const tasa = Number(tx.tasa_cambio || 0);
    const esEfecto1 = usd === 1 && tasa > 0 && Math.abs(tasa - bs) < 1;
    if (!esEfecto1 && tasa > 1) { sum += tasa; count++; }
  });
  return count > 0 ? sum / count : 360;
}

// ─── Formateador USD ───────────────────────────────────────────────────────
const fmtUsd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const fmtNum = (v: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

// ──────────────────────────────────────────────────────────────────────────
export default function ResultadosPage() {
  const { filtroMesGlobal } = useAppStore();
  const [ingresos, setIngresos]     = useState<Transaccion[]>([]);
  const [egresos, setEgresos]       = useState<Transaccion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Peticiones paralelas, sin límite de 500 (le pedimos todo)
      const [ri, re] = await Promise.all([
        fetch('/api/recibos/historial?tipo=INGRESO&limit=9999'),
        fetch('/api/recibos/historial?tipo=EGRESO&limit=9999'),
      ]);
      const di = await ri.json();
      const de = await re.json();
      setIngresos(di.data ?? []);
      setEgresos(de.data  ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  // ── Helper: aplica filtros de fecha y mes a cualquier lista ─────────────
  const applyFilters = (list: Transaccion[]) => {
    // Filtro por rango de fechas (prioridad máxima)
    if (fechaDesde || fechaHasta) {
      return list.filter(t => {
        const d = new Date(t.fecha);
        if (fechaDesde && d < new Date(fechaDesde)) return false;
        if (fechaHasta) {
          const hasta = new Date(fechaHasta); hasta.setHours(23,59,59,999);
          if (d > hasta) return false;
        }
        return true;
      });
    }
    // Filtro por mes global
    if (filtroMesGlobal && filtroMesGlobal !== 'HISTÓRICO TOTAL') {
      return list.filter(t => t.mes === filtroMesGlobal);
    }
    return list;
  };

  const filtIngresos = useMemo(() => applyFilters(ingresos), [ingresos, filtroMesGlobal, fechaDesde, fechaHasta]);
  const filtEgresos  = useMemo(() => applyFilters(egresos),  [egresos,  filtroMesGlobal, fechaDesde, fechaHasta]);

  // ── KPIs del período seleccionado ────────────────────────────────────────
  const kpis = useMemo(() => {
    const all     = [...filtIngresos, ...filtEgresos];
    const avgTasa = calcAvgTasa(all);

    let totalIngresos = 0;
    let totalEgresos  = 0;

    filtIngresos.forEach(t => { totalIngresos += toRealUsd(t, avgTasa); });
    filtEgresos.forEach(t  => { totalEgresos  += toRealUsd(t, avgTasa); });

    const utilidad = totalIngresos - totalEgresos;
    const margen   = totalIngresos > 0 ? (utilidad / totalIngresos) * 100 : 0;
    const ratio    = totalIngresos > 0 ? (totalEgresos / totalIngresos) * 100 : 0;

    return { totalIngresos, totalEgresos, utilidad, margen, ratio, avgTasa };
  }, [filtIngresos, filtEgresos]);

  // ── Tabla histórica por mes (usa siempre el total histórico para mostrar todos) ─
  const monthlyData = useMemo(() => {
    // Siempre mostramos todos los meses disponibles para comparación histórica
    const all     = [...ingresos, ...egresos];
    const avgTasa = calcAvgTasa(all);

    const months: Record<string, { ing: number; egr: number }> = {};

    ingresos.forEach(t => {
      if (!months[t.mes]) months[t.mes] = { ing: 0, egr: 0 };
      months[t.mes].ing += toRealUsd(t, avgTasa);
    });
    egresos.forEach(t => {
      if (!months[t.mes]) months[t.mes] = { ing: 0, egr: 0 };
      months[t.mes].egr += toRealUsd(t, avgTasa);
    });

    return Object.keys(months)
      .map(mes => {
        const { ing, egr } = months[mes];
        const util   = ing - egr;
        const margen = ing > 0 ? (util / ing) * 100 : 0;
        return { mes, ing, egr, util, margen };
      })
      .sort((a, b) => ORDER_MESES.indexOf(a.mes) - ORDER_MESES.indexOf(b.mes));
  }, [ingresos, egresos]);

  // ── Diagnóstico financiero ───────────────────────────────────────────────
  const diagnostics = useMemo(() => {
    const { totalIngresos, totalEgresos, utilidad, margen, ratio } = kpis;
    if (totalIngresos === 0 && totalEgresos === 0) return [];

    const list: { tipo: string; titulo: string; mensaje: string }[] = [];

    if (utilidad < 0) {
      list.push({
        tipo: 'alerta',
        titulo: 'Déficit Financiero',
        mensaje: `El período cerró con una pérdida neta de ${fmtUsd(Math.abs(utilidad))}. Los egresos superaron los ingresos en ${fmtNum(Math.abs(margen))}%.`,
      });
    } else {
      list.push({
        tipo: 'exito',
        titulo: 'Superávit Saludable',
        mensaje: `Utilidad neta positiva de ${fmtUsd(utilidad)}, reteniendo el ${fmtNum(margen)}% de los ingresos totales.`,
      });
    }

    if (ratio > 80 && utilidad >= 0) {
      list.push({
        tipo: 'advertencia',
        titulo: 'Alerta de Margen Operativo',
        mensaje: `Los egresos consumen el ${fmtNum(ratio)}% de los ingresos. Se recomienda revisar gastos variables y acelerar la cobranza.`,
      });
    }

    if (ratio > 0 && ratio <= 50) {
      list.push({
        tipo: 'info',
        titulo: 'Estructura de Costo Eficiente',
        mensaje: `La relación Egreso/Ingreso es del ${fmtNum(ratio)}%. La asociación opera con holgura financiera saludable.`,
      });
    }

    return list;
  }, [kpis]);

  // ── Período label ────────────────────────────────────────────────────────
  const periodoLabel = fechaDesde || fechaHasta
    ? `Desde ${fechaDesde || '—'} hasta ${fechaHasta || 'hoy'}`
    : filtroMesGlobal === 'HISTÓRICO TOTAL' || !filtroMesGlobal
    ? 'Histórico Total'
    : filtroMesGlobal;

  // ── Estados de carga / error ─────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-semibold text-gray-500">Auditando base de datos financiera…</p>
    </div>
  );
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-600 font-bold text-sm">Error: {error}</p>
      <button onClick={fetchAll} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">Reintentar</button>
    </div>
  );

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen pb-24">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 print-hide">
        <div>
          <h1 className="text-2xl font-black text-[#0A1128] tracking-tight">Auditoría de Resultados</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Estado de Resultados · <span className="font-bold text-blue-600">{periodoLabel}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de fechas */}
          <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Desde</span>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className="text-xs font-semibold text-[#0A1128] bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"/>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hasta</span>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className="text-xs font-semibold text-[#0A1128] bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"/>
            {(fechaDesde || fechaHasta) && (
              <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                className="text-gray-400 hover:text-red-500 transition-colors" title="Limpiar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
          <button onClick={() => window.print()}
            className="bg-[#0A1128] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 h-[38px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir PDF
          </button>
        </div>
      </div>

      {/* ── PRINT HEADER ───────────────────────────────────────────────── */}
      <div className="hidden print-show-block text-center mb-8 border-b-2 border-[#0A1128] pb-4">
        <h1 className="text-xl font-black text-[#0A1128] uppercase tracking-widest">Asoc. Civil Propatria Chacaito · RIF: J-00188684-2</h1>
        <h2 className="text-lg font-bold text-[#0A1128] mt-2 uppercase">Estado de Resultados — Ingresos vs Egresos</h2>
        <p className="text-sm text-gray-500 font-semibold mt-1">Período: {periodoLabel}</p>
        <p className="text-xs text-gray-400 mt-1">Desarrollado por Unión Contable Global · RIF: J-50714716-9</p>
      </div>

      {/* ── KPIs PRINCIPALES ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Ingresos */}
        <div className="bg-white border-l-4 border-blue-600 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ingresos Totales</p>
          <p className="text-2xl font-black text-blue-600">{fmtUsd(kpis.totalIngresos)}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-semibold">{filtIngresos.length} transacciones</p>
        </div>

        {/* Egresos */}
        <div className="bg-white border-l-4 border-red-600 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Egresos (Gastos)</p>
          <p className="text-2xl font-black text-red-600">{fmtUsd(kpis.totalEgresos)}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-semibold">{filtEgresos.length} transacciones</p>
        </div>

        {/* Utilidad / Déficit */}
        <div className={`rounded-2xl p-5 shadow-sm border-l-4 ${kpis.utilidad >= 0 ? 'bg-[#0A1128] border-yellow-400' : 'bg-red-700 border-red-300'}`}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            {kpis.utilidad >= 0 ? 'Utilidad Neta' : 'Pérdida Neta'}
          </p>
          <p className={`text-2xl font-black ${kpis.utilidad >= 0 ? 'text-yellow-400' : 'text-white'}`}>
            {fmtUsd(kpis.utilidad)}
          </p>
          <p className="text-[10px] text-gray-400 mt-2 font-semibold">
            {kpis.utilidad >= 0 ? '✓ Superávit' : '✗ Déficit'}
          </p>
        </div>

        {/* Margen */}
        <div className="bg-white border-l-4 border-gray-700 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Margen Neto</p>
          <p className={`text-2xl font-black ${kpis.margen >= 0 ? 'text-[#0A1128]' : 'text-red-600'}`}>
            {kpis.margen.toFixed(1)}%
          </p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className={`h-1.5 rounded-full transition-all ${kpis.margen >= 0 ? 'bg-blue-600' : 'bg-red-500'}`}
              style={{ width: `${Math.min(Math.abs(kpis.margen), 100)}%` }}/>
          </div>
        </div>
      </div>

      {/* ── KPIs SECUNDARIOS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Relación Gasto/Ingreso</p>
          <p className="text-xl font-black text-[#0A1128]">{kpis.ratio.toFixed(1)}%</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
            <div className={`h-2 rounded-full ${kpis.ratio > 80 ? 'bg-red-500' : kpis.ratio > 60 ? 'bg-yellow-500' : 'bg-blue-600'}`}
              style={{ width: `${Math.min(kpis.ratio, 100)}%` }}/>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold">
            {kpis.ratio > 80 ? '⚠ Zona de riesgo' : kpis.ratio > 60 ? '⚡ Zona de alerta' : '✓ Zona saludable'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tasa Cambio Promedio</p>
          <p className="text-xl font-black text-[#0A1128]">Bs. {kpis.avgTasa.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-semibold">Usada para conversión histórica</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Transacciones</p>
          <p className="text-xl font-black text-[#0A1128]">{filtIngresos.length + filtEgresos.length}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-semibold">
            {filtIngresos.length} ingresos · {filtEgresos.length} egresos
          </p>
        </div>
      </div>

      {/* ── DIAGNÓSTICO ────────────────────────────────────────────────── */}
      {diagnostics.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 border-b border-blue-100 pb-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3 className="text-sm font-black text-[#0A1128] uppercase tracking-wider">Diagnóstico Financiero Automatizado</h3>
          </div>
          <div className="space-y-3">
            {diagnostics.map((d, i) => (
              <div key={i} className="flex gap-3 items-start bg-white rounded-xl p-3 border border-gray-100">
                <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  d.tipo === 'exito' ? 'bg-blue-600' : d.tipo === 'alerta' ? 'bg-red-600' : d.tipo === 'advertencia' ? 'bg-yellow-500' : 'bg-gray-400'
                }`}/>
                <div>
                  <h4 className="text-xs font-black text-[#0A1128]">{d.titulo}</h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{d.mensaje}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TABLA HISTÓRICA ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-xs font-black text-[#0A1128] uppercase tracking-wider flex items-center gap-2">
            <svg className="text-blue-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
            </svg>
            Histórico Mensual Acumulado (Total Base de Datos)
          </h3>
          <span className="text-[10px] font-bold text-gray-400">{monthlyData.length} meses registrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mes</th>
                <th className="py-3 px-5 text-[10px] font-black text-blue-600 uppercase tracking-widest text-right">Ingresos</th>
                <th className="py-3 px-5 text-[10px] font-black text-red-600 uppercase tracking-widest text-right">Egresos</th>
                <th className="py-3 px-5 text-[10px] font-black text-[#0A1128] uppercase tracking-widest text-right">Utilidad</th>
                <th className="py-3 px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Margen</th>
                <th className="py-3 px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Barra</th>
                <th className="py-3 px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthlyData.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-gray-400 font-medium">No hay datos históricos registrados.</td></tr>
              ) : monthlyData.map(row => {
                const pctEgr = row.ing > 0 ? Math.min((row.egr / row.ing) * 100, 100) : 0;
                return (
                  <tr key={row.mes} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-5 text-xs font-bold text-gray-800 w-28">{row.mes}</td>
                    <td className="py-3 px-5 text-xs font-black text-blue-600 text-right tabular-nums">{fmtUsd(row.ing)}</td>
                    <td className="py-3 px-5 text-xs font-black text-red-600 text-right tabular-nums">{fmtUsd(row.egr)}</td>
                    <td className={`py-3 px-5 text-xs font-black text-right tabular-nums ${row.util >= 0 ? 'text-[#0A1128]' : 'text-red-500'}`}>
                      {fmtUsd(row.util)}
                    </td>
                    <td className="py-3 px-5 text-xs font-bold text-gray-500 text-right tabular-nums">{row.margen.toFixed(1)}%</td>
                    <td className="py-3 px-5">
                      <div className="flex gap-1 h-2 w-24 rounded-full overflow-hidden bg-gray-100 mx-auto">
                        <div className="bg-blue-500 h-full" style={{ width: `${100 - pctEgr}%` }}/>
                        <div className="bg-red-500 h-full" style={{ width: `${pctEgr}%` }}/>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-center">
                      {row.util >= 0
                        ? <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">Superávit</span>
                        : <span className="bg-red-100 text-red-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">Déficit</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totales */}
            {monthlyData.length > 0 && (() => {
              const totIng  = monthlyData.reduce((s, r) => s + r.ing, 0);
              const totEgr  = monthlyData.reduce((s, r) => s + r.egr, 0);
              const totUtil = totIng - totEgr;
              const totMrg  = totIng > 0 ? (totUtil / totIng) * 100 : 0;
              return (
                <tfoot>
                  <tr className="border-t-2 border-[#0A1128] bg-gray-50">
                    <td className="py-3 px-5 text-xs font-black text-[#0A1128]">TOTAL</td>
                    <td className="py-3 px-5 text-xs font-black text-blue-700 text-right tabular-nums">{fmtUsd(totIng)}</td>
                    <td className="py-3 px-5 text-xs font-black text-red-700 text-right tabular-nums">{fmtUsd(totEgr)}</td>
                    <td className={`py-3 px-5 text-xs font-black text-right tabular-nums ${totUtil >= 0 ? 'text-[#0A1128]' : 'text-red-600'}`}>{fmtUsd(totUtil)}</td>
                    <td className="py-3 px-5 text-xs font-black text-gray-600 text-right tabular-nums">{totMrg.toFixed(1)}%</td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
      </div>

    </div>
  );
}
