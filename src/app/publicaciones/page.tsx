'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Lock, Plus, Trash, Printer, AlertCircle, CheckCircle } from 'lucide-react';
import PrintCartelCxC, { ReglasMensuales } from '@/components/publicaciones/PrintCartelCxC';
import PrintListadoCxP, { EventoParaPagar } from '@/components/publicaciones/PrintListadoCxP';

export default function PublicacionesPage() {
  const { sociosDirectorio, publicaciones, refreshData, filtroMesGlobal } = useAppStore();

  const [mes, setMes] = useState('01-2026');
  const [cuotaFinanzas, setCuotaFinanzas] = useState(35);
  const [eventos, setEventos] = useState<EventoParaPagar[]>([]);
  
  // Nuevo Evento State
  const [nuevoTipo, setNuevoTipo] = useState('VIDRIOS');
  const [nuevaFicha, setNuevaFicha] = useState('');
  const [nuevoSocio, setNuevoSocio] = useState<any>(null);
  const [nuevoParentesco, setNuevoParentesco] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [printMode, setPrintMode] = useState<'NONE' | 'CXC' | 'CXP'>('NONE');
  const [perCapitaFijos, setPerCapitaFijos] = useState<any>(null);

  // Sincronizar el filtro global del Sidebar con el mes local
  const isHistoricoGeneral = filtroMesGlobal === 'HISTÓRICO GENERAL' || filtroMesGlobal === 'HISTÓRICO TOTAL';

  useEffect(() => {
    if (filtroMesGlobal && !isHistoricoGeneral) {
      const mesesMap: Record<string, string> = {
        'ENERO': '01-2026', 'FEBRERO': '02-2026', 'MARZO': '03-2026',
        'ABRIL': '04-2026', 'MAYO': '05-2026', 'JUNIO': '06-2026',
        'JULIO': '07-2026', 'AGOSTO': '08-2026', 'SEPTIEMBRE': '09-2026',
        'OCTUBRE': '10-2026', 'NOVIEMBRE': '11-2026', 'DICIEMBRE': '12-2026'
      };
      const code = mesesMap[filtroMesGlobal.toUpperCase()];
      if (code) setMes(code);
    }
  }, [filtroMesGlobal]);

  const sociosActivos = sociosDirectorio.filter((s: any) => s.status === 'ACTIVO');
  const sociosActivosCount = sociosActivos.length;
  const sociosSA = sociosActivos.filter((s: any) => s.ficha?.toUpperCase().startsWith('SA')).length;
  const sociosSB = sociosActivos.filter((s: any) => s.ficha?.toUpperCase().startsWith('SB')).length;
  
  const publicacionBloqueada = publicaciones?.find((p: any) => p.mes === mes && p.estado === 'APROBADO');

  useEffect(() => {
    if (publicacionBloqueada && publicacionBloqueada.reglas_json) {
      try {
        const reglas = JSON.parse(publicacionBloqueada.reglas_json);
        setCuotaFinanzas(reglas.finanzas || 35);
        if (reglas.perCapita) setPerCapitaFijos(reglas.perCapita);
        else setPerCapitaFijos(null);
        
        // Fetch historical events
        fetch(`/api/publicaciones/eventos/${mes}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              // Si la importación no creó CxP (ej. totalizadores sin ficha), usar los del JSON como fallback
              if (data.length === 0 && reglas.eventos && Array.isArray(reglas.eventos)) {
                setEventos(reglas.eventos.map((ev: any) => {
                   const montoParsed = parseFloat(ev.montoTotal || ev.monto || 0);
                   return {
                     tipo: ev.tipo,
                     monto: isNaN(montoParsed) ? 0 : montoParsed,
                     ficha: ev.ficha || '---',
                     nombre: ev.nombre || 'Varios (Resumen Importado)',
                     parentesco: ev.parentesco || ''
                   };
                }));
              } else {
                setEventos(data);
              }
            }
          });
      } catch (e) {}
    } else {
      setEventos([]);
      setPerCapitaFijos({});
    }
  }, [mes, publicacionBloqueada]);

  const handleBuscarSocio = () => {
    if (!nuevaFicha || nuevaFicha.trim() === '') {
      alert('Por favor ingrese una ficha');
      return;
    }
    const cleanSearch = nuevaFicha.trim().toUpperCase().replace(/[-\s]/g, '');
    const socio = sociosDirectorio.find((s: any) => {
      const sficha = s.ficha ? s.ficha.trim().toUpperCase().replace(/[-\s]/g, '') : '';
      return sficha === cleanSearch;
    });
    
    if (socio) {
      setNuevoSocio(socio);
    } else {
      alert('Socio no encontrado en la base de datos');
      setNuevoSocio(null);
    }
  };

  const handleAddEvento = () => {
    if (!nuevoSocio) {
      alert('Debe buscar y seleccionar un socio beneficiario');
      return;
    }
    if (nuevoMonto <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    setEventos([
      ...eventos,
      {
        tipo: nuevoTipo,
        socioBeneficiarioId: nuevoSocio.id,
        ficha: nuevoSocio.ficha,
        nombre: nuevoSocio.nombre_apellido,
        parentesco: nuevoParentesco,
        monto: nuevoMonto
      }
    ]);

    setNuevaFicha('');
    setNuevoSocio(null);
    setNuevoParentesco('');
    setNuevoMonto(0);
  };

  const handleRemoveEvento = (index: number) => {
    setEventos(eventos.filter((_, i) => i !== index));
  };

  const handleAprobar = async () => {
    if (!confirm(`¿Está seguro de aprobar el mes ${mes}? Esto generará deudas masivas y no se podrá deshacer.`)) return;
    
    setIsSaving(true);
    try {
      const payload = {
        mes,
        cuotaFinanzas,
        eventos,
        perCapitaFijos
      };

      const res = await fetch('/api/publicaciones/aprobar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al aprobar');

      alert('Publicación aprobada exitosamente. Deudas generadas.');
      await refreshData();
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSaving(false);
      setIsSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirm('¿Está MUY seguro? Esto eliminará TODAS las deudas por cobrar (CxC) y por pagar (CxP) generadas para este mes. Solo se puede hacer si NO hay recibos cobrados de este mes.')) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/publicaciones/eliminar/${mes}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');

      alert('Publicación eliminada correctamente. Puede volver a configurarla y generarla.');
      await refreshData();
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getReglasParaImprimir = (): ReglasMensuales => {
    // Agrupar eventos por tipo para el cartel
    const eventosAgrupados = eventos.reduce((acc, ev) => {
      if (!acc[ev.tipo]) acc[ev.tipo] = { montoTotal: 0 };
      acc[ev.tipo].montoTotal += ev.monto;
      return acc;
    }, {} as Record<string, { montoTotal: number }>);

    // Combinar los eventos agregados en la izquierda con los perCapitaFijos
    // Incluso si no hay un evento en la izquierda, si el usuario llenó un perCapitaFijo, se debe cobrar
    const tiposObligatorios = ['VIDRIOS', 'MONTEPIOS', 'GRUAS', 'AYUDAS'];
    
    const eventosArray = tiposObligatorios.map(tipoKey => {
      let tipo = tipoKey;
      if (tipoKey === 'VIDRIOS') tipo = 'VIDRIOS $ BCV';
      if (tipoKey === 'MONTEPIOS') tipo = 'MONTEPIO $ BCV';
      if (tipoKey === 'GRUAS') tipo = 'GRUA $ BCV';
      if (tipoKey === 'AYUDAS') tipo = 'AYUDA $ BCV';

      const total = (eventosAgrupados[tipo] || eventosAgrupados[tipoKey])?.montoTotal || 0;
      let costo = 0;
      if (tipoKey === 'GRUAS') {
        costo = sociosSA > 0 ? total / sociosSA : 0;
      } else {
        costo = sociosActivosCount > 0 ? total / sociosActivosCount : 0;
      }
      
      if (perCapitaFijos) {
        if (tipoKey === 'VIDRIOS' && perCapitaFijos.vidrios !== undefined) costo = perCapitaFijos.vidrios;
        if (tipoKey === 'MONTEPIOS' && perCapitaFijos.montepio !== undefined) costo = perCapitaFijos.montepio;
        if (tipoKey === 'GRUAS' && perCapitaFijos.grua !== undefined) costo = perCapitaFijos.grua;
        if (tipoKey === 'AYUDAS' && perCapitaFijos.ayudas !== undefined) costo = perCapitaFijos.ayudas;
      }
      
      return {
        tipo,
        montoTotal: total,
        costoPorSocio: costo
      };
    }).filter(ev => ev.costoPorSocio > 0 || ev.montoTotal > 0);

    return {
      mes,
      finanzas: cuotaFinanzas,
      eventos: eventosArray,
      sociosA: sociosActivosCount,
      sociosB: sociosActivosCount // Simplificación
    };
  };

  const handlePrint = (mode: 'CXC' | 'CXP') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      setPrintMode('NONE'); // Restaurar después de imprimir
    }, 500);
  };

  return (
    <div className="p-6">
      <div className="mb-6 no-print">
        <h1 className="text-2xl font-bold text-[#0A1128]">Módulo de Publicaciones</h1>
        <p className="text-gray-500">Motor de instrucciones de facturación y generación masiva de deudas mensuales.</p>
      </div>

      {isHistoricoGeneral && (
        <div className="mb-6 bg-gradient-to-r from-[#0A1128] to-[#1a2b5c] p-6 rounded-xl shadow-md text-white no-print">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-600 pb-2">KPI Histórico Acumulado (Todos los meses procesados)</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 p-4 rounded-lg">
              <p className="text-gray-300 text-sm font-semibold mb-1">Meses Procesados</p>
              <p className="text-2xl font-bold">{publicaciones?.length || 0}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <p className="text-gray-300 text-sm font-semibold mb-1">Total Deuda Generada (CxC)</p>
              <p className="text-2xl font-bold text-green-400">
                ${(publicaciones || []).reduce((acc: number, pub: any) => {
                  try {
                    const reglas = JSON.parse(pub.reglas_json || '{}');
                    const finanzas = (parseFloat(reglas.finanzas) || 0) * sociosActivosCount;
                    const eventos = (reglas.eventos || []).reduce((sum: number, ev: any) => {
                      const monto = parseFloat(ev.montoTotal || ev.monto || 0);
                      return sum + (isNaN(monto) ? 0 : monto);
                    }, 0);
                    return acc + finanzas + eventos;
                  } catch (e) { return acc; }
                }, 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <p className="text-gray-300 text-sm font-semibold mb-1">Total Eventos Registrados (CxP)</p>
              <p className="text-2xl font-bold text-blue-300">
                {(publicaciones || []).reduce((acc: number, pub: any) => {
                  try {
                    const reglas = JSON.parse(pub.reglas_json || '{}');
                    return acc + (reglas.eventos?.length || 0);
                  } catch (e) { return acc; }
                }, 0)}
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <p className="text-gray-300 text-sm font-semibold mb-1">Monto Total a Pagar (CxP)</p>
              <p className="text-2xl font-bold text-red-300">
                ${(publicaciones || []).reduce((acc: number, pub: any) => {
                  try {
                    const reglas = JSON.parse(pub.reglas_json || '{}');
                    return acc + (reglas.eventos || []).reduce((sum: number, ev: any) => {
                      const monto = parseFloat(ev.montoTotal || ev.monto || 0);
                      return sum + (isNaN(monto) ? 0 : monto);
                    }, 0);
                  } catch (e) { return acc; }
                }, 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isHistoricoGeneral ? (
        <div className="no-print flex flex-col gap-6">
        
        {/* Panel de Mes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mes a Procesar</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={mes}
                  onChange={e => setMes(e.target.value)}
                  placeholder="MM-YYYY"
                  disabled={!!publicacionBloqueada}
                  className="p-2 border border-gray-300 rounded-lg w-32 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
            
            {publicacionBloqueada ? (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                <Lock size={18} />
                <span className="font-bold">Mes Aprobado y Bloqueado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg border border-amber-200">
                <AlertCircle size={18} />
                <span className="font-semibold">Modo Borrador</span>
              </div>
            )}
          </div>

          {/* Sub-sección A: Eventos (CxP) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-[#0A1128] mb-4 border-b pb-2">
              {publicacionBloqueada ? 'Eventos Pagaderos (CxP) Procesados' : 'Sub-sección A: Registrar Eventos a Pagar (CxP)'}
            </h2>
            
            {!publicacionBloqueada && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tipo de Evento</label>
                    <select value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)} className="w-full p-2 border rounded">
                      <option value="VIDRIOS">Vidrios</option>
                      <option value="MONTEPIOS">Montepíos</option>
                      <option value="GRUAS">Grúas</option>
                      <option value="AYUDAS">Ayudas</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Beneficiario (Ficha)</label>
                    <div className="flex gap-2">
                      <input type="text" value={nuevaFicha} onChange={e => setNuevaFicha(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBuscarSocio()} placeholder="SA082" className="w-full p-2 border rounded uppercase" />
                      <button onClick={handleBuscarSocio} className="bg-gray-800 text-white px-3 rounded text-sm font-bold">Buscar</button>
                    </div>
                    {nuevoSocio && <p className="text-xs text-blue-600 mt-1 truncate">{nuevoSocio.nombre_apellido}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Parentesco</label>
                    <input type="text" value={nuevoParentesco} onChange={e => setNuevoParentesco(e.target.value)} placeholder="Ej. Padre" className="w-full p-2 border rounded uppercase" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Monto ($)</label>
                    <input type="number" value={nuevoMonto || ''} onChange={e => setNuevoMonto(parseFloat(e.target.value))} className="w-full p-2 border rounded" />
                  </div>
                </div>

                <div className="flex justify-end mb-6">
                  <button onClick={handleAddEvento} className="flex items-center gap-1 bg-[#2563EB] text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition">
                    <Plus size={16} /> Añadir Evento
                  </button>
                </div>
              </>
            )}

            {eventos.length > 0 && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Ficha</th>
                    <th className="p-2">Beneficiario</th>
                    <th className="p-2 text-right">Monto ($)</th>
                    {!publicacionBloqueada && <th className="p-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {eventos.map((ev, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="p-2 font-bold">{ev.tipo}</td>
                      <td className="p-2">{ev.ficha}</td>
                      <td className="p-2 uppercase truncate max-w-[150px]">{ev.nombre} {ev.parentesco && `(${ev.parentesco})`}</td>
                      <td className="p-2 text-right font-semibold">${ev.monto.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                      {!publicacionBloqueada && (
                        <td className="p-2 text-right">
                          <button onClick={() => handleRemoveEvento(i)} className="text-red-500 hover:text-red-700">
                            <Trash size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Sub-sección B: Resumen y Aprobación */}
          <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${publicacionBloqueada ? 'opacity-90' : ''}`}>
            <h2 className="text-lg font-bold mb-4 text-[#0A1128] border-b pb-2">
              {publicacionBloqueada ? 'Resumen de Cobro (CxC)' : 'Sub-sección B: Configurar Cobros (CxC)'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-700">Socios Activos:</span>
                  <div className="text-right">
                    <span className="font-bold text-xl text-[#0A1128]">{sociosActivosCount}</span>
                    <div className="text-xs text-gray-500 font-medium">SA: {sociosSA} | SB: {sociosSB}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Cuota Finanzas (Fija):</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 font-bold">$</span> 
                    <input 
                      type="number" 
                      value={cuotaFinanzas} 
                      onChange={e => setCuotaFinanzas(parseFloat(e.target.value))}
                      disabled={!!publicacionBloqueada}
                      className="w-24 bg-gray-50 text-gray-900 font-bold text-right px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Dinámico según eventos o campos fijos */}
                {[
                  { label: 'Vidrios $ BCV', key: 'vidrios', match: 'VIDRIO' },
                  { label: 'Montepío $ BCV', key: 'montepio', match: 'MONTEPIO' },
                  { label: 'Grúa $ BCV', key: 'grua', match: 'GRUA' },
                  { label: 'Ayudas Bs', key: 'ayudas', match: 'AYUDA' }
                ].map((campo, i) => {
                  const totalCxP = eventos.filter(ev => ev.tipo.toUpperCase().includes(campo.match)).reduce((acc, ev) => acc + ev.monto, 0);
                  const divisor = campo.key === 'grua' ? sociosSA : sociosActivosCount;
                  const perCapitaAuto = divisor > 0 ? totalCxP / divisor : 0;
                  
                  let perCapitaMostrar = perCapitaAuto;
                  if (perCapitaFijos && perCapitaFijos[campo.key] !== undefined && !isNaN(perCapitaFijos[campo.key])) {
                    perCapitaMostrar = perCapitaFijos[campo.key];
                  }
                  
                  // Si está bloqueado y el monto es 0, ocultarlo para mantener limpio
                  if (publicacionBloqueada && perCapitaMostrar === 0 && totalCxP === 0) return null;

                  return (
                    <div key={i} className="flex justify-between items-center text-sm text-gray-700 border-b border-gray-100 pb-2 last:border-0">
                      <div>
                        <span className="font-semibold block">{campo.label}</span>
                        <span className="text-xs text-gray-500 font-medium">Total Cobrado: ${totalCxP.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {publicacionBloqueada ? (
                        <div className="text-right">
                          <span className="font-bold block">${perCapitaMostrar.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-xs text-gray-400">c/u</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 font-bold">$</span> 
                          <input 
                              type="number"
                              value={perCapitaFijos?.[campo.key] !== undefined ? perCapitaFijos[campo.key] : ''}
                              placeholder={perCapitaAuto.toFixed(2)}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === '') {
                                  const obj = { ...perCapitaFijos };
                                  delete obj[campo.key];
                                  setPerCapitaFijos(obj);
                                } else {
                                  setPerCapitaFijos({ ...perCapitaFijos, [campo.key]: parseFloat(val) });
                                }
                              }}
                              className="w-20 bg-gray-50 text-gray-900 font-bold text-right px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                            />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {(() => {
              const mesesMap: any = {'01':'ENERO','02':'FEBRERO','03':'MARZO','04':'ABRIL','05':'MAYO','06':'JUNIO','07':'JULIO','08':'AGOSTO','09':'SEPTIEMBRE','10':'OCTUBRE','11':'NOVIEMBRE','12':'DICIEMBRE'};
              const mesNombre = mesesMap[mes.split('-')[0]] || 'MES';
              
              const perCapitaEventos = [
                { key: 'vidrios', match: 'VIDRIO' },
                { key: 'montepio', match: 'MONTEPIO' },
                { key: 'grua', match: 'GRUA' },
                { key: 'ayudas', match: 'AYUDA' }
              ].reduce((acc, campo) => {
                const totalCxP = eventos.filter(ev => ev.tipo.toUpperCase().includes(campo.match)).reduce((sum, ev) => sum + ev.monto, 0);
                const divisor = campo.key === 'grua' ? sociosSA : sociosActivosCount;
                const perCapitaAuto = divisor > 0 ? totalCxP / divisor : 0;
                let perCapitaMostrar = perCapitaAuto;
                if (perCapitaFijos && perCapitaFijos[campo.key] !== undefined && !isNaN(perCapitaFijos[campo.key])) {
                  perCapitaMostrar = perCapitaFijos[campo.key];
                }
                if (publicacionBloqueada && perCapitaMostrar === 0 && totalCxP === 0) return acc;
                return acc + perCapitaMostrar;
              }, 0);
              
              const totalPorSocio = cuotaFinanzas + perCapitaEventos;
              const granTotal = totalPorSocio * sociosActivosCount;
              
              return (
                <div className="mt-6 border-t border-gray-200 pt-6 flex flex-col gap-3">
                  <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <span className="font-bold text-blue-900 uppercase tracking-wide">TOTAL {mesNombre}:</span>
                    <span className="font-bold text-xl text-[#2563EB]">
                      ${totalPorSocio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} c/u
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <span className="font-bold text-gray-700 uppercase tracking-wide">Gran Total Estimado (CxC):</span>
                    <span className="font-bold text-2xl text-[#0A1128]">
                      ${granTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })()}

            {!publicacionBloqueada ? (
              <div className="space-y-3 mt-6 border-t border-gray-200 pt-4">
                <p className="text-sm text-center text-gray-500 mb-2">Verifique todo antes de aprobar.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handlePrint('CXC')}
                    className="w-full bg-gray-100 text-[#0A1128] hover:bg-gray-200 border border-gray-200 font-bold py-2 rounded-lg flex justify-center items-center gap-2 transition"
                  >
                    <Printer size={18} /> Previsualizar Cartel CxC
                  </button>
                  <button 
                    onClick={() => handlePrint('CXP')}
                    className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 rounded-lg flex justify-center items-center gap-2 transition"
                  >
                    <Printer size={18} /> Previsualizar Listado CxP
                  </button>
                </div>
                
                <button 
                  onClick={handleAprobar}
                  disabled={isSaving}
                  className="w-full bg-[#2563EB] hover:bg-blue-600 text-white font-bold py-3 mt-4 rounded-lg flex justify-center items-center gap-2 transition"
                >
                  {isSaving ? 'Procesando...' : <><CheckCircle size={18} /> Aprobar y Bloquear Mes</>}
                </button>
              </div>
            ) : (
              <div className="space-y-3 mt-6 border-t border-gray-200 pt-4">
                <p className="text-sm text-center text-green-600 font-semibold mb-2">Este mes ya generó sus deudas. Utilice las opciones de impresión.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handlePrint('CXC')}
                    className="w-full bg-gray-100 text-[#0A1128] hover:bg-gray-200 border border-gray-200 font-bold py-2 rounded-lg flex justify-center items-center gap-2 transition"
                  >
                    <Printer size={18} /> Imprimir Cartel CxC
                  </button>
                  <button 
                    onClick={() => handlePrint('CXP')}
                    className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 rounded-lg flex justify-center items-center gap-2 transition"
                  >
                    <Printer size={18} /> Imprimir Listado CxP
                  </button>
                </div>
                <button 
                  onClick={handleEliminar}
                  disabled={isSaving}
                  className="w-full mt-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold py-2 rounded-lg flex justify-center items-center gap-2 transition text-sm shadow-sm"
                >
                  {isSaving ? 'Procesando...' : 'Reversar / Eliminar Publicación (En caso de error)'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 no-print">
            <h2 className="text-lg font-bold text-[#0A1128] mb-4 border-b pb-2">Desglose Histórico por Ítems - COBROS (CxC)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="p-3 font-bold text-gray-700">Mes</th>
                    <th className="p-3 font-bold text-gray-700 text-right">Finanzas (Fija)</th>
                    <th className="p-3 font-bold text-gray-700 text-right">Vidrios</th>
                    <th className="p-3 font-bold text-gray-700 text-right">Montepío</th>
                    <th className="p-3 font-bold text-gray-700 text-right">Grúa</th>
                    <th className="p-3 font-bold text-gray-700 text-right">Ayudas</th>
                    <th className="p-3 font-bold text-green-600 text-right">Gran Total (CxC)</th>
                  </tr>
                </thead>
                <tbody>
                  {(publicaciones || []).map((pub: any) => {
                    let finanzasTotal = 0, vidriosTotal = 0, montepioTotal = 0, gruaTotal = 0, ayudasTotal = 0, granTotal = 0;
                    try {
                      const reglas = JSON.parse(pub.reglas_json || '{}');
                      finanzasTotal = (parseFloat(reglas.finanzas) || 0) * sociosActivosCount;
                      
                      if (reglas.eventos) {
                        reglas.eventos.forEach((ev: any) => {
                            const monto = parseFloat(ev.montoTotal || ev.monto || 0);
                            if (!isNaN(monto)) {
                              const tipo = ev.tipo.toUpperCase();
                              if (tipo.includes('VIDRIO')) vidriosTotal += monto;
                              else if (tipo.includes('MONTEPIO')) montepioTotal += monto;
                              else if (tipo.includes('GRUA')) gruaTotal += monto;
                              else if (tipo.includes('AYUDA')) ayudasTotal += monto;
                            }
                        });
                      }
                      granTotal = finanzasTotal + vidriosTotal + montepioTotal + gruaTotal + ayudasTotal;
                    } catch (e) {}

                    return (
                      <tr key={pub.mes} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-bold">{pub.mes}</td>
                        <td className="p-3 text-right">${finanzasTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right">${vidriosTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right">${montepioTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right">${gruaTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right">${ayudasTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right font-bold text-green-600">${granTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 no-print">
            <h2 className="text-lg font-bold text-[#0A1128] mb-4 border-b pb-2">Desglose Histórico por Ítems - PAGOS (CxP)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="p-3 font-bold text-gray-700">Mes</th>
                    <th className="p-3 font-bold text-gray-700 text-center">Eventos Reg.</th>
                    <th className="p-3 font-bold text-gray-700 text-right">Vidrios</th>
                    <th className="p-3 font-bold text-gray-700 text-right">Montepío</th>
                    <th className="p-3 font-bold text-gray-700 text-right">Grúa</th>
                    <th className="p-3 font-bold text-gray-700 text-right">Ayudas</th>
                    <th className="p-3 font-bold text-red-500 text-right">Gran Total (CxP)</th>
                  </tr>
                </thead>
                <tbody>
                  {(publicaciones || []).map((pub: any) => {
                    let cantEventos = 0, vidriosTotal = 0, montepioTotal = 0, gruaTotal = 0, ayudasTotal = 0, granTotal = 0;
                    try {
                      const reglas = JSON.parse(pub.reglas_json || '{}');
                      if (reglas.eventos) {
                        cantEventos = reglas.eventos.length;
                        reglas.eventos.forEach((ev: any) => {
                            const monto = parseFloat(ev.montoTotal || ev.monto || 0);
                            if (!isNaN(monto)) {
                              const tipo = ev.tipo.toUpperCase();
                              if (tipo.includes('VIDRIO')) vidriosTotal += monto;
                              else if (tipo.includes('MONTEPIO')) montepioTotal += monto;
                              else if (tipo.includes('GRUA')) gruaTotal += monto;
                              else if (tipo.includes('AYUDA')) ayudasTotal += monto;
                            }
                        });
                      }
                      granTotal = vidriosTotal + montepioTotal + gruaTotal + ayudasTotal;
                    } catch (e) {}

                    return (
                      <tr key={pub.mes} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-bold">{pub.mes}</td>
                        <td className="p-3 text-center">{cantEventos}</td>
                        <td className="p-3 text-right">${vidriosTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right">${montepioTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right">${gruaTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right">${ayudasTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right font-bold text-red-500">${granTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Historial de Publicaciones */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 no-print">
            <h2 className="text-lg font-bold text-[#0A1128] mb-4 border-b pb-2">Historial de Publicaciones</h2>
            {publicaciones && publicaciones.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {publicaciones.map((pub: any) => {
                  let cuotaTotalMes = 0;
                  try {
                    const reglas = JSON.parse(pub.reglas_json || '{}');
                    const finanzas = parseFloat(reglas.finanzas) || 0;
                    let perCapitaEventos = 0;
                    
                    if (reglas.perCapita) {
                      perCapitaEventos += parseFloat(reglas.perCapita.vidrios || 0);
                      perCapitaEventos += parseFloat(reglas.perCapita.montepio || 0);
                      perCapitaEventos += parseFloat(reglas.perCapita.grua || 0);
                      perCapitaEventos += parseFloat(reglas.perCapita.ayudas || 0);
                    } else if (reglas.eventos) {
                      reglas.eventos.forEach((ev: any) => {
                        perCapitaEventos += parseFloat(ev.costoPorSocio || 0);
                      });
                    }

                    if (perCapitaEventos === 0 && reglas.eventos) {
                      reglas.eventos.forEach((ev: any) => {
                         const monto = parseFloat(ev.montoTotal || ev.monto || 0);
                         if (!isNaN(monto) && sociosActivosCount > 0) {
                            perCapitaEventos += (monto / sociosActivosCount);
                         }
                      });
                    }
                    cuotaTotalMes = finanzas + perCapitaEventos;
                  } catch (e) {}

                  return (
                    <div key={pub.mes} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded-lg border border-gray-200 gap-3 transition-colors hover:bg-gray-100">
                      <div>
                        <span className="font-bold text-[#0A1128] text-lg">{pub.mes}</span>
                        <p className="text-sm text-gray-500 font-semibold mt-1">
                          Cuota Aprobada: <span className="text-[#2563EB] font-bold">${cuotaTotalMes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> c/u
                        </p>
                      </div>
                      
                      {mes === pub.mes ? (
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          <button onClick={() => handlePrint('CXC')} className="flex-1 sm:flex-none bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-2 rounded font-bold flex items-center justify-center gap-1 transition text-sm">
                            <Printer size={16}/> CxC
                          </button>
                          <button onClick={() => handlePrint('CXP')} className="flex-1 sm:flex-none bg-indigo-100 text-indigo-800 hover:bg-indigo-200 px-3 py-2 rounded font-bold flex items-center justify-center gap-1 transition text-sm">
                            <Printer size={16}/> CxP
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setMes(pub.mes)} 
                          className="text-sm bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 px-4 py-2 rounded shadow-sm transition w-full sm:w-auto"
                        >
                          Cargar Mes
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay publicaciones previas.</p>
            )}
          </div>

      {/* Zonas de Impresión (Controladas por estado para evitar conflictos) */}
      {printMode === 'CXC' && (
        <PrintCartelCxC reglas={getReglasParaImprimir()} />
      )}
      
      {printMode === 'CXP' && (
        <PrintListadoCxP mes={mes} eventos={eventos} sociosActivosCount={sociosActivosCount} />
      )}
    </div>
  );
}
