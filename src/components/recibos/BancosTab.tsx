'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatUsd } from '@/lib/formatters';
import { Search, Building, FileText } from 'lucide-react';
import { transaccionMatchesMes, codigoPubToSelector } from '@/lib/mesUtils';

interface BancosTabProps {
  tipo: 'INGRESO' | 'EGRESO' | 'AMBOS';
}

export default function BancosTab({ tipo }: BancosTabProps) {
  const { publicaciones, filtroMesGlobal, setFiltroMesGlobal } = useAppStore();
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const filtroMes = filtroMesGlobal === 'HISTÓRICO TOTAL' ? '' : filtroMesGlobal;
  const setFiltroMes = (val: string) => setFiltroMesGlobal(val || 'HISTÓRICO TOTAL');
  const [busqueda, setBusqueda] = useState('');
  const [bancoSeleccionado, setBancoSeleccionado] = useState('Todos');

  const mesesAprobados = publicaciones
    .filter(p => p.estado === 'APROBADO')
    .map(p => codigoPubToSelector(p.mes).toUpperCase());

  const fetchTransacciones = async () => {
    setIsLoading(true);
    try {
      const url = filtroMesGlobal !== 'HISTÓRICO TOTAL' 
        ? `/api/recibos/historial?mes=${filtroMesGlobal}` 
        : `/api/recibos/historial`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTransacciones(data.data);
      }
    } catch (error) {
      console.error('Error fetching transacciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransacciones();
  }, [filtroMesGlobal]);

  // Extraer todos los movimientos bancarios (Ingresos y Egresos)
  const movimientosBancarios = useMemo(() => {
    const movimientos: any[] = [];
    
    // Determinar tasa promedio para estimaciones
    let sumTasa = 0; let countTasa = 0;
    transacciones.forEach(tx => {
      const tasa = Number(tx.tasa_cambio || 0);
      if (tasa > 1) { sumTasa += tasa; countTasa++; }
    });
    const avgTasa = countTasa > 0 ? sumTasa / countTasa : 360;

    transacciones.forEach(tx => {
      // Filtrar por mes local si existe
      if (filtroMes && !transaccionMatchesMes(tx.mes, filtroMes)) return;
      // Filtrar por tipo si es necesario
      if (tipo !== 'AMBOS' && tx.tipo !== tipo) return;
      
      const esIngreso = tx.tipo === 'INGRESO';

      if (tx.formas_pago && tx.formas_pago.length > 0) {
        tx.formas_pago.forEach((fp: any) => {
          if (!fp.tipo_pago.toLowerCase().includes('efectivo')) {
            const fpTasa = Number(fp.tasa_cambio || tx.tasa_cambio || 0);
            const currentFpTasa = fpTasa > 1 ? fpTasa : avgTasa;
            const fpUsd = Number(fp.monto_usd) > 0 ? Number(fp.monto_usd) : (Number(fp.monto_bs) / currentFpTasa);
            const fpBs = Number(fp.monto_bs) > 0 ? Number(fp.monto_bs) : (fpUsd * currentFpTasa);
            
            movimientos.push({
              ...tx,
              banco: fp.banco ? fp.banco.toUpperCase() : 'NO ESPECIFICADO',
              monto_banco_usd: fpUsd,
              monto_banco_bs: fpBs,
              esIngreso
            });
          }
        });
      }
    });
    
    // Ordenar de más reciente a más antiguo
    return movimientos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [transacciones, filtroMes]);

  // Bancos únicos para filtro
  const bancosUnicos = useMemo(() => {
    const set = new Set<string>();
    movimientosBancarios.forEach(m => set.add(m.banco));
    return Array.from(set).sort();
  }, [movimientosBancarios]);

  // Filtrado final
  const dataFiltrada = useMemo(() => {
    return movimientosBancarios.filter(m => {
      if (bancoSeleccionado !== 'Todos' && m.banco !== bancoSeleccionado) return false;
      if (busqueda) {
        const term = busqueda.toLowerCase();
        const searchStr = `${m.recibo || ''} ${m.banco || ''} ${m.socio?.nombre_apellido || ''} ${m.tercero?.nombre || ''} ${m.clasificacion || ''}`.toLowerCase();
        if (!searchStr.includes(term)) return false;
      }
      return true;
    });
  }, [movimientosBancarios, bancoSeleccionado, busqueda]);

  // KPIs
  const kpis = useMemo(() => {
    let totalIngresosUsd = 0;
    let totalEgresosUsd = 0;
    let totalIngresosBs = 0;
    let totalEgresosBs = 0;
    
    const bancosMap = new Map<string, { ingresos: number, egresos: number }>();

    dataFiltrada.forEach(m => {
      const bInfo = bancosMap.get(m.banco) || { ingresos: 0, egresos: 0 };
      
      if (m.esIngreso) {
        totalIngresosUsd += m.monto_banco_usd;
        totalIngresosBs += m.monto_banco_bs;
        bInfo.ingresos += m.monto_banco_usd;
      } else {
        totalEgresosUsd += m.monto_banco_usd;
        totalEgresosBs += m.monto_banco_bs;
        bInfo.egresos += m.monto_banco_usd;
      }
      
      bancosMap.set(m.banco, bInfo);
    });

    const bancosDetalle = Array.from(bancosMap.entries())
      .map(([banco, totales]) => ({
        banco,
        ingresos: totales.ingresos,
        egresos: totales.egresos,
        balance: totales.ingresos - totales.egresos
      }))
      .sort((a, b) => b.ingresos - a.ingresos);

    return { totalIngresosUsd, totalEgresosUsd, totalIngresosBs, totalEgresosBs, balanceUsd: totalIngresosUsd - totalEgresosUsd, bancosDetalle };
  }, [dataFiltrada]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* FILTROS */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mes</label>
          <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium">
            <option value="">Histórico Total</option>
            {mesesAprobados.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Banco</label>
          <select value={bancoSeleccionado} onChange={e => setBancoSeleccionado(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium">
            <option value="Todos">Todos los bancos</option>
            {bancosUnicos.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex-[2] min-w-[200px] relative">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar Recibo / Socio</label>
          <Search className="absolute left-3 top-[26px] text-gray-400" size={16} />
          <input 
            type="text" 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)} 
            placeholder="Nro recibo, nombre, concepto..." 
            className="w-full pl-9 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-gray-50"
          />
        </div>
      </div>

      {/* KPIs PRINCIPALES */}
      <div className={`grid grid-cols-1 md:grid-cols-${tipo === 'AMBOS' ? '3' : '2'} gap-4 mb-6`}>
        {(tipo === 'INGRESO' || tipo === 'AMBOS') && (
          <div className="bg-white border-l-4 border-emerald-500 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Ingresos Bancarios (USD eq)</p>
            <p className="text-3xl font-black text-[#0A1128]">{formatUsd(kpis.totalIngresosUsd)}</p>
            <p className="text-xs font-bold text-emerald-600 mt-2">Bs. {kpis.totalIngresosBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
          </div>
        )}
        
        {(tipo === 'EGRESO' || tipo === 'AMBOS') && (
          <div className="bg-white border-l-4 border-red-500 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Egresos Bancarios (USD eq)</p>
            <p className="text-3xl font-black text-red-600">{formatUsd(kpis.totalEgresosUsd)}</p>
            <p className="text-xs font-bold text-red-400 mt-2">Bs. {kpis.totalEgresosBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
          </div>
        )}

        {tipo === 'AMBOS' && (
          <div className="bg-[#0A1128] border-l-4 border-blue-400 rounded-2xl p-5 shadow-sm text-white">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Balance Neto Bancario (USD eq)</p>
            <p className="text-3xl font-black text-white">{formatUsd(kpis.balanceUsd)}</p>
            <p className="text-xs font-medium text-gray-400 mt-2">Diferencia Ingresos - Egresos</p>
          </div>
        )}
      </div>

      {/* RESUMEN POR BANCO */}
      <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-sm font-black text-[#0A1128] uppercase tracking-wider mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Building className="text-blue-600" size={18} />
          Saldos y Movimientos por Entidad Bancaria
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.bancosDetalle.map(b => (
            <div key={b.banco} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col justify-between">
              <div>
                <p className="font-bold text-gray-800 uppercase text-sm mb-3">{b.banco}</p>
                
                {(tipo === 'INGRESO' || tipo === 'AMBOS') && (
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500 font-medium">Ingresos</span>
                    <span className="text-xs font-bold text-emerald-600">{formatUsd(b.ingresos)}</span>
                  </div>
                )}
                
                {(tipo === 'EGRESO' || tipo === 'AMBOS') && (
                  <div className={`flex justify-between items-center ${tipo === 'AMBOS' ? 'mb-3' : 'mb-1'}`}>
                    <span className="text-xs text-gray-500 font-medium">Egresos</span>
                    <span className="text-xs font-bold text-red-500">{formatUsd(b.egresos)}</span>
                  </div>
                )}
              </div>
              
              {tipo === 'AMBOS' && (
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Balance</span>
                  <span className={`text-sm font-black ${b.balance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{formatUsd(b.balance)}</span>
                </div>
              )}
            </div>
          ))}
          {kpis.bancosDetalle.length === 0 && (
            <div className="col-span-full py-6 text-center text-gray-400 text-sm">No se encontraron movimientos bancarios.</div>
          )}
        </div>
      </div>

      {/* TABLA DE DETALLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <FileText size={18} /> Historial de Transacciones Bancarias ({dataFiltrada.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-100 font-bold">
              <tr>
                <th className="px-4 py-3">N° Recibo / Ref</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Entidad Bancaria</th>
                <th className="px-4 py-3">Sujeto / Razón</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Monto USD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Cargando movimientos...</td></tr>
              ) : dataFiltrada.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No hay movimientos que coincidan con los filtros.</td></tr>
              ) : (
                dataFiltrada.map((m, idx) => {
                  const nombre = m.socio?.nombre_apellido || m.tercero?.nombre || 'S/N';
                  
                  return (
                    <tr key={`${m.id}-${idx}`} className="hover:bg-blue-50/30">
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">{m.recibo || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(m.fecha).toLocaleDateString('es-VE')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs">
                          {m.banco}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-800">{nombre}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{m.clasificacion}</div>
                      </td>
                      <td className="px-4 py-3">
                        {m.esIngreso ? (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Ingreso</span>
                        ) : (
                          <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase">Egreso</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-black ${m.esIngreso ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m.esIngreso ? '+' : '-'}{formatUsd(m.monto_banco_usd)}
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
