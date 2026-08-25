'use client';

import React, { useEffect, useState } from 'react';
import { Book, Download, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LibroDiarioPage() {
  const [asientos, setAsientos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mesFiltro, setMesFiltro] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    fetch('/api/asientos')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          // Filtrar por el mes seleccionado si aplica
          const filtrados = data.filter((a: any) => a.fecha.startsWith(mesFiltro));
          // Ordenar por fecha y luego por número de asiento ascendente (históricamente el diario se lee de viejo a nuevo)
          filtrados.sort((a: any, b: any) => {
            const dateA = new Date(a.fecha).getTime();
            const dateB = new Date(b.fecha).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return a.numero - b.numero;
          });
          setAsientos(filtrados);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [mesFiltro]);

  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) return '';
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  let granTotalDebe = 0;
  let granTotalHaber = 0;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg text-[#3B82F6]">
            <Book size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Libro Diario</h1>
            <p className="text-gray-500">Registro cronológico de operaciones</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input 
            type="month" 
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#3B82F6] outline-none font-medium text-gray-700"
          />
          <button className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors">
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando Libro Diario...</div>
        ) : asientos.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No hay registros contables para el mes de {format(new Date(mesFiltro + '-01T00:00:00'), 'MMMM yyyy', { locale: es })}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0F172A] text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold text-center w-28">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-center w-24">Asiento</th>
                  <th className="px-4 py-3 font-semibold w-1/3">Cuenta Contable</th>
                  <th className="px-4 py-3 font-semibold">Descripción / Concepto</th>
                  <th className="px-4 py-3 font-semibold text-right w-32">Debe (Bs)</th>
                  <th className="px-4 py-3 font-semibold text-right w-32">Haber (Bs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {asientos.map((asiento) => {
                  let subtotalDebe = 0;
                  let subtotalHaber = 0;

                  const filas = asiento.detalles.map((detalle: any, index: number) => {
                    subtotalDebe += detalle.debe;
                    subtotalHaber += detalle.haber;
                    granTotalDebe += detalle.debe;
                    granTotalHaber += detalle.haber;

                    return (
                      <tr key={detalle.id} className="hover:bg-gray-50">
                        {index === 0 && (
                          <>
                            <td className="px-4 py-3 text-center align-top text-gray-600 font-medium" rowSpan={asiento.detalles.length}>
                              {format(new Date(asiento.fecha), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-4 py-3 text-center align-top font-bold text-[#3B82F6]" rowSpan={asiento.detalles.length}>
                              {String(asiento.numero).padStart(5, '0')}
                            </td>
                          </>
                        )}
                        <td className={`px-4 py-2 ${detalle.haber > 0 ? 'pl-8' : ''}`}>
                          <span className="text-gray-900 font-medium">{detalle.cuenta.nombre}</span>
                        </td>
                        <td className="px-4 py-2 text-gray-600 text-xs">{asiento.descripcion}</td>
                        <td className="px-4 py-2 text-right text-[#0F172A] font-semibold">{formatCurrency(detalle.debe)}</td>
                        <td className="px-4 py-2 text-right text-[#0F172A] font-semibold">{formatCurrency(detalle.haber)}</td>
                      </tr>
                    );
                  });

                  return (
                    <React.Fragment key={asiento.id}>
                      {filas}
                      {/* Línea divisoria sutil entre asientos */}
                      <tr className="bg-gray-50/50">
                        <td colSpan={6} className="h-2"></td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-right font-bold text-gray-800 uppercase tracking-wider text-xs">
                    Totales del Mes:
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-[#0F172A] text-base border-double border-b-4 border-gray-400">
                    {formatCurrency(granTotalDebe)}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-[#0F172A] text-base border-double border-b-4 border-gray-400">
                    {formatCurrency(granTotalHaber)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
