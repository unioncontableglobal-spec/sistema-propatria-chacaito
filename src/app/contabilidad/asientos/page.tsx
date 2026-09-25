"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatBs } from '@/lib/formatters';
import { BookOpen, FileText, Search } from 'lucide-react';

export default function AsientosContablesPage() {
  const [asientos, setAsientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contabilidad/asientos')
      .then(res => res.json())
      .then(data => {
        setAsientos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6 font-sans pb-20">
      <header className="flex justify-between items-end border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen size={20} strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Libro Diario / Asientos Contables</h1>
          </div>
          <p className="text-sm text-slate-500">Historial de transacciones de partida doble generadas automáticamente.</p>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium">Cargando asientos...</div>
      ) : asientos.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
          <FileText size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No hay asientos contables generados aún.</p>
          <p className="text-sm text-slate-400 mt-1">Registra un nuevo ingreso o egreso para generar el primer asiento.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {asientos.map((asiento) => {
            const totalDebe = asiento.detalles.reduce((acc: number, det: any) => acc + (det.debe || 0), 0);
            const totalHaber = asiento.detalles.reduce((acc: number, det: any) => acc + (det.haber || 0), 0);

            return (
              <div key={asiento.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Cabecera del Asiento */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-md text-xs tracking-wider">
                      AST-{asiento.numero.toString().padStart(5, '0')}
                    </span>
                    <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                      {format(new Date(asiento.fecha), "dd 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{asiento.descripcion}</span>
                </div>

                {/* Líneas del Asiento */}
                <table className="w-full text-sm text-left">
                  <thead className="bg-white border-b border-slate-100 text-slate-400 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-5 py-3 w-[15%]">CÓDIGO</th>
                      <th className="px-5 py-3 w-[45%]">CUENTA CONTABLE</th>
                      <th className="px-5 py-3 w-[20%] text-right">DEBE</th>
                      <th className="px-5 py-3 w-[20%] text-right">HABER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {asiento.detalles.map((detalle: any) => (
                      <tr key={detalle.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-2.5 font-mono text-slate-500 text-xs">{detalle.cuenta.codigo}</td>
                        <td className={`px-5 py-2.5 font-medium ${detalle.haber > 0 ? 'pl-10 text-slate-600' : 'text-slate-800'}`}>
                          {detalle.cuenta.nombre}
                        </td>
                        <td className="px-5 py-2.5 text-right font-semibold text-blue-600">
                          {detalle.debe > 0 ? formatBs(detalle.debe) : ''}
                        </td>
                        <td className="px-5 py-2.5 text-right font-semibold text-rose-600">
                          {detalle.haber > 0 ? formatBs(detalle.haber) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totales del Asiento */}
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="px-5 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-widest">
                        Sumas Iguales
                      </td>
                      <td className="px-5 py-3 text-right font-black text-slate-800 border-double border-b-4 border-slate-300">
                        {formatBs(totalDebe)}
                      </td>
                      <td className="px-5 py-3 text-right font-black text-slate-800 border-double border-b-4 border-slate-300">
                        {formatBs(totalHaber)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
