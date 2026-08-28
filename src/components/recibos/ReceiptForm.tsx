'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash, Printer, Save } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import PrintableView, { Concepto, DetallePago, ReceiptData } from './PrintableView';

export default function ReceiptForm() {
  const { sociosDirectorio, terceros, categoriasMovimiento, publicaciones, refreshData } = useAppStore();
  
  const [tipo, setTipo] = useState<'INGRESO_CXP' | 'INGRESO_VARIOS' | 'EGRESO_ADMIN' | 'EGRESO_CXP'>('INGRESO_CXP');
  const [mesAProcesar, setMesAProcesar] = useState<string>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [numeroRecibo, setNumeroRecibo] = useState<string>('');
  const [fichaBusqueda, setFichaBusqueda] = useState('');
  const [terceroBusqueda, setTerceroBusqueda] = useState('');
  const [socioSeleccionado, setSocioSeleccionado] = useState<{ id: number, ficha: string, nombre: string, cedula: string } | null>(null);
  const [terceroSeleccionado, setTerceroSeleccionado] = useState<any | null>(null);
  const [isTerceroModalOpen, setIsTerceroModalOpen] = useState(false);
  const [nuevoTerceroForm, setNuevoTerceroForm] = useState({ tipo: 'PROVEEDOR', nombre: '', identificacion: '', telefono: '', direccion: '' });

  const categoriasIngreso = categoriasMovimiento ? categoriasMovimiento.filter((c: any) => c.tipo === 'INGRESO') : [];
  const categoriasEgreso = categoriasMovimiento ? categoriasMovimiento.filter((c: any) => c.tipo === 'EGRESO') : [];

  const INGRESOS_CATEGORIAS = categoriasIngreso.map((c: any) => c.nombre);
  const EGRESOS_CATEGORIAS = categoriasEgreso.map((c: any) => c.nombre);

  const CODIGOS_INGRESOS: Record<string, string> = {};
  categoriasIngreso.forEach((c: any) => CODIGOS_INGRESOS[c.nombre] = c.codigo);

  const CODIGOS_EGRESOS: Record<string, string> = {};
  categoriasEgreso.forEach((c: any) => CODIGOS_EGRESOS[c.nombre] = c.codigo);

  const [tipoEntidad, setTipoEntidad] = useState<'SOCIO' | 'TERCERO'>('SOCIO');

  const [clasificacionCustom, setClasificacionCustom] = useState<string>('');
  
  const [mesesPendientes, setMesesPendientes] = useState<string[]>([]);
  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [pago, setPago] = useState<DetallePago>({
    tipo_pago: 'TRANSFERENCIA',
    referencia: '',
    banco: '',
    tasa_cambio: 36.5,
    monto_bs: 0,
    monto_usd: 0
  });
  const [nota, setNota] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  // Auto-generate receipt number effect
  useEffect(() => {
    const prefix = tipo.startsWith('INGRESO') ? 'I' : 'E';
    const year = new Date(fecha).getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000); // Temporary placeholder logic
    setNumeroRecibo(`${prefix}${year}${randomSuffix}`);
  }, [tipo, fecha]);

  // Obtener meses aprobados de las publicaciones
  const mesesAprobados = publicaciones
    .filter(p => p.estado === 'APROBADO')
    .map(p => p.mes);

  useEffect(() => {
    if (mesesAprobados.length > 0 && !mesAProcesar) {
      setMesAProcesar(mesesAprobados[0]);
    }
  }, [publicaciones]);

  const granTotalBs = conceptos.reduce((acc, c) => acc + c.total, 0);

  const precargarConceptos = async (socio: any, mes: string, currentTipo: string) => {
    if (!mes || (currentTipo !== 'INGRESO_CXP' && currentTipo !== 'EGRESO_CXP')) return;
    
    // Validación de duplicado
    try {
      const res = await fetch(`/api/recibos/check?socioId=${socio.id}&mes=${mes}&clasificacion=${currentTipo}`);
      const data = await res.json();
      if (data.exists) {
        alert(`Error: Este socio ya tiene un recibo procesado para el mes de ${mes} bajo el concepto de ${currentTipo === 'INGRESO_CXP' ? 'Ingreso por Publicaciones' : 'Egreso por Publicaciones'}.`);
        setSocioSeleccionado(null);
        setConceptos([]);
        return;
      }
    } catch (error) {
      console.error('Error verificando recibo:', error);
    }

    try {
      const res = await fetch(`/api/recibos/conceptos?socioId=${socio.id}&mes=${mes}&tipo=${currentTipo}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMesesPendientes(data.mesesPendientes || []);

      if (!data.conceptos || data.conceptos.length === 0) {
        let msg = `No hay deudas o pagos pendientes para este socio en el mes de ${mes}. (O ya fueron procesados previamente).`;
        if (data.mesesPendientes && data.mesesPendientes.length > 0) {
          msg += `\n\n¡ATENCIÓN! Este socio tiene deuda pendiente en otros meses:\n${data.mesesPendientes.join(', ')}`;
        }
        alert(msg);
        setConceptos([]);
        return;
      }

      const newConceptos: Concepto[] = [];

      if (currentTipo === 'INGRESO_CXP') {
        data.conceptos.forEach((cxc: any, idx: number) => {
          newConceptos.push({
            codigo: CODIGOS_INGRESOS[cxc.tipo_publicacion] || `10${idx}`,
            descripcion: `${cxc.tipo_publicacion} ${mes}`,
            subtotal: cxc.monto_a_cobrar,
            cantidad: 1,
            total: cxc.monto_a_cobrar
          });
        });
        setConceptos(newConceptos);
      } else if (currentTipo === 'EGRESO_CXP') {
        data.conceptos.forEach((cxp: any, idx: number) => {
          let code = `EV-${idx+1}`;
          if (cxp.tipo_publicacion === 'VIDRIOS') code = CODIGOS_EGRESOS['PAGO VIDRIOS'] || code;
          if (cxp.tipo_publicacion === 'MONTEPIO') code = CODIGOS_EGRESOS['PAGO MONTEPIO'] || code;
          if (cxp.tipo_publicacion === 'AYUDAS') code = CODIGOS_EGRESOS['PAGO DE AYUDAS'] || code;
          if (cxp.tipo_publicacion === 'REMANENTE') code = CODIGOS_EGRESOS['REMANENTE'] || code;

          newConceptos.push({
            codigo: code,
            descripcion: `Beneficio ${cxp.tipo_publicacion} - ${cxp.parentesco || ''} (${mes})`,
            subtotal: cxp.monto,
            cantidad: 1,
            total: cxp.monto
          });
        });
        setConceptos(newConceptos);
      }
    } catch(e) {
      console.error('Error obteniendo conceptos desde DB', e);
      alert('Hubo un error cargando los conceptos de la base de datos.');
    }
  };

  const handleBuscarSocio = () => {
    if (!fichaBusqueda || fichaBusqueda.trim() === '') {
      alert('Por favor ingrese un Cupo');
      return;
    }
    const cleanSearch = fichaBusqueda.trim().toUpperCase().replace(/[-\s]/g, '');
    const socio = sociosDirectorio.find((s: any) => {
      const scupo = s.codigo ? s.codigo.trim().toUpperCase().replace(/[-\s]/g, '') : '';
      return scupo === cleanSearch;
    });
    if (socio) {
      setSocioSeleccionado({
        id: socio.id,
        ficha: socio.ficha,
        nombre: socio.nombre_apellido,
        cedula: socio.cedula || 'N/A'
      });
      precargarConceptos(socio, mesAProcesar, tipo);
    } else {
      alert('Socio no encontrado en la base de datos');
      setSocioSeleccionado(null);
    }
  };

  const addConcepto = () => {
    let defaultCode = '';
    let defaultDesc = '';
    if (tipo === 'INGRESO_VARIOS') {
      defaultCode = CODIGOS_INGRESOS[clasificacionCustom] || '';
      defaultDesc = clasificacionCustom || '';
    }
    if (tipo === 'EGRESO_ADMIN') {
      defaultCode = CODIGOS_EGRESOS[clasificacionCustom] || '';
      defaultDesc = clasificacionCustom || '';
    }

    setConceptos([...conceptos, {
      codigo: defaultCode,
      descripcion: defaultDesc,
      subtotal: 0,
      cantidad: 1,
      total: 0
    }]);
  };

  const removeConcepto = (index: number) => {
    setConceptos(conceptos.filter((_, i) => i !== index));
  };

  const updateConcepto = (index: number, field: keyof Concepto, value: any) => {
    const newConceptos = [...conceptos];
    newConceptos[index] = { ...newConceptos[index], [field]: value };
    if (field === 'subtotal' || field === 'cantidad') {
      newConceptos[index].total = newConceptos[index].subtotal * newConceptos[index].cantidad;
    }
    setConceptos(newConceptos);
  };

  const handleBuscarTercero = () => {
    if (!terceroBusqueda || terceroBusqueda.trim() === '') {
      alert('Por favor ingrese Nombre o RIF del Tercero');
      return;
    }
    const cleanSearch = terceroBusqueda.trim().toUpperCase();
    const tercero = terceros.find((t: any) => 
      t.nombre.toUpperCase().includes(cleanSearch) || 
      (t.identificacion && t.identificacion.toUpperCase().includes(cleanSearch))
    );
    if (tercero) {
      setTerceroSeleccionado(tercero);
      setConceptos([]);
    } else {
      alert('No se encontró ningún tercero con ese nombre o RIF. Puedes crear uno nuevo.');
    }
  };

  const handleCrearTercero = async () => {
    if (!nuevoTerceroForm.nombre || !nuevoTerceroForm.tipo) {
      alert('Nombre y Tipo son obligatorios.');
      return;
    }
    try {
      const res = await fetch('/api/terceros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoTerceroForm)
      });
      if (res.ok) {
        const data = await res.json();
        await refreshData();
        setTerceroSeleccionado(data);
        setIsTerceroModalOpen(false);
        setNuevoTerceroForm({ tipo: 'PROVEEDOR', nombre: '', identificacion: '', telefono: '', direccion: '' });
      } else {
        alert('Error al crear tercero');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const handleSave = async () => {
    if ((tipo === 'INGRESO_CXP' || tipo === 'EGRESO_CXP') && !socioSeleccionado) {
      alert('Debe seleccionar un socio para este tipo de recibo.');
      return;
    }
    if ((tipo === 'INGRESO_VARIOS' || tipo === 'EGRESO_ADMIN')) {
      if (tipoEntidad === 'SOCIO' && !socioSeleccionado) {
        alert('Debe seleccionar un socio.');
        return;
      }
      if (tipoEntidad === 'TERCERO' && !terceroSeleccionado) {
        alert('Debe seleccionar o registrar un tercero.');
        return;
      }
    }
    if ((tipo === 'INGRESO_VARIOS' || tipo === 'EGRESO_ADMIN') && !clasificacionCustom) {
      alert('Debe seleccionar una Categoría del Movimiento antes de guardar.');
      return;
    }
    if (conceptos.length === 0) {
      alert('Debe agregar al menos un concepto');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        tipo: tipo.startsWith('EGRESO') ? 'EGRESO' : 'INGRESO',
        clasificacion: (tipo === 'INGRESO_VARIOS' || tipo === 'EGRESO_ADMIN') ? (clasificacionCustom || tipo) : tipo,
        recibo: numeroRecibo,
        socioId: socioSeleccionado ? socioSeleccionado.id : null,
        terceroId: terceroSeleccionado ? terceroSeleccionado.id : null,
        conceptos,
        pago,
        fecha,
        mes: mesAProcesar || `${new Date(fecha).getMonth() + 1}-${new Date(fecha).getFullYear()}`,
        montoTotalBs: granTotalBs,
        montoTotalUsd: granTotalBs / (pago.tasa_cambio || 1)
      };

      const res = await fetch('/api/recibos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error guardando el recibo');

      await refreshData();
      setSaveSuccess(true);
      setShowPrint(true);
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al guardar el recibo');
    } finally {
      setIsSaving(false);
    }
  };

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePrint = () => {
    setIsPreviewOpen(true);
  };

  const triggerPrint = () => {
    window.print();
  };

  const receiptData: ReceiptData = {
    tipo: tipo.startsWith('EGRESO') ? 'EGRESO' : 'INGRESO',
    numeroRecibo,
    fecha: new Date(fecha),
    socio: socioSeleccionado 
      ? {
          ficha: socioSeleccionado.ficha,
          nombre: socioSeleccionado.nombre,
          cedula: socioSeleccionado.cedula
        }
      : terceroSeleccionado 
        ? {
            ficha: terceroSeleccionado.tipo,
            nombre: terceroSeleccionado.nombre,
            cedula: terceroSeleccionado.identificacion || 'N/A'
          }
        : { ficha: '', nombre: '', cedula: '' },
    conceptos,
    pago,
    granTotalBs,
    nota
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Controles solo en pantalla */}
      <div className="no-print bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        {/* Header Toggle */}
        <div className="bg-[#0A1128] text-white p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">Emisión de Recibos</h2>
          <div className="flex bg-[#1E293B] rounded-lg p-1 gap-1">
            <button
              onClick={() => { setTipo('INGRESO_CXP'); setConceptos([]); setTipoEntidad('SOCIO'); }}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${tipo === 'INGRESO_CXP' ? 'bg-[#2563EB] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Ingreso (Pubs)
            </button>
            <button
              onClick={() => { setTipo('INGRESO_VARIOS'); setConceptos([]); setTipoEntidad('TERCERO'); }}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${tipo === 'INGRESO_VARIOS' ? 'bg-[#2563EB] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Ingreso (Varios)
            </button>
            <button
              onClick={() => { setTipo('EGRESO_CXP'); setConceptos([]); setTipoEntidad('SOCIO'); }}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${tipo === 'EGRESO_CXP' ? 'bg-[#2563EB] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Egreso (Pubs)
            </button>
            <button
              onClick={() => { setTipo('EGRESO_ADMIN'); setConceptos([]); setTipoEntidad('TERCERO'); }}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${tipo === 'EGRESO_ADMIN' ? 'bg-[#2563EB] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Egreso (Admin)
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Fila 1: Cabecera General */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha del Recibo</label>
              <input 
                type="date" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Número de Recibo</label>
              <input 
                type="text" 
                value={numeroRecibo} 
                readOnly
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed" 
              />
            </div>
            {(tipo === 'INGRESO_CXP' || tipo === 'EGRESO_CXP') && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mes a Procesar</label>
                <select
                  value={mesAProcesar}
                  onChange={(e) => {
                    setMesAProcesar(e.target.value);
                    setConceptos([]); // Limpiar conceptos para evitar mezclas
                  }}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white"
                >
                  {mesesAprobados.length === 0 && <option value="">Sin meses aprobados</option>}
                  {mesesAprobados.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}
            {(tipo === 'INGRESO_CXP' || tipo === 'EGRESO_CXP' || tipoEntidad === 'SOCIO') ? (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-gray-700">Buscar Asociado (Cupo)</label>
                  {(tipo === 'INGRESO_VARIOS' || tipo === 'EGRESO_ADMIN') && (
                    <button onClick={() => { setTipoEntidad('TERCERO'); setSocioSeleccionado(null); }} className="text-xs text-blue-600 font-bold hover:underline">
                      ¿Es a un Tercero? Cambiar
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ej. SA082" 
                    value={fichaBusqueda}
                    onChange={e => setFichaBusqueda(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBuscarSocio()}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] uppercase" 
                  />
                  <button 
                    onClick={handleBuscarSocio}
                    className="bg-[#0A1128] text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                  >
                    Buscar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-gray-700">Buscar Tercero (Nombre o RIF)</label>
                  <button onClick={() => { setTipoEntidad('SOCIO'); setTerceroSeleccionado(null); }} className="text-xs text-blue-600 font-bold hover:underline">
                    ¿Es a un Socio? Cambiar
                  </button>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ej. J-12345678-9 o Ferretería" 
                    value={terceroBusqueda}
                    onChange={e => setTerceroBusqueda(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBuscarTercero()}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] uppercase" 
                  />
                  <button 
                    onClick={handleBuscarTercero}
                    className="bg-[#0A1128] text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                  >
                    Buscar
                  </button>
                  <button 
                    onClick={() => setIsTerceroModalOpen(true)}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition flex items-center whitespace-nowrap"
                  >
                    + Nuevo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fila 2: Datos de la Entidad */}
          {socioSeleccionado && (tipo === 'INGRESO_CXP' || tipo === 'EGRESO_CXP' || tipoEntidad === 'SOCIO') && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase">Nombre y Apellido</p>
                  <p className="font-semibold text-gray-800 text-lg">{socioSeleccionado.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase">Cédula</p>
                  <p className="font-semibold text-gray-800 text-lg">{socioSeleccionado.cedula}</p>
                </div>
              </div>

              {mesesPendientes.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-center">
                  <div className="mr-3">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold">¡ATENCIÓN! Este socio tiene otras deudas pendientes:</p>
                    <p className="text-sm">Meses atrasados: <span className="font-semibold">{mesesPendientes.join(', ')}</span></p>
                  </div>
                </div>
              )}
            </div>
          )}

          {terceroSeleccionado && (tipo === 'INGRESO_VARIOS' || tipo === 'EGRESO_ADMIN') && tipoEntidad === 'TERCERO' && (
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-green-600 font-bold uppercase">Nombre / Razón Social</p>
                <p className="font-semibold text-gray-800 text-lg">{terceroSeleccionado.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-green-600 font-bold uppercase">Identificación (RIF/C.I.)</p>
                <p className="font-semibold text-gray-800 text-lg">{terceroSeleccionado.identificacion || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-green-600 font-bold uppercase">Tipo</p>
                <p className="font-semibold text-gray-800 text-lg">{terceroSeleccionado.tipo}</p>
              </div>
            </div>
          )}

          {/* Fila Extra: Clasificación (solo para Varios/Admin) */}
          {(tipo === 'INGRESO_VARIOS' || tipo === 'EGRESO_ADMIN') && (
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <label className="block text-sm font-semibold text-purple-800 mb-2">Categoría del Movimiento</label>
              <select
                value={clasificacionCustom}
                onChange={e => {
                  const newCat = e.target.value;
                  setClasificacionCustom(newCat);
                  if (newCat) {
                    let code = '';
                    if (tipo === 'INGRESO_VARIOS') code = CODIGOS_INGRESOS[newCat] || '';
                    if (tipo === 'EGRESO_ADMIN') code = CODIGOS_EGRESOS[newCat] || '';
                    
                    setConceptos([{
                      codigo: code,
                      descripcion: newCat,
                      subtotal: 0,
                      cantidad: 1,
                      total: 0
                    }]);
                  } else {
                    setConceptos([]);
                  }
                }}
                className="w-full p-2.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">-- Selecciona una categoría --</option>
                {tipo === 'INGRESO_VARIOS' && INGRESOS_CATEGORIAS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {tipo === 'EGRESO_ADMIN' && EGRESOS_CATEGORIAS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* Fila 3: Conceptos */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Conceptos</h3>
              <button onClick={addConcepto} className="flex items-center gap-1 text-sm bg-blue-100 text-[#2563EB] px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-200 transition">
                <Plus size={16} /> Agregar Fila
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-3 text-sm font-semibold text-gray-600">Código</th>
                    <th className="p-3 text-sm font-semibold text-gray-600 w-1/3">Descripción</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Subtotal</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Cant.</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Total</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {conceptos.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2">
                        <input type="text" value={c.codigo} onChange={e => updateConcepto(i, 'codigo', e.target.value)} className="w-full p-2 border rounded" placeholder="Ej. 1264" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={c.descripcion} onChange={e => updateConcepto(i, 'descripcion', e.target.value)} className="w-full p-2 border rounded" placeholder="Ej. Finanzas" />
                      </td>
                      <td className="p-2">
                        <input type="number" value={c.subtotal || ''} onChange={e => updateConcepto(i, 'subtotal', parseFloat(e.target.value))} className="w-full p-2 border rounded" />
                      </td>
                      <td className="p-2">
                        <input type="number" value={c.cantidad || ''} onChange={e => updateConcepto(i, 'cantidad', parseFloat(e.target.value))} className="w-full p-2 border rounded" />
                      </td>
                      <td className="p-2 font-semibold text-gray-700">
                        Bs {c.total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right">
                        <button onClick={() => removeConcepto(i)} className="text-red-500 hover:text-red-700 p-2">
                          <Trash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {conceptos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400 italic">No hay conceptos agregados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end mt-4">
              <div className="bg-[#0A1128] text-white px-6 py-3 rounded-lg shadow-md flex items-center gap-4">
                <span className="font-semibold text-gray-300">GRAN TOTAL</span>
                <span className="text-2xl font-bold">Bs {granTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Fila 4: Detalles de Pago */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Detalles de Pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Pago</label>
                <select 
                  value={pago.tipo_pago}
                  onChange={e => setPago({...pago, tipo_pago: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="EFECTIVO BS">Efectivo Bs</option>
                  <option value="EFECTIVO USD">Efectivo USD</option>
                  <option value="PAGO MOVIL">Pago Móvil</option>
                  <option value="CANJE">Canje</option>
                  <option value="DEBITO">Débito</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Referencia</label>
                <input 
                  type="text" 
                  value={pago.referencia}
                  onChange={e => setPago({...pago, referencia: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg" 
                  placeholder="N° de Ref"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Banco / Origen</label>
                <select 
                  value={pago.banco}
                  onChange={e => setPago({...pago, banco: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg uppercase"
                >
                  <option value="">Seleccione...</option>
                  <option value="BANCAMIGA">Bancamiga</option>
                  <option value="MERCANTIL">Mercantil</option>
                  <option value="BANESCO">Banesco</option>
                  <option value="ACPCCH OFICINA">ACPCCH Oficina</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tasa BCV</label>
                <input 
                  type="number" 
                  value={pago.tasa_cambio || ''}
                  onChange={e => setPago({...pago, tasa_cambio: parseFloat(e.target.value)})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Monto Pagado Bs</label>
                <input 
                  type="number" 
                  value={pago.monto_bs || ''}
                  onChange={e => setPago({...pago, monto_bs: parseFloat(e.target.value)})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-blue-700" 
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nota Adicional</label>
              <input 
                type="text" 
                value={nota}
                onChange={e => setNota(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg" 
                placeholder="Anotaciones u observaciones..."
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            {showPrint && saveSuccess && (
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition"
              >
                <Printer size={20} />
                Imprimir Recibo
              </button>
            )}
            <button 
              onClick={handleSave}
              disabled={isSaving || saveSuccess}
              className={`flex items-center gap-2 px-8 py-3 text-white font-bold rounded-lg shadow-lg transition-transform ${isSaving || saveSuccess ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2563EB] hover:bg-blue-700 hover:scale-[1.02]'}`}
            >
              <Save size={20} />
              {isSaving ? 'Guardando...' : saveSuccess ? 'Guardado ✅' : 'Confirmar y Guardar'}
            </button>
          </div>
          
        </div>
      </div>

      {/* Componente para Imprimir - Oculto por defecto, visible solo en print */}
      {showPrint && (
        <PrintableView data={receiptData} />
      )}

      {/* Preview Modal */}
      {isPreviewOpen && showPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg text-[#0A1128]">Vista Previa del Recibo: {receiptData.numeroRecibo}</h2>
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
                     <p className="font-bold">{receiptData.socio.ficha} - {receiptData.socio.nombre}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-gray-500 uppercase">Recibo / Fecha</p>
                     <p className="font-bold">{receiptData.numeroRecibo} <br/> {new Date(receiptData.fecha).toLocaleDateString()}</p>
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
                     {receiptData.conceptos.map((c, i) => (
                       <tr key={i}>
                         <td className="p-2 border">{c.descripcion}</td>
                         <td className="p-2 border text-right">{c.total.toLocaleString('es-VE', {minimumFractionDigits: 2})}</td>
                       </tr>
                     ))}
                   </tbody>
                   <tfoot>
                     <tr className="bg-gray-50 font-bold">
                       <td className="p-2 border text-right">TOTAL RECIBO:</td>
                       <td className="p-2 border text-right">Bs {receiptData.granTotalBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</td>
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
      {/* Modal Nuevo Tercero */}
      {isTerceroModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Registrar Nuevo Tercero</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Tipo</label>
                <select 
                  value={nuevoTerceroForm.tipo}
                  onChange={e => setNuevoTerceroForm({...nuevoTerceroForm, tipo: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="PROVEEDOR">Proveedor</option>
                  <option value="EMPLEADO">Empleado</option>
                  <option value="CLIENTE">Cliente</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre / Razón Social *</label>
                <input 
                  type="text" 
                  value={nuevoTerceroForm.nombre}
                  onChange={e => setNuevoTerceroForm({...nuevoTerceroForm, nombre: e.target.value})}
                  className="w-full p-2 border rounded uppercase" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Cédula o RIF</label>
                <input 
                  type="text" 
                  value={nuevoTerceroForm.identificacion}
                  onChange={e => setNuevoTerceroForm({...nuevoTerceroForm, identificacion: e.target.value})}
                  className="w-full p-2 border rounded uppercase" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Teléfono</label>
                <input 
                  type="text" 
                  value={nuevoTerceroForm.telefono}
                  onChange={e => setNuevoTerceroForm({...nuevoTerceroForm, telefono: e.target.value})}
                  className="w-full p-2 border rounded" 
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  onClick={() => setIsTerceroModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCrearTercero}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
