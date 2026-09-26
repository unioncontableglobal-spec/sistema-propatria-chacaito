'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { labelFiltro } from '@/lib/mesUtils';
import { Scale, Loader2, CheckCircle2, AlertCircle, Printer, RefreshCw } from 'lucide-react';

export default function BalanceComprobacionPage() {
  const { filtroMesGlobal } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const cargarBalance = useCallback(async (mes: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/reportes/balance-comprobacion?mes=${encodeURIComponent(mes)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setHasFetched(true);
    } catch (err: any) {
      setError(err.message);
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ejecutar cuando cambia el filtro (incluyendo al montar el componente)
  useEffect(() => {
    // filtroMesGlobal tiene valor por defecto 'HISTÓRICO TOTAL' en el store,
    // así que siempre habrá un valor válido para cargar
    cargarBalance(filtroMesGlobal);
  }, [filtroMesGlobal, cargarBalance]);

  const formatBs = (amount: number) => {
    if (isNaN(amount) || amount === null) return 'Bs. 0,00';
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' Bs.';
  };

  return (
    <div className="p-4 md:p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600 shrink-0">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#0F172A]">Balance de Comprobación</h1>
            <p className="text-gray-500 text-sm">
              Acumulado al corte de: <span className="font-semibold text-gray-700">{labelFiltro(filtroMesGlobal)}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => cargarBalance(filtroMesGlobal)}
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
          <Loader2 size={40} className="animate-spin text-emerald-500 mb-4" />
          <p className="text-gray-500 font-medium">Calculando saldos contables...</p>
          <p className="text-gray-400 text-sm mt-1">Esto puede tomar unos segundos</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle size={40} className="text-red-500 mb-4" />
          <p className="text-red-700 font-bold text-lg">Error al cargar el Balance</p>
          <p className="text-red-500 text-sm mt-1 mb-4">{error}</p>
          <button
            onClick={() => cargarBalance(filtroMesGlobal)}
            className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && hasFetched && !data && (
        <div className="text-center py-20 text-gray-500">
          No se encontraron datos. Verifica que haya transacciones contabilizadas.
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Tarjeta de Cuadre */}
          <div className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-3 ${data.totales?.cuadrado ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3">
              {data.totales?.cuadrado ? (
                <CheckCircle2 className="text-emerald-500 shrink-0" size={32} />
              ) : (
                <AlertCircle className="text-red-500 shrink-0" size={32} />
              )}
              <div>
                <h3 className={`font-bold text-base md:text-lg ${data.totales?.cuadrado ? 'text-emerald-800' : 'text-red-800'}`}>
                  {data.totales?.cuadrado ? '¡El Balance está Cuadrado!' : '¡Alerta! El Balance no Cuadra'}
                </h3>
                <p className={`text-sm ${data.totales?.cuadrado ? 'text-emerald-600' : 'text-red-600'}`}>
                  Diferencia: {formatBs(Math.abs((data.totales?.debe || 0) - (data.totales?.haber || 0)))}
                </p>
              </div>
            </div>
            <div className="flex gap-6 sm:gap-8 text-sm ml-11 sm:ml-0">
              <div className="text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold">Total Debe</p>
                <p className="font-bold text-gray-800">{formatBs(data.totales?.debe || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold">Total Haber</p>
                <p className="font-bold text-gray-800">{formatBs(data.totales?.haber || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold">N° Cuentas</p>
                <p className="font-bold text-gray-800">{data.cuentas?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Tabla - Responsive con overflow */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none">
            <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table className="w-full text-sm text-left min-w-[700px]">
                <thead className="bg-[#0F172A] text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-24 text-xs">Código</th>
                    <th className="px-4 py-3 font-semibold text-xs">Cuenta Contable</th>
                    <th className="px-4 py-3 font-semibold text-right text-xs">Sumas Debe (Bs)</th>
                    <th className="px-4 py-3 font-semibold text-right text-xs">Sumas Haber (Bs)</th>
                    <th className="px-4 py-3 font-semibold text-right text-xs">Saldo Deudor (Bs)</th>
                    <th className="px-4 py-3 font-semibold text-right text-xs">Saldo Acreedor (Bs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.cuentas.map((c: any) => (
                    <tr key={c.codigo} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-gray-500 text-xs">{c.codigo}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-800 text-xs">{c.nombre}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600 text-xs">
                        {c.totalDebe > 0 ? formatBs(c.totalDebe) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600 text-xs">
                        {c.totalHaber > 0 ? formatBs(c.totalHaber) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-blue-700 text-xs">
                        {(c.tipoSaldo === 'DEUDOR' && c.saldoActual > 0) ? formatBs(c.saldoActual) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-emerald-700 text-xs">
                        {(c.tipoSaldo === 'ACREEDOR' && c.saldoActual > 0) ? formatBs(c.saldoActual) : '-'}
                      </td>
                    </tr>
                  ))}

                  {/* Fila de Totales */}
                  <tr className="bg-[#0F172A] text-white font-bold border-t-2 border-gray-300">
                    <td colSpan={2} className="px-4 py-3 text-right uppercase text-xs tracking-wider">TOTALES GENERALES:</td>
                    <td className="px-4 py-3 text-right text-blue-300 text-xs">{formatBs(data.totales?.debe || 0)}</td>
                    <td className="px-4 py-3 text-right text-blue-300 text-xs">{formatBs(data.totales?.haber || 0)}</td>
                    <td className="px-4 py-3 text-right text-emerald-300 text-xs">
                      {formatBs(data.cuentas.filter((c: any) => c.tipoSaldo === 'DEUDOR').reduce((a: number, c: any) => a + (c.saldoActual || 0), 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-300 text-xs">
                      {formatBs(data.cuentas.filter((c: any) => c.tipoSaldo === 'ACREEDOR').reduce((a: number, c: any) => a + (c.saldoActual || 0), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
