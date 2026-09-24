'use client';

import { useState, useEffect } from 'react';
import MovimientoModal from '@/components/socios/MovimientoModal';
import { format } from 'date-fns';
import { useAppStore } from '@/store/useAppStore';

const normalizarMes = (mes: string) => {
  const map: Record<string, string> = {
    'ENERO': 'ENERO', 'FEBRERO': 'FEBRERO', 'MARZO': 'MARZO', 'ABRIL': 'ABRIL',
    'MAYO': 'MAYO', 'JUNIO': 'JUNIO', 'JULIO': 'JULIO', 'AGOSTO': 'AGOSTO',
    'SEPTIEMBRE': 'SEPTIEMBRE', 'OCTUBRE': 'OCTUBRE', 'NOVIEMBRE': 'NOVIEMBRE', 'DICIEMBRE': 'DICIEMBRE'
  };
  return map[mes.toUpperCase()] || mes.toUpperCase();
};

export default function MovimientosSocios() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cupos, setCupos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterTipo, setFilterTipo] = useState('Todos');

  const { filtroMesGlobal } = useAppStore();
  const filterMonthUpper = filtroMesGlobal === 'HISTÓRICO TOTAL' ? null : normalizarMes(filtroMesGlobal);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resMovs, resCupos] = await Promise.all([
        fetch('/api/movimientos-socios'),
        fetch('/api/cupos-disponibles')
      ]);
      const dataMovs = await resMovs.json();
      const dataCupos = await resCupos.json();
      
      if (dataMovs.success) setMovimientos(dataMovs.data);
      if (dataCupos.success) setCupos(dataCupos.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const libresSA = cupos.filter(c => c.startsWith('SA')).length;
  const libresSB = cupos.filter(c => c.startsWith('SB')).length;
  const ocupadosSA = 251 - libresSA;
  const ocupadosSB = 156 - libresSB;

  const getStatusBadge = (tipo: string) => {
    if (tipo === 'Inscripciones') return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold tracking-wider uppercase">Inscripción</span>;
    if (tipo === 'Cambios') return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold tracking-wider uppercase">Cambio</span>;
    if (tipo === 'Retiros') return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold tracking-wider uppercase">Retiro</span>;
    return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{tipo}</span>;
  };

  const filteredMovimientos = movimientos.filter(m => {
    if (filterTipo !== 'Todos' && m.tipo !== filterTipo) return false;
    
    if (filterMonthUpper) {
      const mDate = new Date(m.fecha);
      const mMes = mDate.toLocaleString('es-ES', { month: 'long', timeZone: 'UTC' }).toUpperCase();
      if (mMes !== filterMonthUpper) return false;
    }
    
    return true;
  });

  const totalInscripciones = filteredMovimientos.filter(m => m.tipo === 'Inscripciones').length;
  const totalCambios = filteredMovimientos.filter(m => m.tipo === 'Cambios').length;
  const totalRetiros = filteredMovimientos.filter(m => m.tipo === 'Retiros').length;

  const handleAnular = async (id: number) => {
    if (!confirm("¿Estás seguro de anular este movimiento? Esto revertirá los cambios en la ficha del socio.")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/movimientos-socios/${id}/anular`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Movimiento anulado correctamente.");
        fetchData(); // Refrescar los datos de la tabla y métricas
      } else {
        alert("No se pudo anular: " + data.error);
        setLoading(false);
      }
    } catch (error) {
      alert("Error de conexión al anular el movimiento.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#0A1128] tracking-tight">Gestión de Cupos</h1>
          <p className="text-gray-500 mt-2 font-medium">Panel de control de afiliaciones, retiros y cambios de cupos.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Nuevo Movimiento
        </button>
      </div>

      {/* Tarjetas de Métricas Dinámicas del Mes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Inscripciones {filterMonthUpper ? `(${filterMonthUpper})` : ''}</p>
            <p className="text-3xl font-black text-green-600 mt-1">{totalInscripciones}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-full text-green-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Retiros {filterMonthUpper ? `(${filterMonthUpper})` : ''}</p>
            <p className="text-3xl font-black text-red-600 mt-1">{totalRetiros}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-full text-red-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="9" x2="24" y2="15"/><line x1="18" y1="15" x2="24" y2="9"/></svg>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Cambios {filterMonthUpper ? `(${filterMonthUpper})` : ''}</p>
            <p className="text-3xl font-black text-blue-600 mt-1">{totalCambios}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-full text-blue-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Estilo Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-br from-white to-blue-50/50 p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-6 -top-6 text-blue-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"/></svg>
          </div>
          <h3 className="text-sm font-extrabold text-blue-500 tracking-widest uppercase mb-1">Cupos SA Libres</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-[#0A1128]">{libresSA}</p>
            <span className="text-sm font-medium text-gray-500">de 251 posibles</span>
          </div>
          <div className="mt-4 text-xs font-semibold text-blue-600 bg-blue-100 w-max px-2 py-1 rounded-md">{ocupadosSA} ocupados</div>
        </div>

        <div className="bg-gradient-to-br from-white to-purple-50/50 p-6 rounded-2xl shadow-sm border border-purple-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-6 -top-6 text-purple-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><polygon points="12 2 22 22 2 22"/></svg>
          </div>
          <h3 className="text-sm font-extrabold text-purple-500 tracking-widest uppercase mb-1">Cupos SB Libres</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-[#0A1128]">{libresSB}</p>
            <span className="text-sm font-medium text-gray-500">de 156 posibles</span>
          </div>
          <div className="mt-4 text-xs font-semibold text-purple-600 bg-purple-100 w-max px-2 py-1 rounded-md">{ocupadosSB} ocupados</div>
        </div>
        
        <div className="bg-gradient-to-br from-[#0A1128] to-[#1E3A8A] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:shadow-xl transition-shadow text-white">
          <div className="absolute -right-4 -bottom-4 text-white/10 opacity-50 group-hover:scale-110 transition-transform duration-500">
            <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 className="text-sm font-extrabold text-blue-200 tracking-widest uppercase mb-1">Ocupación Total</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-white">{ocupadosSA + ocupadosSB}</p>
            <span className="text-sm font-medium text-blue-200">soció activos</span>
          </div>
          <div className="mt-4 text-xs font-semibold text-[#0A1128] bg-blue-200 w-max px-2 py-1 rounded-md">{libresSA + libresSB} vacantes totales</div>
        </div>
      </div>

      {/* Tabla de Historial Premium */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-[#0A1128]">Historial de Movimientos</h2>
          <select 
            value={filterTipo} 
            onChange={e => setFilterTipo(e.target.value)}
            className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-semibold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="Todos">Todos los Status</option>
            <option value="Inscripciones">Inscripciones</option>
            <option value="Cambios">Cambios</option>
            <option value="Retiros">Retiros</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Socio / Ficha</th>
                <th className="px-6 py-4">Cupo Afectado</th>
                <th className="px-6 py-4">Fecha Evento</th>
                <th className="px-6 py-4">Detalle / Observación</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm font-medium">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Cargando historial...
                    </div>
                  </td>
                </tr>
              ) : filteredMovimientos.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 font-medium">No se encontraron movimientos registrados.</td></tr>
              ) : (
                filteredMovimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      {getStatusBadge(m.tipo)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#1E3A8A] group-hover:text-blue-600 transition-colors">{m.nombre_apellido}</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">Ficha: {m.ficha || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center justify-center bg-gray-100 px-3 py-1 rounded-md font-mono font-bold text-gray-800 border border-gray-200">
                        {m.cupo || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {format(new Date(m.fecha), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs leading-relaxed max-w-sm">
                      {m.detalle || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleAnular(m.id)}
                        disabled={m.detalle?.includes('[ANULADO]')}
                        className={`p-2 rounded-lg transition-colors ${m.detalle?.includes('[ANULADO]') ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                        title="Anular movimiento"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MovimientoModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSuccess={() => {
          setShowModal(false);
          fetchData();
        }}
      />
    </div>
  );
}
