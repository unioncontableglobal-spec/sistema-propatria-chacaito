'use client';

import { useState } from 'react';

type Socio = {
  id: number;
  codigo: string | null;
  ficha: string | null;
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

type Props = {
  socio: Socio;
  onClose: () => void;
  onUpdate: (updatedSocio: Socio) => void;
};

export default function SocioModal({ socio, onClose, onUpdate }: Props) {
  const [formData, setFormData] = useState({
    telefono: socio.telefono || '',
    correo: socio.correo || '',
    direccion: socio.direccion || '',
    placa: socio.placa || '',
    rif: socio.rif || '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const initial = socio.nombre_apellido.charAt(0).toUpperCase();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch(`/api/socios/${socio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setSaveMessage('Datos actualizados exitosamente');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Error al actualizar datos');
      }
    } catch (error) {
      console.error(error);
      setSaveMessage('Error al actualizar datos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#F8FAFC] rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-full overflow-y-auto border border-gray-200">
        
        {/* Estilos para Impresión */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-carnet, .printable-carnet * {
              visibility: visible;
            }
            .printable-carnet {
              position: fixed;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 90% !important;
              max-width: 600px !important;
              border: 1px solid #e5e7eb !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200 no-print">
          <h2 className="text-xl font-bold text-[#1E3A8A]">Visualizador de Carnet</h2>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Volver
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-[#0A1128] text-white rounded text-sm font-medium hover:bg-opacity-90 flex items-center gap-2 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect width="12" height="8" x="6" y="14"/></svg>
              Imprimir Carnet
            </button>
          </div>
        </div>

        <div className="p-8 flex flex-col items-center">
          
          {/* Carnet Card */}
          <div className="printable-carnet bg-white border border-gray-200 rounded-xl shadow-sm w-full max-w-2xl relative overflow-hidden flex flex-col">
            <div className={`absolute right-0 top-0 bottom-0 w-2 ${socio.status === 'ACTIVO' ? 'bg-[#16A34A]' : 'bg-red-500'}`}></div>
            
            <div className="p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start relative">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full border-2 border-gray-200 flex items-center justify-center text-4xl font-bold text-[#1E3A8A] bg-white flex-shrink-0 shadow-sm">
                {initial}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#0A1128] leading-tight mb-2">{socio.nombre_apellido}</h3>
                    <div className="text-sm text-gray-500 font-medium space-x-2">
                      <span>CÓDIGO: {socio.codigo || 'S/N'}</span>
                      <span className="text-gray-300">|</span>
                      <span>C.I.: {socio.cedula || 'S/N'}</span>
                      <span className="text-gray-300">|</span>
                      <span>FICHA: {socio.ficha || 'S/N'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-3 py-1 rounded text-xs font-bold ${socio.status === 'ACTIVO' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-red-100 text-red-600'}`}>
                      {socio.status}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-bold text-gray-600 uppercase">
                      TIPO: {socio.escalafon || 'S/N'}
                    </span>
                  </div>
                </div>

                {/* Contact Data inside Carnet */}
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span className="font-semibold text-gray-700">Teléfono:</span> <span className="truncate">{socio.telefono || 'S/N'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <span className="font-semibold text-gray-700">Correo:</span> <span className="truncate">{socio.correo || 'S/N'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span className="font-semibold text-gray-700">Dirección:</span> <span className="truncate">{socio.direccion || 'S/N'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H5.3a2 2 0 0 0-1.6.8L1 11l-.16.84A1 1 0 0 0 2 12.85V16h3"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/></svg>
                    <span className="font-semibold text-gray-700">Placa:</span> <span className="truncate">{socio.placa || 'S/N'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Edit Form */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-full max-w-2xl mt-6 p-8 no-print">
            <h3 className="text-md font-bold text-[#1E3A8A] flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              Modificar Datos de Contacto
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placa Vehículo</label>
                  <input type="text" name="placa" value={formData.placa} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RIF</label>
                  <input type="text" name="rif" value={formData.rif} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
              </div>
              
              <div className="mt-8 flex items-center justify-end gap-4">
                {saveMessage && (
                  <span className={`text-sm font-medium ${saveMessage.includes('Error') ? 'text-red-500' : 'text-[#16A34A]'}`}>
                    {saveMessage}
                  </span>
                )}
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#16A34A] text-white rounded font-bold hover:bg-green-700 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2">
                  {saving ? 'Guardando...' : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                      Guardar y Actualizar Directorio
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}
