'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash, Printer, Save } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import PrintableView, { Concepto, DetallePago, ReceiptData } from './PrintableView';

export default function ReceiptForm() {
  const { sociosDirectorio, publicaciones, refreshData } = useAppStore();
  
  const [tipo, setTipo] = useState<'INGRESO_CXP' | 'INGRESO_VARIOS' | 'EGRESO_ADMIN' | 'EGRESO_CXP'>('INGRESO_CXP');
  const [mesAProcesar, setMesAProcesar] = useState<string>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [numeroRecibo, setNumeroRecibo] = useState<string>('');
  const [fichaBusqueda, setFichaBusqueda] = useState('');
  
  const [socioSeleccionado, setSocioSeleccionado] = useState<{ id: number, ficha: string, nombre: string, cedula: string } | null>(null);
  
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

      if (!data.conceptos || data.conceptos.length === 0) {
        alert(`No hay deudas o pagos pendientes para este socio en el mes de ${mes}. (O ya fueron procesados previamente)`);
        setConceptos([]);
        return;
      }

      const newConceptos: Concepto[] = [];

      if (currentTipo === 'INGRESO_CXP') {
        data.conceptos.forEach((cxc: any, idx: number) => {
          newConceptos.push({
            codigo: `10${idx}`,
            descripcion: `${cxc.tipo_publicacion} ${mes}`,
            subtotal: cxc.monto_a_cobrar,
            cantidad: 1,
            total: cxc.monto_a_cobrar
          });
        });
        setConceptos(newConceptos);
      } else if (currentTipo === 'EGRESO_CXP') {
        data.conceptos.forEach((cxp: any, idx: number) => {
          newConceptos.push({
            codigo: `EV-${idx+1}`,
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
      alert('Por favor ingrese una ficha');
      return;
    }
    const cleanSearch = fichaBusqueda.trim().toUpperCase().replace(/[-\s]/g, '');
    const socio = sociosDirectorio.find((s: any) => {
      const sficha = s.ficha ? s.ficha.trim().toUpperCase().replace(/[-\s]/g, '') : '';
      return sficha === cleanSearch;
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
    setConceptos([...conceptos, { codigo: '', descripcion: '', subtotal: 0, cantidad: 1, total: 0 }]);
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

  const handleSave = async () => {
    if ((tipo === 'INGRESO_CXP' || tipo === 'EGRESO_CXP') && !socioSeleccionado) {
      alert('Debe seleccionar un socio para este tipo de recibo.');
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
        clasificacion: tipo, // 'INGRESO_CXP' | 'INGRESO_VARIOS' | 'EGRESO_CXP' | 'EGRESO_ADMIN'
        recibo: numeroRecibo,
        socioId: socioSeleccionado ? socioSeleccionado.id : null,
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

  const handlePrint = () => {
    window.print();
  };

  const receiptData: ReceiptData = {
    tipo,
    numeroRecibo,
    fecha: new Date(fecha),
    socio: socioSeleccionado || { ficha: '', nombre: '', cedula: '' },
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
              onClick={() => { setTipo('INGRESO_CXP'); setConceptos([]); }}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${tipo === 'INGRESO_CXP' ? 'bg-[#2563EB] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Ingreso (Pubs)
            </button>
            <button
              onClick={() => { setTipo('INGRESO_VARIOS'); setConceptos([]); }}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${tipo === 'INGRESO_VARIOS' ? 'bg-[#2563EB] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Ingreso (Varios)
            </button>
            <button
              onClick={() => { setTipo('EGRESO_CXP'); setConceptos([]); }}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${tipo === 'EGRESO_CXP' ? 'bg-[#2563EB] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Egreso (Pubs)
            </button>
            <button
              onClick={() => { setTipo('EGRESO_ADMIN'); setConceptos([]); }}
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Buscar Asociado (Ficha)</label>
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
          </div>

          {/* Fila 2: Datos del Socio */}
          {socioSeleccionado && (
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
    </div>
  );
}
