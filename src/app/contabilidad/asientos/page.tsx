'use client';

import React, { useEffect, useState } from 'react';
import { Inbox, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AsientosContablesPage() {
  const router = useRouter();
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mesFiltro, setMesFiltro] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/transacciones/pendientes?mes=${mesFiltro}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setTransacciones(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [mesFiltro]);

  const totalRecibos = transacciones.length;
  const contabilizados = transacciones.filter(t => t.asientoId !== null).length;
  const pendientes = totalRecibos - contabilizados;
  
  const porcentaje = totalRecibos === 0 ? 0 : Math.round((contabilizados / totalRecibos) * 100);

  const formatCurrency = (amount: number) => {
    if (!amount) return 'Bs 0,00';
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(amount);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg text-[#3B82F6]">
            <Inbox size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Asientos Contables</h1>
            <p className="text-gray-500">Auditoría contable y generación de asientos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input 
            type="month" 
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#3B82F6] outline-none font-medium text-gray-700 shadow-sm"
          />
        </div>
      </div>

      {/* Tarjeta de Progreso */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="w-full md:w-1/3">
          <h3 className="text-gray-500 font-semibold mb-1 text-sm uppercase tracking-wider">Progreso del Mes</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-[#0F172A]">{porcentaje}%</span>
            <span className="text-gray-500 font-medium mb-1">Contabilizado</span>
          </div>
        </div>
        
        <div className="w-full md:w-2/3 flex-grow">
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${porcentaje === 100 ? 'bg-green-500' : 'bg-[#3B82F6]'}`} 
              style={{ width: `${porcentaje}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm font-medium">
            <span className="text-gray-500">{contabilizados} procesados</span>
            <span className={pendientes === 0 ? 'text-green-600 font-bold flex items-center gap-1' : 'text-orange-500 font-bold'}>
              {pendientes === 0 ? <><CheckCircle size={14}/> ¡Mes Completado!</> : `${pendientes} pendientes`}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Recibos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Flujo Operativo de {format(new Date(mesFiltro + '-01T00:00:00'), 'MMMM yyyy', { locale: es })}</h3>
          <span className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full font-bold shadow-sm">
            Total Recibos: {totalRecibos}
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Cargando bandeja de recibos...</div>
        ) : totalRecibos === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No se encontraron recibos de ingresos ni egresos en este mes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0F172A] text-white">
                <tr>
                  <th className="px-6 py-4 font-semibold w-32">Fecha</th>
                  <th className="px-6 py-4 font-semibold w-24">Recibo</th>
                  <th className="px-6 py-4 font-semibold w-32 text-center">Tipo</th>
                  <th className="px-6 py-4 font-semibold">Concepto</th>
                  <th className="px-6 py-4 font-semibold text-right">Monto (Bs)</th>
                  <th className="px-6 py-4 font-semibold text-center w-36">Estado</th>
                  <th className="px-6 py-4 font-semibold text-center w-32">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transacciones.map((t) => {
                  const isContabilizado = t.asientoId !== null;
                  
                  return (
                    <tr key={t.id} className={`transition-colors ${isContabilizado ? 'bg-gray-50/50 opacity-60' : 'hover:bg-blue-50/30'}`}>
                      <td className="px-6 py-4 text-gray-600">{format(new Date(t.fecha), 'dd/MM/yyyy')}</td>
                      <td className="px-6 py-4 font-bold text-gray-700">#{t.recibo}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${t.tipo === 'INGRESO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {t.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        <div className="font-medium truncate max-w-xs">{t.codigo_concepto || t.clasificacion || 'Sin concepto'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{t.socio ? t.socio.nombre_apellido : t.detalle}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#0F172A]">{formatCurrency(t.monto_bs)}</td>
                      <td className="px-6 py-4 text-center">
                        {isContabilizado ? (
                          <span className="flex items-center justify-center gap-1 text-green-600 text-xs font-bold">
                            <CheckCircle size={14} /> CONCILIADO
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 text-orange-500 text-xs font-bold">
                            <Clock size={14} /> PENDIENTE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isContabilizado ? (
                          <Link 
                            href="/contabilidad/libro-diario" 
                            className="text-[#3B82F6] hover:underline text-xs font-semibold"
                          >
                            Ver Asiento #{t.asientoId} en Diario
                          </Link>
                        ) : (
                          <button
                            onClick={() => router.push(`/contabilidad/asientos/nuevo?transaccionId=${t.id}`)}
                            className="flex items-center justify-center gap-1 w-full bg-[#0F172A] hover:bg-slate-800 text-white py-1.5 px-3 rounded text-xs font-bold transition-colors shadow-sm"
                          >
                            Hacer Asiento <ArrowRight size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
