'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Scale, Loader2, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function BalanceComprobacionPage() {
  const { filtroMesGlobal } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarBalance();
  }, [filtroMesGlobal]);

  const cargarBalance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reportes/balance-comprobacion?mes=${filtroMesGlobal}`);
      if (!res.ok) throw new Error('Error al cargar balance');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatBs = (amount: number) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(amount || 0);
  };

  const labelFiltro = (mes: string) => {
    if (mes === 'HISTORICO') return 'HISTÓRICO GENERAL';
    const [year, month] = mes.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Balance de Comprobación</h1>
            <p className="text-gray-500">Acumulado al corte de: {labelFiltro(filtroMesGlobal)}</p>
          </div>
        </div>
        <button 
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          onClick={() => window.print()}
        >
          <Download size={18} />
          Exportar PDF
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-emerald-500 mb-4" />
          <p className="text-gray-500">Calculando saldos...</p>
        </div>
      ) : data ? (
        <>
          {/* Tarjeta de Cuadre */}
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between shadow-sm ${data.totales.cuadrado ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center gap-3">
              {data.totales.cuadrado ? (
                <CheckCircle2 className="text-emerald-500" size={32} />
              ) : (
                <AlertCircle className="text-red-500" size={32} />
              )}
              <div>
                <h3 className={`font-bold ${data.totales.cuadrado ? 'text-emerald-800' : 'text-red-800'}`}>
                  {data.totales.cuadrado ? '¡El Balance está Cuadrado!' : '¡Alerta! El Balance no Cuadra'}
                </h3>
                <p className={`text-sm ${data.totales.cuadrado ? 'text-emerald-600' : 'text-red-600'}`}>
                  Diferencia: {formatBs(Math.abs(data.totales.debe - data.totales.haber))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#0F172A] text-white">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-24">Código</th>
                    <th className="px-6 py-4 font-semibold">Cuenta Contable</th>
                    <th className="px-6 py-4 font-semibold text-right">Sumas del Debe (Bs)</th>
                    <th className="px-6 py-4 font-semibold text-right">Sumas del Haber (Bs)</th>
                    <th className="px-6 py-4 font-semibold text-right">Saldo Deudor (Bs)</th>
                    <th className="px-6 py-4 font-semibold text-right">Saldo Acreedor (Bs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.cuentas.map((c: any) => (
                    <tr key={c.codigo} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-500">{c.codigo}</td>
                      <td className="px-6 py-3 font-semibold text-gray-800">{c.nombre}</td>
                      
                      {/* Sumas */}
                      <td className="px-6 py-3 text-right text-gray-600">
                        {c.totalDebe > 0 ? formatBs(c.totalDebe) : '-'}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600">
                        {c.totalHaber > 0 ? formatBs(c.totalHaber) : '-'}
                      </td>

                      {/* Saldos */}
                      <td className="px-6 py-3 text-right font-medium text-gray-900">
                        {(c.tipoSaldo === 'DEUDOR' && c.saldoActual > 0) ? formatBs(c.saldoActual) : '-'}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">
                        {(c.tipoSaldo === 'ACREEDOR' && c.saldoActual > 0) ? formatBs(c.saldoActual) : '-'}
                      </td>
                    </tr>
                  ))}

                  {/* Fila de Totales */}
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td colSpan={2} className="px-6 py-4 text-right uppercase text-gray-700">Totales Generales:</td>
                    <td className="px-6 py-4 text-right text-blue-700">{formatBs(data.totales.debe)}</td>
                    <td className="px-6 py-4 text-right text-blue-700">{formatBs(data.totales.haber)}</td>
                    
                    {/* Suma de saldos deudores y acreedores (Deberian cuadrar igual que las sumas) */}
                    <td className="px-6 py-4 text-right text-emerald-700">
                      {formatBs(data.cuentas.filter((c: any) => c.tipoSaldo === 'DEUDOR').reduce((a: number, c: any) => a + c.saldoActual, 0))}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-700">
                      {formatBs(data.cuentas.filter((c: any) => c.tipoSaldo === 'ACREEDOR').reduce((a: number, c: any) => a + c.saldoActual, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">No hay datos para mostrar en este período.</div>
      )}
    </div>
  );
}
