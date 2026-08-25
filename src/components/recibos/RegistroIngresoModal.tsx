import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

export default function RegistroIngresoModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    recibo: '',
    fecha: new Date().toISOString().split('T')[0],
    mes: '2026-01',
    monto_bs: '',
    clasificacion: 'CUOTA',
    detalle: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await fetch('/api/transacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tipo: 'INGRESO',
          monto_bs: Number(formData.monto_bs)
        })
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="font-bold text-lg">Registrar Nuevo Ingreso</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Nro Recibo</label>
              <input 
                type="text" required
                value={formData.recibo}
                onChange={e => setFormData({...formData, recibo: e.target.value})}
                className="w-full border rounded-lg p-2" 
                placeholder="Ej. 1024"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Fecha</label>
              <input 
                type="date" required
                value={formData.fecha}
                onChange={e => setFormData({...formData, fecha: e.target.value, mes: e.target.value.substring(0, 7)})}
                className="w-full border rounded-lg p-2" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1">Monto (Bs)</label>
            <input 
              type="number" step="0.01" required
              value={formData.monto_bs}
              onChange={e => setFormData({...formData, monto_bs: e.target.value})}
              className="w-full border rounded-lg p-2"
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1">Clasificación / Concepto</label>
            <input 
              type="text" required
              value={formData.clasificacion}
              onChange={e => setFormData({...formData, clasificacion: e.target.value})}
              className="w-full border rounded-lg p-2"
              placeholder="Ej. CUOTA"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1">Detalle</label>
            <input 
              type="text" 
              value={formData.detalle}
              onChange={e => setFormData({...formData, detalle: e.target.value})}
              className="w-full border rounded-lg p-2"
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Save size={18} /> Guardar Ingreso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
