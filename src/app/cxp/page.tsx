'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatUsd } from '@/lib/formatters';
import { Search, FileText } from 'lucide-react';

export default function CxpPage() {
  const { publicaciones, filtroMesGlobal } = useAppStore();
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [filtroMes, setFiltroMes] = useState(filtroMesGlobal === 'HISTÓRICO TOTAL' ? '' : filtroMesGlobal);
  const [filtroCupo, setFiltroCupo] = useState('Todos');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroFormaPago, setFiltroFormaPago] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  const mesesAprobados = publicaciones
    .filter(p => p.estado === 'APROBADO')
    .map(p => p.mes);

  // Fetch de egresos
  const fetchEgresos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/recibos/historial?tipo=EGRESO`);
      const data = await res.json();
      if (data.success) {
        setTransacciones(data.data);
      }
    } catch (error) {
      console.error('Error fetching egresos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEgresos();
  }, []);

  // Filtrado Frontend
  const filteredData = useMemo(() => {
    return transacciones.filter(tx => {
      // 1. Mes
      if (filtroMes && tx.mes !== filtroMes) return false;
      
      // 2. Cupo (SA vs SB)
      if (filtroCupo !== 'Todos') {
        const ficha = tx.socio?.ficha || '';
        if (filtroCupo === 'SA' && !ficha.startsWith('SA')) return false;
        if (filtroCupo === 'SB' && !ficha.startsWith('SB')) return false;
      }

      // 3. Categoría (Ayudas, Vidrios, Montepío, Remanentes, etc.)
      if (filtroCategoria !== 'Todas') {
        if (filtroCategoria === 'Egresos CxP (Asociados)' && !['EGRESO_CXP', 'PAGO DE AYUDAS', 'PAGO VIDRIOS', 'PAGO MONTEPIO'].includes(tx.clasificacion)) return false;
        if (filtroCategoria === 'Otros Egresos' && ['EGRESO_CXP', 'PAGO DE AYUDAS', 'PAGO VIDRIOS', 'PAGO MONTEPIO'].includes(tx.clasificacion)) return false;
        if (filtroCategoria !== 'Egresos CxP (Asociados)' && filtroCategoria !== 'Otros Egresos' && tx.clasificacion !== filtroCategoria) return false;
      }

      // 4. Forma de Pago
      if (filtroFormaPago !== 'Todas') {
        const formas = tx.formas_pago || [];
        const tieneForma = formas.some((fp: any) => 
          (filtroFormaPago === 'Efectivo' && fp.tipo_pago.toLowerCase().includes('efectivo')) ||
          (filtroFormaPago === 'Transferencia' && (fp.tipo_pago.toLowerCase().includes('transf') || fp.tipo_pago.toLowerCase().includes('pago movil')))
        );
        if (!tieneForma && formas.length > 0) return false;
        if (formas.length === 0 && filtroFormaPago !== 'Efectivo') return false; 
      }

      // 5. Búsqueda texto
      if (busqueda) {
        const term = busqueda.toLowerCase();
        const searchStr = `${tx.recibo || ''} ${tx.socio?.ficha || ''} ${tx.socio?.nombre_apellido || ''} ${tx.tercero?.nombre || ''} ${tx.clasificacion || ''} ${tx.codigo_concepto || ''}`.toLowerCase();
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
    
    // Desglose
    let ayudas = 0;
    let vidrios = 0;
    let montepios = 0;
    let remanentes = 0; // Si hay egresos clasificados como remanentes

    filteredData.forEach(tx => {
      totalUsd += (tx.monto_usd || 0);
      totalBs += (tx.monto_bs || 0);

      // Distribuir formas de pago
      let isEfectivo = false;
      if (tx.formas_pago && tx.formas_pago.length > 0) {
        tx.formas_pago.forEach((fp: any) => {
          if (fp.tipo_pago.toLowerCase().includes('efectivo')) {
            efectivoUsd += (fp.monto_usd || 0);
            isEfectivo = true;
          } else {
            bancoUsd += (fp.monto_usd || 0);
          }
        });
      } else {
        efectivoUsd += (tx.monto_usd || 0);
      }

      // Categorías
      if (tx.clasificacion?.includes('AYUDA')) ayudas += (tx.monto_usd || 0);
      if (tx.clasificacion?.includes('VIDRIO')) vidrios += (tx.monto_usd || 0);
      if (tx.clasificacion?.includes('MONTEPIO')) montepios += (tx.monto_usd || 0);
      if (tx.clasificacion?.includes('REMANENTE')) remanentes += (tx.monto_usd || 0);
    });

    return { totalUsd, totalBs, efectivoUsd, bancoUsd, ayudas, vidrios, montepios, remanentes };
  }, [filteredData]);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#0A1128]">Auditoría CxP y Recibos</h1>
          <p className="text-sm text-gray-500 font-medium">Revisión detallada de pagos emitidos (Ayudas, Proveedores, Remanentes).</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-[#1E293B] text-white rounded text-sm font-bold shadow hover:bg-gray-800 flex gap-2 items-center">
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
            <option value="Egresos CxP (Asociados)">Solo Egresos Asociados</option>
            <option value="PAGO DE AYUDAS">Solo Ayudas</option>
            <option value="PAGO MONTEPIO">Solo Montepíos</option>
            <option value="PAGO VIDRIOS">Solo Vidrios</option>
            <option value="Otros Egresos">Otros Egresos / Proveedores</option>
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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border-l-4 border-red-500 rounded-lg p-5 shadow-sm">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Pagos Filtrados</p>
          <p className="text-3xl font-black text-[#0A1128]">{formatUsd(kpis.totalUsd)}</p>
          <p className="text-xs text-gray-400 font-medium mt-1">~ Bs. {kpis.totalBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-white border-l-4 border-orange-400 rounded-lg p-5 shadow-sm">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Egresado Vía Banco</p>
          <p className="text-2xl font-black text-orange-600">{formatUsd(kpis.bancoUsd)}</p>
          <p className="text-xs text-gray-400 font-medium mt-1">Transf. y Pago Móvil</p>
        </div>
        <div className="bg-white border-l-4 border-orange-400 rounded-lg p-5 shadow-sm">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Egresado Vía Efectivo</p>
          <p className="text-2xl font-black text-orange-600">{formatUsd(kpis.efectivoUsd)}</p>
          <p className="text-xs text-gray-400 font-medium mt-1">Divisas en físico</p>
        </div>
        <div className="bg-[#0f172a] rounded-lg p-5 shadow-sm text-white flex flex-col justify-center">
          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-2">Desglose a Socios</p>
          <div className="flex justify-between text-xs mb-1"><span>Ayudas:</span> <span className="font-bold">{formatUsd(kpis.ayudas)}</span></div>
          <div className="flex justify-between text-xs mb-1"><span>Montepíos:</span> <span className="font-bold">{formatUsd(kpis.montepios)}</span></div>
          <div className="flex justify-between text-xs"><span>Vidrios:</span> <span className="font-bold">{formatUsd(kpis.vidrios)}</span></div>
        </div>
      </div>

      {/* EXTRACONTABLE BANNER */}
      {kpis.remanentes > 0 && (
        <div className="mb-6 bg-[#FAF5FF] border border-[#D8B4FE] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-500">💎</span>
            <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider">Registro Extracontable: Distribución de Remanentes</span>
          </div>
          <p className="text-[11px] font-medium text-indigo-600 mb-2">Los Remanentes no constituyen cuentas por pagar (pasivos), son distribuciones de capital entregadas a los socios en el mes. Se aíslan a título informativo.</p>
          <span className="text-lg font-bold text-indigo-700">{formatUsd(kpis.remanentes)} USD Liquidados a Socios este periodo.</span>
        </div>
      )}

      {/* TABLA DE AUDITORÍA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <FileText size={18} /> Detalle de Recibos de Egreso ({filteredData.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-100 font-bold">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">N° Recibo</th>
                <th className="px-4 py-3">Destinatario / Ficha</th>
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
                  const nombre = tx.socio?.nombre_apellido || tx.tercero?.nombre || 'S/N';
                  const extra = tx.socio ? `Ficha: ${tx.socio.ficha || '-'}` : (tx.tercero ? `Tercero` : '');

                  return (
                    <tr key={tx.id} className="hover:bg-red-50/30">
                      <td className="px-4 py-3 text-gray-600">{new Date(tx.fecha).toLocaleDateString('es-VE')}</td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">{tx.recibo || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-red-900">{nombre}</div>
                        <div className="text-[10px] text-gray-500 font-medium">{extra}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-700">{tx.clasificacion || 'N/A'}</div>
                        {tx.codigo_concepto && <div className="text-[10px] text-gray-500">{tx.codigo_concepto}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {metodos}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-red-600">
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
