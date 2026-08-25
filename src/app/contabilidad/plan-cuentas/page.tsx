'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, ClipboardList, AlertCircle, Save, X, Edit2 } from 'lucide-react';

export default function PlanCuentasPage() {
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    id: null as number | null,
    codigo: '',
    nombre: '',
    tipoSaldo: 'DEUDOR',
    clase: 'REAL'
  });

  const fetchCuentas = async () => {
    try {
      const res = await fetch('/api/cuentas');
      const data = await res.json();
      if (!data.error) setCuentas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCuentas();
  }, []);

  const handleOpenModal = (cuenta?: any) => {
    if (cuenta) {
      setFormData({
        id: cuenta.id,
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipoSaldo: cuenta.tipoSaldo,
        clase: cuenta.clase
      });
    } else {
      setFormData({ id: null, codigo: '', nombre: '', tipoSaldo: 'DEUDOR', clase: 'REAL' });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const isEditing = formData.id !== null;
      const res = await fetch('/api/cuentas', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar');
      }
      
      await fetchCuentas();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCuentas = cuentas.filter(c => 
    c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg text-[#3B82F6]">
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Plan de Cuentas</h1>
            <p className="text-gray-500">Catálogo general de cuentas contables</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar cuenta o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none"
            />
          </div>
          <button 
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            <Plus size={20} />
            Nueva Cuenta
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando catálogo...</div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0F172A] text-white sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold w-40">Código</th>
                  <th className="px-6 py-4 font-semibold">Nombre de la Cuenta</th>
                  <th className="px-6 py-4 font-semibold text-center w-32">Naturaleza</th>
                  <th className="px-6 py-4 font-semibold text-center w-32">Clase</th>
                  <th className="px-6 py-4 font-semibold text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCuentas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No se encontraron cuentas contables.
                    </td>
                  </tr>
                ) : (
                  filteredCuentas.map((cuenta) => (
                    <tr key={cuenta.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-bold text-[#3B82F6]">{cuenta.codigo}</td>
                      <td className="px-6 py-3 text-gray-800 font-medium">{cuenta.nombre}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${cuenta.tipoSaldo === 'DEUDOR' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {cuenta.tipoSaldo}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${cuenta.clase === 'REAL' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {cuenta.clase}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button 
                          onClick={() => handleOpenModal(cuenta)}
                          className="text-gray-400 hover:text-[#3B82F6] transition-colors"
                          title="Editar cuenta"
                        >
                          <Edit2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Crear Nueva Cuenta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-[#0F172A]">
                {formData.id ? 'Editar Cuenta Contable' : 'Agregar Nueva Cuenta'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5">
              {error && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-100">
                  <AlertCircle size={16} />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Código de Cuenta</label>
                  <input 
                    type="text" 
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                    placeholder="Ej. 1.01.01.01"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#3B82F6] outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">El código debe ser único (Ej. formato x.xx.xx).</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la Cuenta</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej. Banco de Venezuela, C.A."
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#3B82F6] outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Naturaleza (Saldo)</label>
                    <select 
                      value={formData.tipoSaldo}
                      onChange={(e) => setFormData({...formData, tipoSaldo: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#3B82F6] outline-none"
                    >
                      <option value="DEUDOR">DEUDOR</option>
                      <option value="ACREEDOR">ACREEDOR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Clase de Cuenta</label>
                    <select 
                      value={formData.clase}
                      onChange={(e) => setFormData({...formData, clase: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#3B82F6] outline-none"
                    >
                      <option value="REAL">REAL (Balance)</option>
                      <option value="NOMINAL">NOMINAL (Resultados)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg font-medium transition-colors"
                >
                  {isSubmitting ? 'Guardando...' : (
                    <>
                      <Save size={18} />
                      {formData.id ? 'Actualizar Cuenta' : 'Crear Cuenta'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
