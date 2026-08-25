'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NuevoAsientoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transaccionId = searchParams.get('transaccionId');

  const [cuentas, setCuentas] = useState<any[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');
  
  const [detalles, setDetalles] = useState([
    { id: 1, cuentaId: '', debe: '', haber: '' },
    { id: 2, cuentaId: '', debe: '', haber: '' }
  ]);
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transaccionData, setTransaccionData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/cuentas')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setCuentas(data);
      })
      .catch(err => console.error(err));

    if (transaccionId) {
      fetch(`/api/transacciones/${transaccionId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setTransaccionData(data);
            setFecha(data.fecha.split('T')[0]);
            const socioNombre = data.socio ? ` - ${data.socio.nombre_apellido}` : '';
            const concepto = data.codigo_concepto || data.clasificacion || data.detalle || '';
            setDescripcion(`Contabilización de ${data.tipo} Recibo #${data.recibo} ${socioNombre}: ${concepto}`);
            
            // Auto-fill montos
            setDetalles([
              { id: 1, cuentaId: '', debe: data.tipo === 'EGRESO' ? String(data.monto_bs) : '', haber: data.tipo === 'INGRESO' ? String(data.monto_bs) : '' },
              { id: 2, cuentaId: '', debe: data.tipo === 'INGRESO' ? String(data.monto_bs) : '', haber: data.tipo === 'EGRESO' ? String(data.monto_bs) : '' }
            ]);
          }
        })
        .catch(err => console.error(err));
    }
  }, [transaccionId]);

  const totalDebe = detalles.reduce((acc, curr) => acc + (Number(curr.debe) || 0), 0);
  const totalHaber = detalles.reduce((acc, curr) => acc + (Number(curr.haber) || 0), 0);
  const descuadre = Math.abs(totalDebe - totalHaber);
  const estaCuadrado = descuadre < 0.01 && totalDebe > 0;

  const handleAddDetalle = () => {
    setDetalles([...detalles, { id: Date.now(), cuentaId: '', debe: '', haber: '' }]);
  };

  const handleRemoveDetalle = (id: number) => {
    if (detalles.length <= 2) return;
    setDetalles(detalles.filter(d => d.id !== id));
  };

  const updateDetalle = (id: number, field: string, value: string) => {
    setDetalles(detalles.map(d => {
      if (d.id === id) {
        // Clear the opposite field if typing in one side to prevent confusion
        if (field === 'debe' && value !== '') return { ...d, [field]: value, haber: '' };
        if (field === 'haber' && value !== '') return { ...d, [field]: value, debe: '' };
        return { ...d, [field]: value };
      }
      return d;
    }));
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!descripcion.trim()) {
      setError('La descripción del asiento es obligatoria.');
      return;
    }
    
    if (!estaCuadrado) {
      setError('El asiento está descuadrado. El total del Debe y Haber deben ser exactamente iguales.');
      return;
    }
    
    const cleanDetalles = detalles.filter(d => d.cuentaId !== '' && (Number(d.debe) > 0 || Number(d.haber) > 0));
    
    if (cleanDetalles.length < 2) {
      setError('Debe incluir al menos dos movimientos contables válidos.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/asientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha,
          descripcion,
          transaccionId,
          detalles: cleanDetalles.map(d => ({
            cuentaId: Number(d.cuentaId),
            debe: Number(d.debe || 0),
            haber: Number(d.haber || 0)
          }))
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar');
      }
      
      router.push('/contabilidad/asientos');
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/contabilidad/asientos" className="text-gray-400 hover:text-[#0F172A] transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Nuevo Asiento Contable</h1>
          <p className="text-gray-500">
            {transaccionId ? 'Generando asiento desde Recibo' : 'Registro manual en el Libro Diario'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {transaccionData && (
        <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-[#0F172A] font-bold mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-[#3B82F6]" /> 
            Información del Recibo Original
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 font-semibold mb-1">Tipo y Nro</p>
              <p className="font-bold text-[#0F172A]">{transaccionData.tipo} #{transaccionData.recibo}</p>
            </div>
            <div>
              <p className="text-gray-500 font-semibold mb-1">Socio / Entidad</p>
              <p className="font-medium text-[#0F172A] truncate">
                {transaccionData.socio ? transaccionData.socio.nombre_apellido : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-semibold mb-1">Clasificación</p>
              <p className="font-medium text-[#0F172A]">{transaccionData.clasificacion || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-semibold mb-1">Monto Total</p>
              <p className="font-bold text-[#3B82F6]">Bs {transaccionData.monto_bs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
            </div>
            <div className="md:col-span-4 mt-2 pt-3 border-t border-blue-100">
              <p className="text-gray-500 font-semibold mb-1">Detalle u Observaciones:</p>
              <p className="font-medium text-[#0F172A]">{transaccionData.detalle || 'Sin observaciones.'}</p>
            </div>
            
            {/* Payment Methods Section */}
            <div className="md:col-span-4 mt-2 pt-3 border-t border-blue-100">
              <p className="text-gray-500 font-semibold mb-2">Formas de Pago Registradas:</p>
              {transaccionData.formas_pago && transaccionData.formas_pago.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {transaccionData.formas_pago.map((fp: any, idx: number) => (
                    <div key={idx} className="bg-white border border-blue-200 rounded p-2 text-xs shadow-sm">
                      <span className="font-bold text-[#0F172A] block">{fp.tipo_pago}</span>
                      {fp.banco && <span className="text-gray-600 block">Banco: {fp.banco}</span>}
                      {fp.referencia && <span className="text-gray-600 block">Ref: {fp.referencia}</span>}
                      <span className="font-bold text-[#3B82F6] mt-1 block">Bs {fp.monto_bs.toLocaleString('es-VE', {minimumFractionDigits:2})}</span>
                      {fp.monto_usd && <span className="text-gray-500 block">${fp.monto_usd.toLocaleString('en-US', {minimumFractionDigits:2})}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-medium text-gray-500 italic">No hay detalle de formas de pago (probablemente importado de histórico base).</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
              <input 
                type="date" 
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] outline-none transition-all"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción del Asiento (Concepto)</label>
              <input 
                type="text" 
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Registro de cobranza del mes de Abril 2026..."
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0F172A] text-white">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/2">Cuenta Contable</th>
                <th className="px-6 py-4 font-semibold text-right w-1/5">Debe (Bs)</th>
                <th className="px-6 py-4 font-semibold text-right w-1/5">Haber (Bs)</th>
                <th className="px-6 py-4 font-semibold text-center w-24">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {detalles.map((detalle, index) => (
                <tr key={detalle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <select
                      value={detalle.cuentaId}
                      onChange={(e) => updateDetalle(detalle.id, 'cuentaId', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#3B82F6] outline-none"
                    >
                      <option value="">Seleccione una cuenta...</option>
                      {cuentas.map(c => (
                        <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={detalle.debe}
                      onChange={(e) => updateDetalle(detalle.id, 'debe', e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm text-right focus:ring-2 focus:ring-[#3B82F6] outline-none"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={detalle.haber}
                      onChange={(e) => updateDetalle(detalle.id, 'haber', e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm text-right focus:ring-2 focus:ring-[#3B82F6] outline-none"
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button 
                      onClick={() => handleRemoveDetalle(detalle.id)}
                      disabled={detalles.length <= 2}
                      className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td className="px-6 py-4">
                  <button 
                    onClick={handleAddDetalle}
                    className="flex items-center gap-2 text-[#3B82F6] hover:text-blue-700 font-semibold text-sm transition-colors"
                  >
                    <Plus size={16} /> Agregar Línea
                  </button>
                </td>
                <td className={`px-6 py-4 text-right font-bold text-lg ${!estaCuadrado && totalDebe > 0 ? 'text-red-500' : 'text-[#0F172A]'}`}>
                  {formatCurrency(totalDebe)}
                </td>
                <td className={`px-6 py-4 text-right font-bold text-lg ${!estaCuadrado && totalHaber > 0 ? 'text-red-500' : 'text-[#0F172A]'}`}>
                  {formatCurrency(totalHaber)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!estaCuadrado || isSubmitting}
          className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 disabled:bg-gray-300 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-sm"
        >
          {isSubmitting ? 'Guardando...' : (
            <>
              <Save size={20} />
              Procesar Asiento
            </>
          )}
        </button>
      </div>
    </div>
  );
}
