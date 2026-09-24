'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatUsd } from '@/lib/formatters';
import { Search, FileText } from 'lucide-react';
import { transaccionMatchesMes, labelFiltro } from '@/lib/mesUtils';

export default function CxcPage() {
  const { publicaciones, filtroMesGlobal } = useAppStore();
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [filtroMes, setFiltroMes] = useState(filtroMesGlobal === 'HISTÓRICO TOTAL' ? '' : filtroMesGlobal);
  const [filtroCupo, setFiltroCupo] = useState('Todos');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroFormaPago, setFiltroFormaPago] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  // ✅ Sincronizar filtro local cuando cambia el selector global
  useEffect(() => {
    setFiltroMes(filtroMesGlobal === 'HISTÓRICO TOTAL' ? '' : filtroMesGlobal);
  }, [filtroMesGlobal]);

  const mesesAprobados = publicaciones
    .filter(p => p.estado === 'APROBADO')
    .map(p => p.mes);

  // Fetch de ingresos
  const fetchIngresos = async () => {
    setIsLoading(true);
    try {
      // Pedimos todos los ingresos. Podemos optimizar con parámetros de búsqueda si es muy pesado.
      const res = await fetch(`/api/recibos/historial?tipo=INGRESO`);
      const data = await res.json();
      if (data.success) {
        setTransacciones(data.data);
      }
    } catch (error) {
      console.error('Error fetching ingresos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIngresos();
  }, []);

  // Filtrado Frontend
  const filteredData = useMemo(() => {
    return transacciones.filter(tx => {
      // 1. Mes - usar transaccionMatchesMes para comparación consistente
      if (filtroMes && !transaccionMatchesMes(tx.mes, filtroMes)) return false;
      
      // 2. Cupo (SA vs SB)
      if (filtroCupo !== 'Todos') {
        const ficha = tx.socio?.ficha || '';
        if (filtroCupo === 'SA' && !ficha.startsWith('SA')) return false;
        if (filtroCupo === 'SB' && !ficha.startsWith('SB')) return false;
      }

      // 3. Categoría
      if (filtroCategoria !== 'Todas') {
        if (filtroCategoria === 'Recibos de Publicaciones' && !['INGRESO_CXP', 'FINANZAS', 'VIDRIO', 'MONTEPIOS', 'GRUA', 'CxC 2025'].includes(tx.clasificacion)) return false;
        if (filtroCategoria === 'Otros Ingresos' && ['INGRESO_CXP', 'FINANZAS', 'VIDRIO', 'MONTEPIOS', 'GRUA', 'CxC 2025'].includes(tx.clasificacion)) return false;
        if (filtroCategoria !== 'Recibos de Publicaciones' && filtroCategoria !== 'Otros Ingresos' && tx.clasificacion !== filtroCategoria) return false;
      }

      // 4. Forma de Pago
      if (filtroFormaPago !== 'Todas') {
        const formas = tx.formas_pago || [];
        const tieneForma = formas.some((fp: any) => 
          (filtroFormaPago === 'Efectivo' && fp.tipo_pago.toLowerCase().includes('efectivo')) ||
          (filtroFormaPago === 'Transferencia' && (fp.tipo_pago.toLowerCase().includes('transf') || fp.tipo_pago.toLowerCase().includes('pago movil')))
        );
        if (!tieneForma && formas.length > 0) return false;
        if (formas.length === 0 && filtroFormaPago !== 'Efectivo') return false; // Asumimos efectivo si no hay forma de pago
      }

      // 5. Búsqueda texto
      if (busqueda) {
        const term = busqueda.toLowerCase();
        const searchStr = `${tx.recibo || ''} ${tx.socio?.ficha || ''} ${tx.socio?.nombre_apellido || ''} ${tx.clasificacion || ''} ${tx.codigo_concepto || ''}`.toLowerCase();
        if (!searchStr.includes(term)) return false;
      }

      return true;
    });
  }, [transacciones, filtroMes, filtroCupo, filtroCategoria, filtroFormaPago, busqueda]);

  // KPIs
  const kpis = useMemo(() => {
    let totalUsd = 0;
    let totalBs = 0;
    let efectivoUsd = 0;
    let bancoUsd = 0;
    
    // Desglose por categorías principales (publicaciones)
    let finanzas = 0;
    let montepios = 0;
    let vidrios = 0;

    // Desglose profundo
    let dolaresRealesUsd = 0;
    let efecto1UsdBs = 0; // Se quedó en bolívares puros
    let bancosMap = new Map<string, number>();

    // Determinar la tasa promedio mensual (simplificada, de los que sí convirtieron)
    let sumTasa = 0; let countTasa = 0;
    filteredData.forEach(tx => {
      const usd = Number(tx.monto_usd || 0);
      const bs = Number(tx.monto_bs || 0);
      const tasa = Number(tx.tasa_cambio || 0);
      if (!(usd === 1 && Math.abs(tasa - bs) < 1) && tasa > 1) {
        sumTasa += tasa; countTasa++;
      }
    });
    const avgTasa = countTasa > 0 ? sumTasa / countTasa : 360;

    filteredData.forEach(tx => {
      const usd = Number(tx.monto_usd || 0);
      const bs = Number(tx.monto_bs || 0);
      const tasa = Number(tx.tasa_cambio || 0);

      // Auditar Efecto 1 USD vs Dólares Reales
      let realUsd = usd;
      if ((usd === 1 && Math.abs(tasa - bs) < 1) || usd === 0) {
        efecto1UsdBs += bs;
        realUsd = bs / avgTasa;
      } else {
        dolaresRealesUsd += realUsd;
      }

      totalUsd += realUsd;
      totalBs += bs;

      // Distribuir formas de pago
      let isEfectivo = false;
      if (tx.formas_pago && tx.formas_pago.length > 0) {
        tx.formas_pago.forEach((fp: any) => {
          const fpUsd = fp.monto_usd || (fp.monto_bs / avgTasa);
          if (fp.tipo_pago.toLowerCase().includes('efectivo')) {
            efectivoUsd += fpUsd;
            isEfectivo = true;
          } else {
            bancoUsd += fpUsd;
            if (fp.banco) {
              const bName = fp.banco.toUpperCase();
              bancosMap.set(bName, (bancosMap.get(bName) || 0) + fpUsd);
            }
          }
        });
      } else {
        // Fallback si no tiene desglose
        efectivoUsd += realUsd;
      }

      // Categorías
      if (tx.clasificacion === 'FINANZAS') finanzas += realUsd;
      if (tx.clasificacion === 'MONTEPIOS') montepios += realUsd;
      if (tx.clasificacion === 'VIDRIO') vidrios += realUsd;
    });

    // Ordenar bancos de mayor a menor
    const topBancos = Array.from(bancosMap.entries())
      .map(([banco, monto]) => ({ banco, monto }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5);

    return { 
      totalUsd, totalBs, efectivoUsd, bancoUsd, finanzas, montepios, vidrios,
      dolaresRealesUsd, efecto1UsdBs, efecto1UsdConvertido: efecto1UsdBs / avgTasa, topBancos 
    };
  }, [filteredData]);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#0A1128]">Auditoría CxC y Recibos</h1>
          <p className="text-sm text-gray-500 font-medium">Revisión detallada de ingresos por concepto, socio y forma de pago.</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-[#0A1128] text-white rounded text-sm font-bold shadow hover:bg-gray-800 flex gap-2 items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Imprimir Reporte
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mes</label>
          <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50">
            <option value="">Histórico Total</option>
            {mesesAprobados.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cupo</label>
          <select value={filtroCupo} onChange={e => setFiltroCupo(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50">
            <option value="Todos">Todos (SA y SB)</option>
            <option value="SA">Solo Socios SA</option>
            <option value="SB">Solo Socios SB</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50">
            <option value="Todas">Todas</option>
            <option value="Recibos de Publicaciones">Conceptos de Publicación</option>
            <option value="FINANZAS">Solo Finanzas</option>
            <option value="MONTEPIOS">Solo Montepíos</option>
            <option value="VIDRIO">Solo Vidrios</option>
            <option value="Otros Ingresos">Otros Ingresos (No Publicación)</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Forma de Pago</label>
          <select value={filtroFormaPago} onChange={e => setFiltroFormaPago(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50">
            <option value="Todas">Todas</option>
            <option value="Transferencia">Transferencia / Pago Móvil</option>
            <option value="Efectivo">Efectivo</option>
          </select>
        </div>
        <div className="flex-[2] min-w-[200px] relative">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar Recibo / Socio</label>
          <Search className="absolute left-3 top-[26px] text-gray-400" size={16} />
          <input 
            type="text" 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)} 
            placeholder="Nro recibo, nombre, ficha..." 
            className="w-full pl-9 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* KPIs DE AUDITORIA PROFUNDA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border-l-4 border-blue-600 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Recaudación (USD Real)</p>
          <p className="text-3xl font-black text-[#0A1128]">{formatUsd(kpis.totalUsd)}</p>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-400">Total Bs. Histórico:</span>
            <span className="text-xs font-bold text-slate-700">Bs. {kpis.totalBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        <div className="bg-white border-l-4 border-emerald-500 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Ingresos Vía Banco</p>
            <p className="text-2xl font-black text-emerald-600">{formatUsd(kpis.bancoUsd)}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 w-full">
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${kpis.totalUsd > 0 ? (kpis.bancoUsd / kpis.totalUsd) * 100 : 0}%` }}></div>
            </div>
            <p className="text-[10px] text-gray-400 font-bold text-right">{kpis.totalUsd > 0 ? ((kpis.bancoUsd / kpis.totalUsd) * 100).toFixed(1) : 0}% del total</p>
          </div>
        </div>

        <div className="bg-white border-l-4 border-amber-500 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Ingresos Vía Efectivo</p>
            <p className="text-2xl font-black text-amber-600">{formatUsd(kpis.efectivoUsd)}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 w-full">
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${kpis.totalUsd > 0 ? (kpis.efectivoUsd / kpis.totalUsd) * 100 : 0}%` }}></div>
            </div>
            <p className="text-[10px] text-gray-400 font-bold text-right">{kpis.totalUsd > 0 ? ((kpis.efectivoUsd / kpis.totalUsd) * 100).toFixed(1) : 0}% del total</p>
          </div>
        </div>

        <div className="bg-[#0A1128] rounded-2xl p-5 shadow-sm text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          </div>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2 relative z-10">Desglose CxC</p>
          <div className="flex justify-between text-xs mb-1.5 relative z-10"><span>Finanzas:</span> <span className="font-bold text-blue-100">{formatUsd(kpis.finanzas)}</span></div>
          <div className="flex justify-between text-xs mb-1.5 relative z-10"><span>Montepíos:</span> <span className="font-bold text-blue-100">{formatUsd(kpis.montepios)}</span></div>
          <div className="flex justify-between text-xs relative z-10"><span>Vidrios:</span> <span className="font-bold text-blue-100">{formatUsd(kpis.vidrios)}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* COMPOSICIÓN DE EFECTO 1 USD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-black text-[#0A1128] uppercase tracking-wider mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
            <svg className="text-indigo-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Auditoría de Conversión (Divisas vs Bs Puros)
          </h3>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-500 mb-1">Divisas Reales (Convertidas/Cargadas)</p>
              <p className="text-xl font-black text-indigo-700">{formatUsd(kpis.dolaresRealesUsd)}</p>
              <p className="text-[10px] font-semibold text-gray-400 mt-1">{kpis.totalUsd > 0 ? ((kpis.dolaresRealesUsd / kpis.totalUsd) * 100).toFixed(1) : 0}% de los ingresos</p>
            </div>
            <div className="w-px h-12 bg-gray-200"></div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-500 mb-1">Efecto 1 USD (Se quedó en Bs)</p>
              <p className="text-xl font-black text-rose-600">{formatUsd(kpis.efecto1UsdConvertido)} <span className="text-xs font-medium text-rose-400 font-normal">eq. USD</span></p>
              <p className="text-[10px] font-semibold text-gray-400 mt-1">Bs. {kpis.efecto1UsdBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-4 flex overflow-hidden">
            <div className="bg-indigo-500 h-2" style={{ width: `${kpis.totalUsd > 0 ? (kpis.dolaresRealesUsd / kpis.totalUsd) * 100 : 0}%` }}></div>
            <div className="bg-rose-500 h-2" style={{ width: `${kpis.totalUsd > 0 ? (kpis.efecto1UsdConvertido / kpis.totalUsd) * 100 : 0}%` }}></div>
          </div>
        </div>

        {/* COMPOSICIÓN BANCARIA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-black text-[#0A1128] uppercase tracking-wider mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
            <svg className="text-teal-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            Bancos Receptores Top 5
          </h3>
          {kpis.topBancos.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No hay registros bancarios en este filtro.</p>
          ) : (
            <div className="space-y-3">
              {kpis.topBancos.map((b, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                    <span className="text-xs font-bold text-gray-700">{b.banco}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-teal-700">{formatUsd(b.monto)}</span>
                    <span className="text-[10px] font-bold text-gray-400 w-8 text-right">{kpis.bancoUsd > 0 ? ((b.monto / kpis.bancoUsd) * 100).toFixed(0) : 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TABLA DE AUDITORÍA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <FileText size={18} /> Detalle de Recibos de Ingreso ({filteredData.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-100 font-bold">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">N° Recibo</th>
                <th className="px-4 py-3">Socio / Ficha</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Pagado Vía</th>
                <th className="px-4 py-3 text-right">Monto USD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Cargando datos...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No hay recibos que coincidan con los filtros.</td></tr>
              ) : (
                filteredData.map(tx => {
                  const formas = tx.formas_pago || [];
                  const metodos = formas.length > 0 ? formas.map((f: any) => f.tipo_pago).join(', ') : 'Efectivo';
                  return (
                    <tr key={tx.id} className="hover:bg-blue-50/30">
                      <td className="px-4 py-3 text-gray-600">{new Date(tx.fecha).toLocaleDateString('es-VE')}</td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">{tx.recibo || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-blue-900">{tx.socio?.nombre_apellido || 'S/N'}</div>
                        <div className="text-[10px] text-gray-500 font-medium">Ficha: {tx.socio?.ficha || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-700">{tx.clasificacion || 'N/A'}</div>
                        {tx.codigo_concepto && <div className="text-[10px] text-gray-500">{tx.codigo_concepto}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {metodos}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600">
                        {formatUsd(tx.monto_usd || 0)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
