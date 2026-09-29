import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Calculator } from 'lucide-react';

export default function RegistroIngresoModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    recibo: '',
    fecha: new Date().toISOString().split('T')[0],
    mes: '2026-01', // Ideally this should be dynamic based on the context, but keeping as original
    monto_bs: '',
    clasificacion: 'CUOTA',
    detalle: ''
  });
  
  // Nuevos estados para la calculadora bimonetaria
  const [moneda, setMoneda] = useState('Bs');
  const [montoUsd, setMontoUsd] = useState('');
  const [tasaCambio, setTasaCambio] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Efecto para calcular automáticamente los Bolívares si se usa USD
  useEffect(() => {
    if (moneda === 'USD' && montoUsd && tasaCambio) {
      const calcBs = parseFloat(montoUsd) * parseFloat(tasaCambio);
      if (!isNaN(calcBs)) {
        setFormData(prev => ({ ...prev, monto_bs: calcBs.toFixed(2) }));
      }
    }
  }, [moneda, montoUsd, tasaCambio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const payload: any = {
        ...formData,
        tipo: 'INGRESO',
        monto_bs: Number(formData.monto_bs)
      };

      // Si se recibió en USD, mandamos el rastro para auditoría
      if (moneda === 'USD') {
        payload.monto_usd = Number(montoUsd);
        payload.tasa_cambio = Number(tasaCambio);
      }

      const res = await fetch('/api/transacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0 bg-[#0A1128] text-white">
          <h3 className="font-bold text-lg">Registrar Nuevo Ingreso</h3>
          <button type="button" onClick={onClose} className="hover:text-gray-300"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex gap-2 items-center">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nro Recibo</label>
              <input 
                type="text" required
                value={formData.recibo}
                onChange={e => setFormData({...formData, recibo: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none" 
                placeholder="Ej. 1024"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
              <input 
                type="date" required
                value={formData.fecha}
                onChange={e => setFormData({...formData, fecha: e.target.value, mes: e.target.value.substring(0, 7)})}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none" 
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-[#0A1128]">Moneda Recibida</label>
              <div className="flex bg-white rounded-md border border-gray-300 overflow-hidden">
                <button 
                  type="button" 
                  onClick={() => setMoneda('Bs')}
                  className={`px-3 py-1 text-xs font-bold ${moneda === 'Bs' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Bs.
                </button>
                <button 
                  type="button" 
                  onClick={() => setMoneda('USD')}
                  className={`px-3 py-1 text-xs font-bold ${moneda === 'USD' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  USD
                </button>
              </div>
            </div>

            {moneda === 'USD' && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Monto en USD</label>
                  <input 
                    type="number" step="0.01" required
                    value={montoUsd}
                    onChange={e => setMontoUsd(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-1.5 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tasa BCV</label>
                  <input 
                    type="number" step="0.01" required
                    value={tasaCambio}
                    onChange={e => setTasaCambio(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-1.5 text-sm"
                    placeholder="Ej. 42.50"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex justify-between items-center">
                <span>Total a Contabilizar (Bs)</span>
                {moneda === 'USD' && <span className="text-xs text-blue-600 flex items-center gap-1"><Calculator size={12}/> Calculado Auto.</span>}
              </label>
              <input 
                type="number" step="0.01" required
                value={formData.monto_bs}
                onChange={e => setFormData({...formData, monto_bs: e.target.value})}
                readOnly={moneda === 'USD'}
                className={`w-full border rounded-lg p-2 font-bold text-lg ${moneda === 'USD' ? 'bg-blue-50 border-blue-200 text-blue-900' : 'border-gray-300 text-gray-900'}`}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Clasificación / Concepto</label>
            <input 
              type="text" required
              value={formData.clasificacion}
              onChange={e => setFormData({...formData, clasificacion: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="Ej. CUOTA"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Detalle</label>
            <input 
              type="text" 
              value={formData.detalle}
              onChange={e => setFormData({...formData, detalle: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 shadow-md">
              <Save size={18} /> Guardar Ingreso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
