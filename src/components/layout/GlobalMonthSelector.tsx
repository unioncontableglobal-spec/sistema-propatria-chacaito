'use client';

import { useAppStore } from '@/store/useAppStore';

const MONTHS = [
  'HISTÓRICO TOTAL',
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE'
];

export default function GlobalMonthSelector() {
  const { filtroMesGlobal, setFiltroMesGlobal } = useAppStore();

  return (
    <div className="flex flex-col mb-6 bg-white/5 p-3 rounded-lg border border-white/10">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">
        Filtro Analítico Global
      </label>
      <select 
        className="w-full bg-[#0F172A] border border-gray-700 rounded text-sm font-semibold text-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
        value={filtroMesGlobal}
        onChange={(e) => setFiltroMesGlobal(e.target.value)}
      >
        {MONTHS.map(m => (
          <option key={m} value={m}>{m === 'HISTÓRICO TOTAL' ? 'HISTÓRICO GENERAL' : m}</option>
        ))}
      </select>
    </div>
  );
}
