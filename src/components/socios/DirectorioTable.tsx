'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import SocioModal from './SocioModal';
import { useAppStore } from '@/store/useAppStore';

type Socio = {
  id: number;
  codigo: string | null;
  ficha: string | null;
  numero_ficha: string | null;
  escalafon: string | null;
  nombre_apellido: string;
  cedula: string | null;
  rif: string | null;
  status: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  placa: string | null;
};

export default function DirectorioTable() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);

  const { sociosDirectorio: storeSocios } = useAppStore();

  useEffect(() => {
    // Filtrado local
    const filtered = storeSocios.filter(s => {
      const matchStatus = statusFilter === 'TODOS' || s.status === statusFilter;
      const term = search.toLowerCase();
      const matchSearch = term === '' || 
        (s.nombre_apellido && s.nombre_apellido.toLowerCase().includes(term)) ||
        (s.cedula && s.cedula.toLowerCase().includes(term)) ||
        (s.ficha && s.ficha.toLowerCase().includes(term)) ||
        (s.numero_ficha && s.numero_ficha.toLowerCase().includes(term)) ||
        (s.codigo && s.codigo.toLowerCase().includes(term));
      return matchStatus && matchSearch;
    });
    setSocios(filtered);
    setLoading(false);
  }, [search, statusFilter, storeSocios]);

  const handleUpdate = (updatedSocio: Socio) => {
    setSocios(prev => prev.map(s => s.id === updatedSocio.id ? updatedSocio : s));
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Ingrese Código, Nombre o C.I..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#0A1128]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Tipo de Socio</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Cupo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Ficha</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Escalafón</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Nombre y Apellido</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">C.I.</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">Cargando directorio...</td>
              </tr>
            ) : socios.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">No se encontraron asociados</td>
              </tr>
            ) : (
              socios.map((socio) => {
                const tipoSocio = socio.ficha ? (socio.ficha.startsWith('SA') ? 'SA' : socio.ficha.startsWith('SB') ? 'SB' : 'OTRO') : 'N/A';
                return (
                  <tr key={socio.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${tipoSocio === 'SA' ? 'border-blue-300 text-blue-800 bg-blue-50' : tipoSocio === 'SB' ? 'border-green-300 text-green-800 bg-green-50' : 'border-gray-300 text-gray-800 bg-gray-50'}`}>
                        {tipoSocio}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                      {socio.ficha || 'S/Cupo'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                      {socio.numero_ficha || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {socio.escalafon && socio.escalafon.trim() !== '' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-gray-300 text-gray-600 bg-gray-50">
                        {socio.escalafon}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-[#0A1128]">{socio.nombre_apellido}</div>
                    <div className="text-xs text-[#16A34A] font-semibold mt-0.5 uppercase">{socio.status}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{socio.cedula || 'S/N'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedSocio(socio)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A1128] text-white rounded text-xs font-medium hover:bg-opacity-90 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-contact-2"><path d="M16 18a4 4 0 0 0-8 0"/><circle cx="12" cy="11" r="3"/><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="8" x2="8" y1="2" y2="4"/><line x1="16" x2="16" y1="2" y2="4"/></svg>
                      Ver Carnet
                    </button>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedSocio && (
        <SocioModal 
          socio={selectedSocio} 
          onClose={() => setSelectedSocio(null)} 
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
