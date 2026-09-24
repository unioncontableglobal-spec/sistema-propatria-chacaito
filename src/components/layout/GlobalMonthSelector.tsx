'use client';

import { useAppStore } from '@/store/useAppStore';
import { MESES_LISTA } from '@/lib/mesUtils';

export default function GlobalMonthSelector() {
  const { filtroMesGlobal, setFiltroMesGlobal } = useAppStore();

  return (
    <div className="flex flex-col mb-6 bg-white/5 p-3 rounded-lg border border-white/10">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">
        📅 Filtro Analítico Global
      </label>
      <select 
        className="w-full bg-[#0F172A] border border-gray-700 rounded text-sm font-semibold text-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
        value={filtroMesGlobal}
        onChange={(e) => setFiltroMesGlobal(e.target.value)}
      >
        <option value="HISTÓRICO TOTAL">📊 HISTÓRICO GENERAL (Ene-Mar 2026)</option>
        {MESES_LISTA.map(m => (
          <option key={m} value={m}>{m} 2026</option>
        ))}
      </select>
      {filtroMesGlobal !== 'HISTÓRICO TOTAL' && (
        <p className="text-[10px] text-blue-400 mt-1.5 px-1 font-medium">
          Mostrando datos de: <span className="text-white font-bold">{filtroMesGlobal} 2026</span>
        </p>
      )}
    </div>
  );
}
