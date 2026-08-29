'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Printer, Search, FileText } from 'lucide-react';
import PrintableView, { ReceiptData } from '@/components/recibos/PrintableView';

export default function HistorialRecibosPage() {
  const { publicaciones } = useAppStore();
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [mes, setMes] = useState('');
  const [clasificacion, setClasificacion] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Impresión y Vista Previa
  const [printData, setPrintData] = useState<ReceiptData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);

  const fetchHistorial = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (mes) params.append('mes', mes);
      if (clasificacion) params.append('clasificacion', clasificacion);
      if (busqueda) params.append('busqueda', busqueda);

      const res = await fetch(`/api/recibos/historial?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTransacciones(data.data);
      }
    } catch (error) {
      console.error('Error fetching historial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [mes, clasificacion]); // Refetch when filters change

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistorial();
  };

  const mesesAprobados = publicaciones
    .filter(p => p.estado === 'APROBADO')
    .map(p => p.mes);

  const handlePrint = async (tx: any) => {
    if (!tx.recibo) {
      alert('Esta transacción no tiene número de recibo asignado.');
      return;
    }
    setIsFetchingPreview(true);
    try {
      const res = await fetch(`/api/recibos/${tx.recibo}`);
      const data = await res.json();
      if (data.success) {
        setPrintData(data.data);
        setIsPreviewOpen(true);
      } else {
        alert(data.error || 'Error al obtener el recibo completo');
      }
    } catch (error) {
      console.error('Error fetching receipt preview:', error);
      alert('Error al obtener la vista previa');
    } finally {
      setIsFetchingPreview(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="p-6">
      <div className="mb-6 no-print">
        <h1 className="text-2xl font-bold text-[#0A1128]">Historial de Recibos</h1>
        <p className="text-gray-500">Consulte y reimprima recibos emitidos históricos y recientes.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 no-print mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Filtrar por Mes</label>
            <select value={mes} onChange={e => setMes(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#2563EB]">
              <option value="">Todos los Meses</option>
              {mesesAprobados.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tipo de Transacción</label>
            <select value={clasificacion} onChange={e => setClasificacion(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#2563EB]">
              <option value="">Todos</option>
              <option value="INGRESO_CXP">Recibos de Publicaciones (Ingresos)</option>
              <option value="INGRESO_VARIOS">Recibos Otros Ingresos</option>
              <option value="EGRESO_CXP">Recibos Egresos Publicaciones</option>
              <option value="EGRESO_ADMIN">Recibos Otros Egresos</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Buscar (Ficha, Nombre, N° Recibo, Código)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Ej. SA082, Juan Perez, 1101, E2026..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#2563EB] uppercase" 
              />
              <button type="submit" className="bg-[#0A1128] text-white px-4 rounded-lg flex items-center justify-center font-bold hover:bg-gray-800 transition">
                <Search size={18} />
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 no-print overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando recibos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-bold text-gray-700">Fecha</th>
                  <th className="p-4 font-bold text-gray-700">N° Recibo</th>
                  <th className="p-4 font-bold text-gray-700">Tipo</th>
                  <th className="p-4 font-bold text-gray-700">Categoría / Ítems</th>
                  <th className="p-4 font-bold text-gray-700">Entidad (Socio / Tercero)</th>
                  <th className="p-4 font-bold text-gray-700 text-right">Monto Bs</th>
                  <th className="p-4 font-bold text-gray-700 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.length > 0 ? transacciones.map((tx, idx) => (
                  <tr key={tx.id || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      {new Date(tx.fecha).toLocaleDateString('es-VE')}
                    </td>
                    <td className="p-4 font-bold font-mono text-[#2563EB]">
                      {tx.recibo || '-'}
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      {tx.tipo === 'INGRESO' ? (
                        <span className="text-green-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> INGRESO</span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> EGRESO</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800 text-xs">{tx.clasificacion}</div>
                      {tx.codigo_concepto && (
                        <div className="text-xs font-mono text-gray-500 mt-0.5">Cod: {tx.codigo_concepto}</div>
                      )}
                    </td>
                    <td className="p-4">
                      {tx.socio ? (
                        <div>
                          <span className="font-bold text-blue-700 mr-2">{tx.socio.ficha}</span>
                          <span className="text-gray-700">{tx.socio.nombre_apellido}</span>
                        </div>
                      ) : tx.tercero ? (
                        <div>
                          <span className="font-bold text-green-700 mr-2">TERCERO</span>
                          <span className="text-gray-700">{tx.tercero.nombre}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Sin Asignar</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-gray-800">
                      Bs {tx.monto_bs ? tx.monto_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '0,00'}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handlePrint(tx)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-2 rounded-lg inline-flex justify-center transition"
                        title="Ver e Imprimir Recibo"
                      >
                        <Printer size={18} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
                      <FileText size={48} className="text-gray-300 mb-3" />
                      <p>No se encontraron recibos con estos filtros.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print View Layer */}
      {printData && (
        <PrintableView data={printData} />
      )}

      {/* Preview Modal */}
      {isPreviewOpen && printData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg text-[#0A1128]">Vista Previa del Recibo: {printData.numeroRecibo}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-800 transition"
                >
                  Cerrar
                </button>
                <button 
                  onClick={triggerPrint}
                  className="bg-[#2563EB] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
                >
                  <Printer size={18} />
                  Imprimir Ahora
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-100 flex items-start justify-center">
               <div className="bg-white p-8 shadow-sm border border-gray-200 w-full max-w-2xl">
                 <h3 className="text-center font-bold text-lg mb-6 border-b pb-2">PREVISUALIZACIÓN DE DATOS (Solo referencial)</h3>
                 
                 <div className="grid grid-cols-2 gap-4 mb-6">
                   <div>
                     <p className="text-xs text-gray-500 uppercase">Socio</p>
                     <p className="font-bold">{printData.socio.ficha} - {printData.socio.nombre}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-gray-500 uppercase">Recibo / Fecha</p>
                     <p className="font-bold">{printData.numeroRecibo} <br/> {new Date(printData.fecha).toLocaleDateString()}</p>
                   </div>
                 </div>

                 <h4 className="font-bold text-sm mb-2 text-gray-600">Conceptos a Cobrar:</h4>
                 <table className="w-full text-sm mb-6 border">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="p-2 text-left border">Descripción</th>
                       <th className="p-2 text-right border">Monto Bs</th>
                     </tr>
                   </thead>
                   <tbody>
                     {printData.conceptos.map((c, i) => (
                       <tr key={i}>
                         <td className="p-2 border">{c.descripcion}</td>
                         <td className="p-2 border text-right">{c.total.toLocaleString('es-VE', {minimumFractionDigits: 2})}</td>
                       </tr>
                     ))}
                   </tbody>
                   <tfoot>
                     <tr className="bg-gray-50 font-bold">
                       <td className="p-2 border text-right">TOTAL RECIBO:</td>
                       <td className="p-2 border text-right">Bs {printData.granTotalBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</td>
                     </tr>
                   </tfoot>
                 </table>
                 
                 <p className="text-sm text-gray-500 italic text-center mt-4">
                   Nota: Al hacer clic en "Imprimir", se generará el formato Media Carta con Original y Copia como se espera.
                 </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
