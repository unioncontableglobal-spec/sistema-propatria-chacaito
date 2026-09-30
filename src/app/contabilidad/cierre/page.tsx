'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Lock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AsientosDeCierrePage() {
  const { filtroMesGlobal } = useAppStore();
  const [loading, setLoading] = useState(false);

  // NOTA: Esta es una vista previa de la Fase 2
  // La lógica real de inserción en BD se implementará en un endpoint /api/asientos/cierre

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
          <Lock size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A]">Asientos de Cierre</h1>
          <p className="text-gray-500 text-sm">Cierre de Cuentas Nominales (Ingresos y Gastos)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6 flex gap-4">
          <AlertTriangle className="text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-amber-800">Advertencia de Cierre</h3>
            <p className="text-amber-700 text-sm mt-1">
              Ejecutar los asientos de cierre pondrá en cero (0,00) todas las cuentas de Ingresos (Clase 4 y 5) y Egresos (Clase 6 y 7).
              El saldo neto resultante se transferirá a la cuenta de Patrimonio "Resultado del Ejercicio". Esta acción es irreversible.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <ShieldCheck size={48} className="text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Módulo en Construcción (Fase 2)</h2>
          <p className="text-center text-gray-500 max-w-md">
            El motor de cálculo para el cierre fiscal está siendo calibrado. 
            Próximamente podrás liquidar tus cuentas nominales con un solo clic.
          </p>
          <button 
            disabled 
            className="mt-6 bg-purple-600 text-white px-6 py-2.5 rounded-lg font-bold opacity-50 cursor-not-allowed shadow"
          >
            Ejecutar Cierre Fiscal
          </button>
        </div>
      </div>
    </div>
  );
}
