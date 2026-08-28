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

  // Impresión
  const [printData, setPrintData] = useState<ReceiptData | null>(null);

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

  const handlePrint = (tx: any) => {
    let conceptos = [];
    try {
      conceptos = JSON.parse(tx.detalle || '[]');
    } catch (e) {
      conceptos = [];
    }

    let pago: any = {
      tipo_pago: 'N/A',
      referencia: '',
      banco: '',
      tasa_cambio: tx.tasa_cambio || 1,
      monto_bs: tx.monto_bs || 0,
      monto_usd: tx.monto_usd || 0
    };

    if (tx.formas_pago && tx.formas_pago.length > 0) {
      pago = tx.formas_pago[0];
    }

    const receiptData: ReceiptData = {
      tipo: tx.tipo as 'INGRESO' | 'EGRESO',
      numeroRecibo: tx.recibo,
      fecha: new Date(tx.fecha),
      socio: tx.socio ? { ficha: tx.socio.ficha, nombre: tx.socio.nombre_apellido, cedula: tx.socio.cedula || 'N/A' } : { ficha: 'N/A', nombre: 'N/A', cedula: 'N/A' },
      conceptos,
      pago,
      granTotalBs: tx.monto_bs,
      nota: ''
    };

    setPrintData(receiptData);
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 500);
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
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Buscar (Ficha, Nombre, N° Recibo)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Ej. SA082 o Juan Perez"
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
                  <th className="p-4 font-bold text-gray-700">Socio</th>
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
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.tipo === 'INGRESO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.tipo}
                      </span>
                    </td>
                    <td className="p-4">
                      {tx.socio ? (
                        <div>
                          <span className="font-bold mr-2">{tx.socio.ficha}</span>
                          <span className="text-gray-600 truncate max-w-[200px] inline-block align-bottom">{tx.socio.nombre_apellido}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No asociado</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-800">
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

      {printData && (
        <PrintableView data={printData} />
      )}
    </div>
  );
}
