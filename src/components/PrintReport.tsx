/**
 * PrintReport — Componente de reporte PDF profesional y reutilizable
 * Usado por: Ingresos, Egresos, CxC, CxP
 * 
 * Características:
 * - Membrete oficial con RIF
 * - KPIs con % de participación
 * - Tabla ordenada por CATEGORÍA → FECHA
 * - Resumen por categoría con subtotales
 * - Totales finales y pie de página
 */

import React from 'react';

export type PrintTx = {
  id: string;
  fecha: string;
  recibo?: string | null;
  clasificacion?: string | null;
  codigo_concepto?: string | null;
  monto_usd: number;
  monto_bs: number;
  tasa_cambio?: number | null;
  socio?: { ficha?: string; nombre_apellido?: string } | null;
  tercero?: { nombre?: string } | null;
  formas_pago?: { tipo_pago: string; monto_usd?: number | null; monto_bs: number }[];
};

export type PrintKpis = {
  totalUsd: number;
  totalBs: number;
  bancoUsd: number;
  efectivoUsd: number;
  /** optional extras for CxC / CxP */
  metaUsd?: number;
  remanentes?: number;
};

export type PrintReportProps = {
  titulo: string;           // "Auditoría Financiera: Ingresos"
  subtitulo?: string;       // "Módulo Financiero"
  periodo: string;          // "ENERO 2026" | "Histórico Total"
  tipo: 'INGRESO' | 'EGRESO' | 'CXC' | 'CXP';
  transacciones: PrintTx[];
  kpis: PrintKpis;
  avgTasa?: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtUsd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const fmtBs = (v: number) =>
  `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return d; }
};

const COLOR = {
  INGRESO: '#1D4ED8',
  EGRESO: '#DC2626',
  CXC: '#1D4ED8',
  CXP: '#DC2626',
};

// ── Componente principal ──────────────────────────────────────────────────────
export function PrintReport({ titulo, subtitulo, periodo, tipo, transacciones, kpis, avgTasa = 360 }: PrintReportProps) {
  const color = COLOR[tipo];
  const isEgreso = tipo === 'EGRESO' || tipo === 'CXP';

  // ── Ordenar por categoría → fecha ────────────────────────────────────────
  const sorted = [...transacciones].sort((a, b) => {
    const catA = (a.clasificacion || 'SIN CATEGORÍA').toUpperCase();
    const catB = (b.clasificacion || 'SIN CATEGORÍA').toUpperCase();
    if (catA !== catB) return catA.localeCompare(catB);
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
  });

  // ── Resumen por categoría ────────────────────────────────────────────────
  const catMap = new Map<string, { usd: number; bs: number; count: number }>();
  transacciones.forEach(tx => {
    const cat = tx.clasificacion || 'SIN CATEGORÍA';
    const prev = catMap.get(cat) || { usd: 0, bs: 0, count: 0 };
    catMap.set(cat, {
      usd:   prev.usd   + (tx.monto_usd || 0),
      bs:    prev.bs    + (tx.monto_bs  || 0),
      count: prev.count + 1,
    });
  });
  const catResumen = Array.from(catMap.entries())
    .map(([cat, v]) => ({ cat, ...v, pct: kpis.totalUsd > 0 ? (v.usd / kpis.totalUsd) * 100 : 0 }))
    .sort((a, b) => b.usd - a.usd);

  // ── Forma de pago label ──────────────────────────────────────────────────
  const formaPagoLabel = (tx: PrintTx) => {
    const fps = tx.formas_pago || [];
    if (fps.length === 0) return 'Efectivo';
    return [...new Set(fps.map(f => f.tipo_pago))].join(', ');
  };

  // ── Beneficiario / Emisor ────────────────────────────────────────────────
  const personaLabel = (tx: PrintTx) => {
    if (tx.socio?.nombre_apellido) return `${tx.socio.ficha ? `[${tx.socio.ficha}] ` : ''}${tx.socio.nombre_apellido}`;
    if (tx.tercero?.nombre) return tx.tercero.nombre;
    return 'No especificado';
  };

  // ── Margen operativo ────────────────────────────────────────────────────
  const pctBanco   = kpis.totalUsd > 0 ? (kpis.bancoUsd    / kpis.totalUsd) * 100 : 0;
  const pctEfectivo= kpis.totalUsd > 0 ? (kpis.efectivoUsd / kpis.totalUsd) * 100 : 0;
  const pctMeta    = kpis.metaUsd && kpis.metaUsd > 0 ? (kpis.totalUsd / kpis.metaUsd) * 100 : null;

  return (
    <div
      className="print-show-block text-black bg-white"
      style={{ width: '8.5in', minHeight: '11in', margin: '0 auto', padding: '0.5in 0.6in', boxSizing: 'border-box', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '9pt' }}
    >
      {/* ── MEMBRETE ───────────────────────────────────────────────────── */}
      <div style={{ borderBottom: `3px solid ${color}`, paddingBottom: '8px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '13pt', fontWeight: 900, color: '#0A1128', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              A.C. Propatria Carmelitas Chacaíto
            </div>
            <div style={{ fontSize: '8pt', color: '#555', fontWeight: 700, marginTop: '2px' }}>RIF: J-00188684-2</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8pt', color: '#888', fontWeight: 600 }}>Desarrollado por</div>
            <div style={{ fontSize: '9pt', fontWeight: 900, color: '#0A1128' }}>UNIÓN CONTABLE GLOBAL</div>
            <div style={{ fontSize: '7pt', color: '#888' }}>RIF: J-50714716-9</div>
          </div>
        </div>
      </div>

      {/* ── TÍTULO DEL REPORTE ─────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '14pt', fontWeight: 900, color: color, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {titulo}
        </div>
        {subtitulo && <div style={{ fontSize: '9pt', color: '#555', marginTop: '2px' }}>{subtitulo}</div>}
        <div style={{ fontSize: '10pt', fontWeight: 700, color: '#0A1128', marginTop: '4px' }}>
          Período: {periodo}
        </div>
        <div style={{ fontSize: '7pt', color: '#888', marginTop: '2px' }}>
          Generado el {new Date().toLocaleString('es-VE')} · {transacciones.length} transacciones
        </div>
      </div>

      {/* ── KPIs RESUMEN ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {/* Total */}
        <div style={{ border: `2px solid ${color}`, borderRadius: '6px', padding: '8px 10px', background: '#f9fafb' }}>
          <div style={{ fontSize: '7pt', fontWeight: 800, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
            {isEgreso ? 'Total Egresado' : 'Total Recaudado'}
          </div>
          <div style={{ fontSize: '13pt', fontWeight: 900, color: color }}>{fmtUsd(kpis.totalUsd)}</div>
          <div style={{ fontSize: '7pt', color: '#888', marginTop: '2px' }}>{fmtBs(kpis.totalBs)}</div>
        </div>

        {/* Banco */}
        <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '6px', padding: '8px 10px', background: '#f9fafb' }}>
          <div style={{ fontSize: '7pt', fontWeight: 800, color: '#666', textTransform: 'uppercase', marginBottom: '2px' }}>Vía Banco / Transferencia</div>
          <div style={{ fontSize: '12pt', fontWeight: 900, color: '#1D4ED8' }}>{fmtUsd(kpis.bancoUsd)}</div>
          <div style={{ fontSize: '7pt', color: '#888', marginTop: '2px' }}>{fmtPct(pctBanco)} del total</div>
        </div>

        {/* Efectivo */}
        <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '6px', padding: '8px 10px', background: '#f9fafb' }}>
          <div style={{ fontSize: '7pt', fontWeight: 800, color: '#666', textTransform: 'uppercase', marginBottom: '2px' }}>Vía Efectivo</div>
          <div style={{ fontSize: '12pt', fontWeight: 900, color: '#059669' }}>{fmtUsd(kpis.efectivoUsd)}</div>
          <div style={{ fontSize: '7pt', color: '#888', marginTop: '2px' }}>{fmtPct(pctEfectivo)} del total</div>
        </div>

        {/* Meta / Tasa */}
        <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '6px', padding: '8px 10px', background: '#f9fafb' }}>
          {pctMeta !== null ? (
            <>
              <div style={{ fontSize: '7pt', fontWeight: 800, color: '#666', textTransform: 'uppercase', marginBottom: '2px' }}>
                {isEgreso ? '% Ejecutado vs Meta' : '% Cobrado vs Meta'}
              </div>
              <div style={{ fontSize: '12pt', fontWeight: 900, color: pctMeta >= 100 ? '#059669' : '#D97706' }}>
                {fmtPct(pctMeta)}
              </div>
              <div style={{ fontSize: '7pt', color: '#888', marginTop: '2px' }}>Meta: {fmtUsd(kpis.metaUsd!)}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '7pt', fontWeight: 800, color: '#666', textTransform: 'uppercase', marginBottom: '2px' }}>Tasa Cambio Promedio</div>
              <div style={{ fontSize: '12pt', fontWeight: 900, color: '#0A1128' }}>Bs. {avgTasa.toFixed(2)}</div>
              <div style={{ fontSize: '7pt', color: '#888', marginTop: '2px' }}>Usada en conversión</div>
            </>
          )}
        </div>
      </div>

      {/* ── RESUMEN POR CATEGORÍA ───────────────────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '9pt', fontWeight: 900, color: '#0A1128', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `2px solid ${color}`, paddingBottom: '4px', marginBottom: '6px' }}>
          Resumen por Categoría
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 800, color: '#374151' }}>Categoría</th>
              <th style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 800, color: '#374151' }}>Transac.</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 800, color: '#374151' }}>Total USD</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 800, color: '#374151' }}>Total Bs.</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 800, color: '#374151' }}>% del Total</th>
              <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 800, color: '#374151' }}>Barra</th>
            </tr>
          </thead>
          <tbody>
            {catResumen.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '4px 6px', fontWeight: 700, color: '#111' }}>{c.cat}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#555' }}>{c.count}</td>
                <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 800, color: color }}>{fmtUsd(c.usd)}</td>
                <td style={{ padding: '4px 6px', textAlign: 'right', color: '#555' }}>{fmtBs(c.bs)}</td>
                <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: '#0A1128' }}>{fmtPct(c.pct)}</td>
                <td style={{ padding: '4px 6px' }}>
                  <div style={{ width: '80px', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(c.pct, 100)}%`, height: '100%', background: color, borderRadius: '3px' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── DETALLE TRANSACCIONES (ordenado por cat → fecha) ───────────── */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '9pt', fontWeight: 900, color: '#0A1128', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `2px solid ${color}`, paddingBottom: '4px', marginBottom: '6px' }}>
          Detalle de Transacciones — Ordenado por Categoría y Fecha
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
          <thead>
            <tr style={{ background: '#0A1128', color: 'white' }}>
              <th style={{ padding: '4px 5px', textAlign: 'left', fontWeight: 800 }}>Categoría</th>
              <th style={{ padding: '4px 5px', textAlign: 'left', fontWeight: 800 }}>Fecha</th>
              <th style={{ padding: '4px 5px', textAlign: 'left', fontWeight: 800 }}>Recibo</th>
              <th style={{ padding: '4px 5px', textAlign: 'left', fontWeight: 800 }}>Emisor / Beneficiario</th>
              <th style={{ padding: '4px 5px', textAlign: 'left', fontWeight: 800 }}>Concepto</th>
              <th style={{ padding: '4px 5px', textAlign: 'center', fontWeight: 800 }}>F. Pago</th>
              <th style={{ padding: '4px 5px', textAlign: 'right', fontWeight: 800 }}>USD</th>
              <th style={{ padding: '4px 5px', textAlign: 'right', fontWeight: 800 }}>Bs.</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx, i) => {
              const cat = tx.clasificacion || 'SIN CATEGORÍA';
              const prevCat = i > 0 ? (sorted[i - 1].clasificacion || 'SIN CATEGORÍA') : null;
              const isNewCat = cat !== prevCat;
              const catTotal = catMap.get(cat)!;

              return (
                <React.Fragment key={tx.id}>
                  {isNewCat && (
                    <tr style={{ background: '#EFF6FF', borderTop: '2px solid #BFDBFE' }}>
                      <td colSpan={6} style={{ padding: '3px 5px', fontWeight: 900, color: color, fontSize: '8pt', textTransform: 'uppercase' }}>
                        {cat} · {catMap.get(cat)!.count} registros
                      </td>
                      <td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: 900, color: color, fontSize: '8pt' }}>{fmtUsd(catTotal.usd)}</td>
                      <td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: 700, color: '#555', fontSize: '7pt' }}>{fmtBs(catTotal.bs)}</td>
                    </tr>
                  )}
                  <tr style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '3px 5px', color: '#888', fontStyle: 'italic' }}>└</td>
                    <td style={{ padding: '3px 5px', color: '#555' }}>{fmtDate(tx.fecha)}</td>
                    <td style={{ padding: '3px 5px', fontFamily: 'monospace', fontWeight: 700, color: '#0A1128' }}>{tx.recibo || '—'}</td>
                    <td style={{ padding: '3px 5px', fontWeight: 700, color: '#111', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {personaLabel(tx)}
                    </td>
                    <td style={{ padding: '3px 5px', color: '#555' }}>{tx.codigo_concepto || tx.clasificacion || '—'}</td>
                    <td style={{ padding: '3px 5px', textAlign: 'center', color: '#555' }}>{formaPagoLabel(tx)}</td>
                    <td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: 800, color: color }}>{fmtUsd(tx.monto_usd || 0)}</td>
                    <td style={{ padding: '3px 5px', textAlign: 'right', color: '#555' }}>{fmtBs(tx.monto_bs || 0)}</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
          {/* TOTALES FINALES */}
          <tfoot>
            <tr style={{ background: '#0A1128', color: 'white', borderTop: '2px solid #0A1128' }}>
              <td colSpan={6} style={{ padding: '5px', fontWeight: 900, fontSize: '9pt', textAlign: 'right' }}>
                TOTAL GENERAL ({transacciones.length} transacciones)
              </td>
              <td style={{ padding: '5px', textAlign: 'right', fontWeight: 900, fontSize: '10pt', color: '#FDE047' }}>
                {fmtUsd(kpis.totalUsd)}
              </td>
              <td style={{ padding: '5px', textAlign: 'right', fontWeight: 700, fontSize: '8pt', color: '#ccc' }}>
                {fmtBs(kpis.totalBs)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── PIE DE PÁGINA ──────────────────────────────────────────────── */}
      <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #000', marginBottom: '4px', height: '30px' }} />
            <div style={{ fontSize: '7pt', color: '#555', fontWeight: 700 }}>Responsable Financiero</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #000', marginBottom: '4px', height: '30px' }} />
            <div style={{ fontSize: '7pt', color: '#555', fontWeight: 700 }}>Presidente / Director</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #000', marginBottom: '4px', height: '30px' }} />
            <div style={{ fontSize: '7pt', color: '#555', fontWeight: 700 }}>Sello y Revisado por</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '7pt', color: '#aaa' }}>
          Documento confidencial generado por el Sistema de Gestión Propatria Chacaíto ·
          Software desarrollado por <strong>Unión Contable Global</strong> · RIF: J-50714716-9
        </div>
      </div>
    </div>
  );
}
