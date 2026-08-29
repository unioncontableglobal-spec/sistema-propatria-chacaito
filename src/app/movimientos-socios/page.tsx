'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { useAppStore } from '@/store/useAppStore';
import MovimientoModal from '@/components/socios/MovimientoModal';
import { format } from 'date-fns';

export default function MovimientosSocios() {
  const { userRole } = useAppStore();
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Filtros
  const [filterTipo, setFilterTipo] = useState('Todos');

  const fetchMovimientos = () => {
    setLoading(true);
    fetch('/api/movimientos-socios')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMovimientos(data.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMovimientos();
  }, []);

  const getStatusColor = (tipo: string) => {
    if (tipo === 'Inscripciones') return 'bg-[#F2D7D5] text-[#7B241C]'; // Similar al naranja/rosado del excel
    if (tipo === 'Cambios') return 'bg-[#FDEBD0] text-[#935116]'; // Naranja claro
    if (tipo === 'Retiros') return 'bg-[#EDBB99] text-[#873600]'; // Naranja oscuro
    return 'bg-gray-100 text-gray-800';
  };

  const filteredMovimientos = movimientos.filter(m => {
    if (filterTipo !== 'Todos' && m.tipo !== filterTipo) return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar initialRole={userRole} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-[#0A1128] tracking-tight">Inscripciones, Cambios y Retiros</h1>
              <p className="text-gray-500 mt-2 font-medium">Historial y gestión de cupos de los asociados</p>
            </div>
            
            <button 
              onClick={() => setShowModal(true)}
              className="bg-[#1E3A8A] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Nuevo Movimiento
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50">
              <select 
                value={filterTipo} 
                onChange={e => setFilterTipo(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todos">Todos los Status</option>
                <option value="Inscripciones">Inscripciones</option>
                <option value="Cambios">Cambios</option>
                <option value="Retiros">Retiros</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-yellow-300 font-bold">
                  <tr>
                    <th className="px-6 py-4 bg-gray-100 border-r border-gray-200">STATUS</th>
                    <th className="px-6 py-4 border-r border-yellow-400">Ficha</th>
                    <th className="px-6 py-4 border-r border-yellow-400">CUPO</th>
                    <th className="px-6 py-4 border-r border-yellow-400">Nombre y Apellido</th>
                    <th className="px-6 py-4 border-r border-yellow-400">F. Afiliación</th>
                    <th className="px-6 py-4 border-r border-yellow-400">Fecha Movimiento</th>
                    <th className="px-6 py-4">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-500">Cargando datos...</td></tr>
                  ) : filteredMovimientos.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-500">No se encontraron movimientos registrados.</td></tr>
                  ) : (
                    filteredMovimientos.map((m, index) => (
                      <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className={`px-6 py-4 font-bold border-r border-gray-100 ${getStatusColor(m.tipo)}`}>
                          {m.tipo}
                        </td>
                        <td className="px-6 py-4 border-r border-gray-100 text-gray-600 font-mono">
                          {m.ficha || '-'}
                        </td>
                        <td className="px-6 py-4 border-r border-gray-100 font-bold text-[#1E3A8A]">
                          {m.cupo || '-'}
                        </td>
                        <td className="px-6 py-4 border-r border-gray-100 font-medium text-gray-900">
                          {m.nombre_apellido}
                        </td>
                        <td className="px-6 py-4 border-r border-gray-100 text-gray-600">
                          {m.f_afiliacion ? format(new Date(m.f_afiliacion), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 border-r border-gray-100 text-gray-600">
                          {format(new Date(m.fecha), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 text-gray-600 italic text-xs max-w-xs">
                          {m.detalle || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <MovimientoModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSuccess={() => {
          setShowModal(false);
          fetchMovimientos();
        }}
      />
    </div>
  );
}
