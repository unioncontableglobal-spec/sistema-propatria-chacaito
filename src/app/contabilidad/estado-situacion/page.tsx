'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { labelFiltro } from '@/lib/mesUtils';
import { PieChart, Loader2, AlertCircle, Printer, RefreshCw } from 'lucide-react';

export default function EstadoSituacionPage() {
  const { filtroMesGlobal } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarEstado = useCallback(async (mes: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/reportes/estado-situacion?mes=${encodeURIComponent(mes)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEstado(filtroMesGlobal);
  }, [filtroMesGlobal, cargarEstado]);

  const formatBs = (amount: number) => {
    if (isNaN(amount) || amount === null) return '0,00';
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600 shrink-0">
            <PieChart size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#0F172A]">Estado de Situación Financiera</h1>
            <p className="text-gray-500 text-sm">
              Al corte de: <span className="font-semibold text-gray-700">{labelFiltro(filtroMesGlobal)}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => cargarEstado(filtroMesGlobal)}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Recargar
          </button>
          <button
            className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Imprimir
          </button>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500 font-medium">Calculando estado de situación financiera...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle size={40} className="text-red-500 mb-4" />
          <p className="text-red-700 font-bold text-lg">Error al cargar el Estado</p>
          <p className="text-red-500 text-sm mt-1 mb-4">{error}</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && data && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none">
          <div className="hidden print:block text-center pt-8 pb-4 border-b border-gray-400 mb-6">
            <h1 className="text-2xl font-black uppercase tracking-widest text-[#0A1128]">ASOC. CIVIL PROPATRIA CHACAITO</h1>
            <h2 className="text-lg font-semibold text-gray-700 uppercase mt-1">Estado de Situación Financiera</h2>
            <p className="text-sm font-medium text-gray-500">Al {labelFiltro(filtroMesGlobal)}</p>
            <p className="text-xs text-gray-400 mt-1">Expresado en Bolívares (Bs.)</p>
          </div>

          <div className="p-6">
            {/* ECUACIÓN CONTABLE: ACTIVO = PASIVO + PATRIMONIO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* LADO IZQUIERDO: ACTIVOS */}
              <div>
                <h3 className="text-lg font-bold text-blue-800 border-b-2 border-blue-800 pb-2 mb-4 uppercase tracking-wider">Activos</h3>
                {data.activos.length === 0 ? (
                  <p className="text-gray-400 italic text-sm py-2">No hay saldos de activos.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.activos.map((a: any) => (
                      <li key={a.codigo} className="flex justify-between items-center text-sm group hover:bg-gray-50 px-2 py-1 -mx-2 rounded">
                        <span className="text-gray-700 flex-1"><span className="text-gray-400 text-xs mr-2">{a.codigo}</span> {a.nombre}</span>
                        <span className="font-medium text-gray-900">{formatBs(a.saldo)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="mt-8 pt-4 border-t-2 border-gray-300 flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                  <span className="font-bold text-blue-900 uppercase text-sm tracking-wider">Total Activos</span>
                  <span className="font-black text-blue-900 text-lg border-double border-b-4 border-blue-900">{formatBs(data.totales.activos)}</span>
                </div>
              </div>

              {/* LADO DERECHO: PASIVOS Y PATRIMONIO */}
              <div className="flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-800 border-b-2 border-red-800 pb-2 mb-4 uppercase tracking-wider">Pasivos</h3>
                  {data.pasivos.length === 0 ? (
                    <p className="text-gray-400 italic text-sm py-2">No hay saldos de pasivos.</p>
                  ) : (
                    <ul className="space-y-3">
                      {data.pasivos.map((p: any) => (
                        <li key={p.codigo} className="flex justify-between items-center text-sm group hover:bg-gray-50 px-2 py-1 -mx-2 rounded">
                          <span className="text-gray-700 flex-1"><span className="text-gray-400 text-xs mr-2">{p.codigo}</span> {p.nombre}</span>
                          <span className="font-medium text-gray-900">{formatBs(p.saldo)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center px-2">
                    <span className="font-bold text-gray-700 uppercase text-xs tracking-wider">Total Pasivos</span>
                    <span className="font-bold text-gray-900">{formatBs(data.totales.pasivos)}</span>
                  </div>

                  <h3 className="text-lg font-bold text-emerald-700 border-b-2 border-emerald-700 pb-2 mb-4 mt-8 uppercase tracking-wider">Patrimonio</h3>
                  {data.patrimonio.length === 0 && data.resultadoEjercicio === 0 ? (
                    <p className="text-gray-400 italic text-sm py-2">No hay saldos de patrimonio.</p>
                  ) : (
                    <ul className="space-y-3">
                      {data.patrimonio.map((p: any) => (
                        <li key={p.codigo} className="flex justify-between items-center text-sm group hover:bg-gray-50 px-2 py-1 -mx-2 rounded">
                          <span className="text-gray-700 flex-1"><span className="text-gray-400 text-xs mr-2">{p.codigo}</span> {p.nombre}</span>
                          <span className="font-medium text-gray-900">{formatBs(p.saldo)}</span>
                        </li>
                      ))}
                      {/* Fila Especial para Resultado del Ejercicio */}
                      <li className="flex justify-between items-center text-sm group hover:bg-emerald-50 px-2 py-2 -mx-2 rounded font-semibold text-emerald-800">
                        <span className="flex-1">Resultado del Ejercicio (Ganancia/Pérdida)</span>
                        <span>{formatBs(data.resultadoEjercicio)}</span>
                      </li>
                    </ul>
                  )}

                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center px-2">
                    <span className="font-bold text-gray-700 uppercase text-xs tracking-wider">Total Patrimonio</span>
                    <span className="font-bold text-gray-900">{formatBs(data.totales.patrimonio)}</span>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t-2 border-gray-300 flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                  <span className="font-bold text-gray-800 uppercase text-sm tracking-wider">Total Pasivo + Patrimonio</span>
                  <span className="font-black text-gray-900 text-lg border-double border-b-4 border-gray-900">{formatBs(data.totales.pasivoMasPatrimonio)}</span>
                </div>
              </div>
              
            </div>
            
            {/* Ecuación Check */}
            <div className={`mt-10 p-4 border rounded-xl flex items-center justify-between shadow-sm print:shadow-none ${data.totales.cuadrado ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-3">
                {data.totales.cuadrado ? (
                  <CheckCircle2 className="text-green-600" size={24} />
                ) : (
                  <AlertCircle className="text-red-600" size={24} />
                )}
                <div>
                  <h4 className={`font-bold ${data.totales.cuadrado ? 'text-green-800' : 'text-red-800'}`}>
                    {data.totales.cuadrado ? 'Balance Cuadrado' : 'Balance Descuadrado'}
                  </h4>
                  <p className={`text-sm ${data.totales.cuadrado ? 'text-green-700' : 'text-red-700'}`}>
                    Diferencia: {formatBs(data.totales.activos - data.totales.pasivoMasPatrimonio)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
