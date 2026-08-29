'use client';

import { useState, useEffect } from 'react';

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
    ficha: socio.ficha || '',
    status: socio.status || 'ACTIVO',
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [historialData, setHistorialData] = useState<{ transacciones: any[], cxc: any[], cxp: any[] } | null>(null);
  const [loadingTx, setLoadingTx] = useState(false);
  const [activeTab, setActiveTab] = useState<'DATOS' | 'HISTORIAL'>('DATOS');
  const [printMode, setPrintMode] = useState<'CARNET' | 'HISTORIAL' | null>(null);

  useEffect(() => {
    if (!socio.id) return;
    setLoadingTx(true);
    fetch(`/api/socios/${socio.id}/historial`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistorialData(data.data);
        }
      })
      .catch(err => console.error('Error fetching historial:', err))
      .finally(() => setLoadingTx(false));
  }, [socio.id]);

  const initial = socio.nombre_apellido.charAt(0).toUpperCase();

  const handlePrint = (mode: 'CARNET' | 'HISTORIAL') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 100);
  };

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
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            .no-print { display: none !important; }
            @page { margin: 1cm; }
          }
        `}</style>

        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200 no-print">
          <h2 className="text-xl font-bold text-[#1E3A8A]">Perfil del Socio</h2>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Volver
            </button>
            <button onClick={() => handlePrint('CARNET')} className="px-4 py-2 bg-[#0A1128] text-white rounded text-sm font-medium hover:bg-opacity-90 flex items-center gap-2 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect width="12" height="8" x="6" y="14"/></svg>
              Imprimir Carnet
            </button>
          </div>
        </div>

        <div className="p-8 flex flex-col items-center">
          
          {/* Carnet Card */}
          <div className={`bg-white border border-gray-300 rounded-xl shadow-md w-full max-w-sm relative overflow-hidden flex flex-col items-center ${printMode === 'CARNET' ? 'print-container' : 'print:hidden'}`} style={{ width: '320px', minHeight: '480px' }}>
            {/* Header del Carnet con Logo */}
            <div className="w-full bg-[#1E3A8A] text-white p-4 flex flex-col items-center justify-center text-center">
              <img src="/logo.png" alt="Logo Propatria Chacaito" className="h-16 w-auto mb-2 bg-white p-1 rounded object-contain" />
              <h2 className="text-xs font-bold uppercase tracking-wider">A.C. Conductores</h2>
              <h1 className="text-sm font-black uppercase">Propatria - Chacaito - El Cafetal</h1>
            </div>
            
            <div className={`w-full h-1 ${socio.status === 'ACTIVO' ? 'bg-[#16A34A]' : 'bg-red-500'}`}></div>
            
            <div className="p-6 w-full flex flex-col items-center flex-1">
              {/* Avatar Redondo */}
              <div className="w-28 h-28 rounded-full border-4 border-gray-100 flex items-center justify-center text-5xl font-bold text-[#1E3A8A] bg-gray-50 shadow-inner mb-4 overflow-hidden">
                {initial}
              </div>

              {/* Nombre y Cargo */}
              <h3 className="text-lg font-black text-[#0A1128] text-center leading-tight mb-1 uppercase w-full truncate">{socio.nombre_apellido}</h3>
              <p className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-4">ASOCIADO</p>

              {/* Grid de Datos Relevantes */}
              <div className="w-full grid grid-cols-2 gap-y-3 gap-x-2 text-center text-sm border-t border-gray-200 pt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Cédula</span>
                  <span className="font-bold text-gray-800">{socio.cedula || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Ficha</span>
                  <span className="font-bold text-gray-800">{socio.ficha || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Cupo</span>
                  <span className="font-black text-[#1E3A8A] text-base leading-none mt-1">{socio.codigo || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Estatus</span>
                  <span className={`font-bold ${socio.status === 'ACTIVO' ? 'text-[#16A34A]' : 'text-red-600'}`}>{socio.status}</span>
                </div>
              </div>
            </div>
            
            {/* Footer del Carnet */}
            <div className="w-full bg-gray-100 p-2 text-center border-t border-gray-200">
              <p className="text-[9px] text-gray-500 uppercase font-bold">Documento Intransferible</p>
            </div>
          </div>
          
          {/* Tabs Navigation (No visible en impresión) */}
          <div className="flex border-b border-gray-200 mt-8 w-full max-w-2xl no-print gap-4">
            <button 
              onClick={() => setActiveTab('DATOS')}
              className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'DATOS' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Modificar Datos
            </button>
            <button 
              onClick={() => setActiveTab('HISTORIAL')}
              className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'HISTORIAL' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Historial de Recibos
            </button>
          </div>

          {activeTab === 'DATOS' && (
            <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm w-full max-w-2xl p-8 no-print border-t-0">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">N° de Ficha Personal</label>
                    <input type="text" name="ficha" value={formData.ficha} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono uppercase" placeholder="Ej. F001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estatus del Socio</label>
                    <select name="status" value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold">
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2 border-t border-gray-100 my-2"></div>
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
                      Guardar y Actualizar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          )}

          {activeTab === 'HISTORIAL' && (
            <div className={`bg-white border border-gray-200 rounded-b-xl shadow-sm w-full max-w-2xl p-6 border-t-0 space-y-8 ${printMode === 'HISTORIAL' ? 'print-container p-10 max-w-full shadow-none border-none' : 'print:hidden'}`}>
              
              {/* Cabecera solo visible en impresión */}
              <div className="hidden print:flex items-center gap-6 border-b-2 border-[#1E3A8A] pb-6 mb-8">
                <img src="/logo.png" alt="Logo" className="h-20" />
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-wider text-[#1E3A8A]">ESTADO DE CUENTA DE SOCIO</h1>
                  <p className="text-gray-600">A.C. Conductores Propatria - Chacaito - El Cafetal</p>
                  <div className="flex gap-4 mt-2">
                    <p><strong>Socio:</strong> {socio.nombre_apellido}</p>
                    <p><strong>Cupo:</strong> {socio.codigo || 'N/A'}</p>
                    <p><strong>C.I:</strong> {socio.cedula || 'N/A'}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Fecha de Emisión: {new Date().toLocaleDateString('es-VE')} {new Date().toLocaleTimeString('es-VE')}</p>
                </div>
              </div>

              {/* Botón de imprimir (no visible al imprimir) */}
              <div className="flex justify-end no-print">
                <button onClick={() => handlePrint('HISTORIAL')} className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded font-medium hover:bg-gray-200 flex items-center gap-2">
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect width="12" height="8" x="6" y="14"></rect></svg>
                  Imprimir Estado de Cuenta
                </button>
              </div>

              {loadingTx ? (
                <div className="text-center text-gray-500 py-8">Cargando historial detallado...</div>
              ) : !historialData ? (
                <div className="text-center text-gray-500 py-8">Error cargando historial.</div>
              ) : (
                <>
                  {/* RESUMEN DE SALDO */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 print:bg-white print:border-gray-200">
                      <div className="text-xs font-bold text-blue-800 mb-1 uppercase tracking-wider">Recibos Emitidos</div>
                      <div className="text-2xl font-black text-blue-600">{historialData.transacciones.length}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 print:bg-white print:border-gray-200">
                      <div className="text-xs font-bold text-red-800 mb-1 uppercase tracking-wider">Deuda por Cobrar</div>
                      <div className="text-xl font-black text-red-600 font-mono">
                        Bs. {historialData.cxc.reduce((a, b) => a + b.monto_a_cobrar, 0).toLocaleString('es-VE', {minimumFractionDigits: 2})}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 print:bg-white print:border-gray-200">
                      <div className="text-xs font-bold text-green-800 mb-1 uppercase tracking-wider">A favor del Socio</div>
                      <div className="text-xl font-black text-green-600 font-mono">
                        Bs. {historialData.cxp.reduce((a, b) => a + (b.total || b.monto), 0).toLocaleString('es-VE', {minimumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>

                  {/* CxC PENDIENTES */}
                  {historialData.cxc.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-red-700 border-b border-red-100 pb-2 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        Pendiente por Cobrar (CxC)
                      </h4>
                      <div className="overflow-x-auto bg-white rounded border border-gray-100 shadow-sm">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="p-2 font-bold">Mes</th>
                              <th className="p-2 font-bold">Concepto</th>
                              <th className="p-2 font-bold text-right">Monto Bs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historialData.cxc.map(c => (
                              <tr key={c.id} className="border-t border-gray-100">
                                <td className="p-2 font-medium">{c.mes || '-'}</td>
                                <td className="p-2">{c.tipo_publicacion || '-'}</td>
                                <td className="p-2 text-right font-mono font-bold text-red-600">{c.monto_a_cobrar.toLocaleString('es-VE', {minimumFractionDigits: 2})}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* CxP PENDIENTES */}
                  {historialData.cxp.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-green-700 border-b border-green-100 pb-2 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                        Pendiente por Pagar (CxP)
                      </h4>
                      <div className="overflow-x-auto bg-white rounded border border-gray-100 shadow-sm">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="p-2 font-bold">Mes</th>
                              <th className="p-2 font-bold">Concepto</th>
                              <th className="p-2 font-bold text-right">Total Bs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historialData.cxp.map(c => (
                              <tr key={c.id} className="border-t border-gray-100">
                                <td className="p-2 font-medium">{c.mes || '-'}</td>
                                <td className="p-2">{c.tipo_publicacion || '-'}</td>
                                <td className="p-2 text-right font-mono font-bold text-green-600">{(c.total || c.monto).toLocaleString('es-VE', {minimumFractionDigits: 2})}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* HISTORIAL TRANSACCIONES */}
                  <div>
                    <h4 className="text-sm font-bold text-[#1E3A8A] border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      Recibos Procesados
                    </h4>
                    {historialData.transacciones.length === 0 ? (
                      <div className="text-sm text-gray-500 italic">No hay recibos procesados para este socio.</div>
                    ) : (
                      <div className="overflow-x-auto border border-gray-200 rounded">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="p-2 font-bold">Fecha</th>
                              <th className="p-2 font-bold">N° Recibo</th>
                              <th className="p-2 font-bold">Tipo</th>
                              <th className="p-2 font-bold">Concepto</th>
                              <th className="p-2 font-bold text-right">Monto Bs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historialData.transacciones.map(tx => (
                              <tr key={tx.id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="p-2 whitespace-nowrap">{new Date(tx.fecha).toLocaleDateString('es-VE')}</td>
                                <td className="p-2 font-mono font-bold text-blue-600 whitespace-nowrap">{tx.recibo || '-'}</td>
                                <td className="p-2 font-bold">
                                  <span className={tx.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}>{tx.tipo}</span>
                                </td>
                                <td className="p-2">{tx.clasificacion}</td>
                                <td className="p-2 text-right font-mono font-bold whitespace-nowrap">{tx.monto_bs?.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
