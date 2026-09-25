'use client';

import React, { useEffect, useState } from 'react';
import { Inbox, CheckCircle, Clock, ArrowRight, Zap, Loader2, Undo } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

import { selectorToYyyyMm, labelFiltro } from '@/lib/mesUtils';

export default function AsientosContablesPage() {
  const router = useRouter();
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingMasivo, setIsProcessingMasivo] = useState(false);
  
  // Sincronización con el filtro global de la app
  const { filtroMesGlobal } = useAppStore();
  const mesFiltro = selectorToYyyyMm(filtroMesGlobal);

  const cargarTransacciones = () => {
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
  };

  useEffect(() => {
    cargarTransacciones();
  }, [mesFiltro]);

  const handleContabilizacionMasiva = async () => {
    if (!confirm(`¿Estás seguro de contabilizar automáticamente los ${pendientes} recibos pendientes de este mes?`)) return;
    
    setIsProcessingMasivo(true);
    let currentRemaining = pendientes;
    let totalProcessed = 0;

    try {
      while (currentRemaining > 0) {
        const res = await fetch('/api/asientos/masivo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mes: mesFiltro })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Error al procesar');
        
        totalProcessed += data.count || 0;
        currentRemaining = data.remaining || 0;
        
        // Refresh UI state during long processing to update the progress bar incrementally
        await cargarTransacciones(); 
      }
      
      alert(`¡Éxito! Se generaron ${totalProcessed} asientos automáticamente.`);
    } catch (err: any) {
      alert(`Error en el procesamiento: ${err.message}`);
    } finally {
      setIsProcessingMasivo(false);
      cargarTransacciones(); 
    }
  };

  const handleReversar = async (asientoId: number) => {
    if (!confirm('¿Estás seguro de que deseas reversar este asiento? El recibo volverá a estar PENDIENTE.')) return;

    try {
      const res = await fetch(`/api/asientos/${asientoId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reversar');
      
      alert('Asiento reversado correctamente.');
      cargarTransacciones();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const totalRecibos = transacciones.length;
  const contabilizados = transacciones.filter(t => t.asientoId !== null).length;
  const pendientes = totalRecibos - contabilizados;
  
  const porcentaje = totalRecibos === 0 ? 0 : Math.round((contabilizados / totalRecibos) * 100);

  const formatCurrency = (amount: number) => {
    if (!amount) return 'Bs 0,00';
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(amount);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg text-[#3B82F6]">
            <Inbox size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Asientos Contables</h1>
            <p className="text-gray-500">Auditoría contable y generación de asientos ({labelFiltro(filtroMesGlobal)})</p>
          </div>
        </div>
        {pendientes > 0 && (
          <button 
            onClick={handleContabilizacionMasiva}
            disabled={isProcessingMasivo}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            {isProcessingMasivo ? (
              <><Loader2 size={18} className="animate-spin" /> Procesando {pendientes} recibos...</>
            ) : (
              <><Zap size={18} className="text-yellow-300" /> Contabilizar Todo el Mes</>
            )}
          </button>
        )}
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
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Fecha</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Recibo</th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Concepto</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Monto (Bs)</th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Estado</th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transacciones.map((t) => {
                  const isContabilizado = t.asientoId !== null;
                  
                  return (
                    <tr key={t.id} className={`transition-colors ${isContabilizado ? 'bg-gray-50/50 opacity-60' : 'hover:bg-blue-50/30'}`}>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{format(new Date(t.fecha), 'dd/MM/yyyy')}</td>
                      <td className="px-4 py-3 font-bold text-gray-700 whitespace-nowrap">#{t.recibo}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${t.tipo === 'INGRESO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {t.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        <div className="font-medium truncate max-w-[200px] md:max-w-xs">{t.codigo_concepto || t.clasificacion || 'Sin concepto'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px] md:max-w-xs">{t.socio ? t.socio.nombre_apellido : t.detalle}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#0F172A] whitespace-nowrap">{formatCurrency(t.monto_bs)}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
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
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isContabilizado ? (
                          <div className="flex items-center justify-center gap-3">
                            <Link 
                              href="/contabilidad/libro-diario" 
                              className="text-[#3B82F6] hover:underline text-xs font-semibold whitespace-nowrap"
                            >
                              Ver en Diario
                            </Link>
                            <button
                              onClick={() => handleReversar(t.asientoId)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                              title="Reversar y poner PENDIENTE"
                            >
                              <Undo size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => router.push(`/contabilidad/asientos/nuevo?transaccionId=${t.id}`)}
                            className="flex items-center justify-center gap-1 w-full bg-[#0F172A] hover:bg-slate-800 text-white py-1.5 px-2 rounded text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
                          >
                            Asentar <ArrowRight size={14} />
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
