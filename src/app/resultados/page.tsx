'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';

type Transaccion = {
  id: string;
  tipo: 'INGRESO' | 'EGRESO';
  fecha: string;
  mes: string;
  monto_bs: number;
  monto_usd: number | null;
  clasificacion: string;
  codigo_concepto: string;
  detalle: string;
};

export default function ResultadosPage() {
  const { filtroMesGlobal } = useAppStore();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransacciones();
  }, []);

  const fetchTransacciones = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transacciones');
      if (!res.ok) throw new Error('Error al cargar datos');
      const data = await res.json();
      setTransacciones(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado por mes seleccionado o histórico total
  const filteredData = useMemo(() => {
    if (!filtroMesGlobal || filtroMesGlobal === 'Todos') return transacciones;
    return transacciones.filter(t => t.mes === filtroMesGlobal);
  }, [transacciones, filtroMesGlobal]);

  // Cálculos de Utilidad
  const kpis = useMemo(() => {
    let ingresos = 0;
    let egresos = 0;

    filteredData.forEach(t => {
      // Usar USD si existe, sino convertir usando una tasa estimada o dejar 0
      const monto = t.monto_usd || 0; 
      if (t.tipo === 'INGRESO') ingresos += monto;
      if (t.tipo === 'EGRESO') egresos += monto;
    });

    const utilidad = ingresos - egresos;
    const margen = ingresos > 0 ? (utilidad / ingresos) * 100 : 0;

    return { ingresos, egresos, utilidad, margen };
  }, [filteredData]);

  // Histórico Mensual para la tabla
  const monthlyData = useMemo(() => {
    const months: Record<string, { ingresos: number, egresos: number }> = {};
    
    // Lista cronológica para ordenar después (Enero, Febrero...)
    const order = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

    transacciones.forEach(t => {
      if (!months[t.mes]) {
        months[t.mes] = { ingresos: 0, egresos: 0 };
      }
      const monto = t.monto_usd || 0;
      if (t.tipo === 'INGRESO') months[t.mes].ingresos += monto;
      if (t.tipo === 'EGRESO') months[t.mes].egresos += monto;
    });

    return Object.keys(months).map(mes => {
      const { ingresos, egresos } = months[mes];
      const utilidad = ingresos - egresos;
      const margen = ingresos > 0 ? (utilidad / ingresos) * 100 : 0;
      return { mes, ingresos, egresos, utilidad, margen };
    }).sort((a, b) => {
      // Orden cronológico asumiendo mismo año por ahora
      return order.indexOf(a.mes) - order.indexOf(b.mes);
    });
  }, [transacciones]);

  // Recomendación algorítmica
  const getDiagnostic = () => {
    if (kpis.ingresos === 0 && kpis.egresos === 0) return [];
    
    const rules = [];
    
    // Liquidez
    if (kpis.utilidad < 0) {
      rules.push({
        tipo: 'alerta',
        titulo: 'Déficit Financiero',
        mensaje: `El período cerró en rojo con una pérdida de $${Math.abs(kpis.utilidad).toFixed(2)}. Los egresos superaron la capacidad de recaudación.`
      });
    } else {
      rules.push({
        tipo: 'exito',
        titulo: 'Superávit Saludable',
        mensaje: `Se alcanzó una utilidad neta positiva de $${kpis.utilidad.toFixed(2)}, reteniendo el ${kpis.margen.toFixed(1)}% de los ingresos totales.`
      });
    }

    // Riesgo Operativo
    if (kpis.ingresos > 0 && (kpis.egresos / kpis.ingresos) > 0.8) {
      rules.push({
        tipo: 'advertencia',
        titulo: 'Alerta de Margen',
        mensaje: 'Los gastos consumen más del 80% de los ingresos. Se recomienda un recorte de egresos no esenciales o incentivar cobranzas atrasadas.'
      });
    }

    return rules;
  };

  const diagnostics = getDiagnostic();

  const formatUsd = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Auditando transacciones y calculando estado de resultados...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">Error: {error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen pb-24">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-8 print-hide">
        <div>
          <h1 className="text-2xl font-black text-[#0A1128] tracking-tight">Auditoría de Resultados</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Análisis de Utilidad, Ingresos vs Egresos y Diagnóstico.</p>
        </div>
        <button onClick={() => window.print()} className="bg-white border border-gray-200 text-[#0A1128] px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Imprimir
        </button>
      </div>

      {/* RIF HEADER FOR PRINT ONLY */}
      <div className="hidden print-show-block text-center mb-8 border-b-2 border-[#0A1128] pb-4">
        <h1 className="text-2xl font-black text-[#0A1128] tracking-widest uppercase">Unión Contable Global</h1>
        <p className="text-sm font-bold text-gray-600">RIF: J-50714716-9</p>
        <h2 className="text-xl font-bold text-[#0A1128] mt-4 uppercase">Estado de Resultados (Ingresos vs Egresos)</h2>
        <p className="text-sm text-gray-500 font-semibold mt-1">Período Auditado: {filtroMesGlobal || 'Histórico Total'}</p>
      </div>

      {/* RESUMEN EJECUTIVO (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border-l-4 border-blue-600 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ingresos Totales</p>
          <p className="text-3xl font-black text-blue-600">{formatUsd(kpis.ingresos)}</p>
        </div>
        
        <div className="bg-white border-l-4 border-red-600 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Egresos (Gastos)</p>
          <p className="text-3xl font-black text-red-600">{formatUsd(kpis.egresos)}</p>
        </div>

        <div className={`bg-[#0A1128] text-white border-l-4 rounded-2xl p-6 shadow-sm ${kpis.utilidad >= 0 ? 'border-yellow-400' : 'border-red-500'}`}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            {kpis.utilidad >= 0 ? 'Utilidad Neta (Superávit)' : 'Pérdida Neta (Déficit)'}
          </p>
          <p className={`text-3xl font-black ${kpis.utilidad >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
            {formatUsd(kpis.utilidad)}
          </p>
        </div>

        <div className="bg-white border-l-4 border-gray-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Margen de Utilidad</p>
          <p className="text-3xl font-black text-[#0A1128]">{kpis.margen.toFixed(1)}%</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
            <div className={`h-1.5 rounded-full ${kpis.margen > 0 ? 'bg-blue-600' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.max(kpis.margen, 0), 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* DIAGNOSTICO FINANCIERO IA-LIKE */}
      <div className="mb-10 bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 border-b border-blue-200 pb-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h3 className="text-base font-black text-[#0A1128] uppercase tracking-wider">Diagnóstico Financiero Automatizado</h3>
        </div>
        
        {diagnostics.length === 0 ? (
          <p className="text-sm text-gray-500 font-medium">No hay suficientes datos procesados en este período para generar un diagnóstico.</p>
        ) : (
          <div className="space-y-4">
            {diagnostics.map((d, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className={`mt-0.5 w-2 h-2 rounded-full ${d.tipo === 'exito' ? 'bg-blue-600' : d.tipo === 'alerta' ? 'bg-red-600' : 'bg-yellow-500'}`}></div>
                <div>
                  <h4 className="text-sm font-bold text-[#0A1128]">{d.titulo}</h4>
                  <p className="text-sm text-gray-700 mt-1">{d.mensaje}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TABLA HISTORICA MES A MES */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-black text-[#0A1128] uppercase tracking-wider flex items-center gap-2">
            <svg className="text-blue-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Histórico Mensual Acumulado
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mes</th>
                <th className="py-4 px-6 text-[10px] font-black text-blue-600 uppercase tracking-widest text-right">Ingresos</th>
                <th className="py-4 px-6 text-[10px] font-black text-red-600 uppercase tracking-widest text-right">Egresos</th>
                <th className="py-4 px-6 text-[10px] font-black text-[#0A1128] uppercase tracking-widest text-right">Utilidad Neta</th>
                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Margen</th>
                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthlyData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-400 font-medium">No hay data histórica registrada.</td>
                </tr>
              ) : monthlyData.map((row) => (
                <tr key={row.mes} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-4 px-6 text-xs font-bold text-gray-800">{row.mes}</td>
                  <td className="py-4 px-6 text-sm font-black text-blue-600 text-right">{formatUsd(row.ingresos)}</td>
                  <td className="py-4 px-6 text-sm font-black text-red-600 text-right">{formatUsd(row.egresos)}</td>
                  <td className={`py-4 px-6 text-sm font-black text-right ${row.utilidad >= 0 ? 'text-[#0A1128]' : 'text-red-500'}`}>
                    {formatUsd(row.utilidad)}
                  </td>
                  <td className="py-4 px-6 text-xs font-bold text-gray-500 text-right">{row.margen.toFixed(1)}%</td>
                  <td className="py-4 px-6 text-center">
                    {row.utilidad >= 0 ? (
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded-md uppercase">Superávit</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-1 rounded-md uppercase">Déficit</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
