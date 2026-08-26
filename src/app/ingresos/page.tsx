"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Eye } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import RegistroIngresoModal from "@/components/recibos/RegistroIngresoModal";

type Transaccion = {
  id: number;
  tipo: string;
  recibo: string | null;
  fecha: string;
  mes: string | null;
  monto_bs: number;
  monto_usd: number | null;
  clasificacion: string | null;
  detalle: string | null;
  socio: { nombre_apellido: string; cedula: string | null } | null;
};

export default function IngresosPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { transacciones, refreshData, filtroMesGlobal } = useAppStore();
  const ingresos = transacciones.filter(t => t.tipo === 'INGRESO');

  const filteredIngresos = ingresos.filter(i => {
    const matchesSearch = (i.recibo && i.recibo.toLowerCase().includes(search.toLowerCase())) ||
      (i.socio && i.socio.nombre_apellido.toLowerCase().includes(search.toLowerCase()));
      
    if (filtroMesGlobal === 'HISTÓRICO TOTAL') return matchesSearch;
    return matchesSearch && i.mes?.toUpperCase() === filtroMesGlobal;
  });

  return (
    <>
      <header className="header" style={{ marginBottom: '1.5rem', background: 'transparent', boxShadow: 'none', padding: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>Auditoría de Ingresos</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Registro y control de recibos de ingresos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Registrar Ingreso
        </button>
      </header>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 1rem' }}>
          <Search size={20} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Buscar por Nro Recibo o Socio..."
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: '1rem', background: 'transparent' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
              <th style={{ color: 'white' }}>Nro Recibo</th>
              <th style={{ color: 'white' }}>Fecha</th>
              <th style={{ color: 'white' }}>Socio Asociado</th>
              <th style={{ color: 'white' }}>Clasificación</th>
              <th style={{ color: 'white', textAlign: 'right' }}>Monto Bs.</th>
              <th style={{ color: 'white', textAlign: 'right' }}>Monto USD</th>
              <th style={{ color: 'white', textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngresos.length > 0 ? filteredIngresos.map(ingreso => (
              <tr key={ingreso.id}>
                <td style={{ fontWeight: 600 }}>{ingreso.recibo || '-'}</td>
                <td>{new Date(ingreso.fecha).toLocaleDateString()}</td>
                <td>{ingreso.socio ? ingreso.socio.nombre_apellido : 'N/A'}</td>
                <td>
                  <span className="badge badge-success">{ingreso.clasificacion || 'CUOTA'}</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>Bs {ingreso.monto_bs.toLocaleString()}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{ingreso.monto_usd ? `$${ingreso.monto_usd.toLocaleString()}` : '-'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-icon" title="Ver Detalle">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  No se encontraron ingresos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <RegistroIngresoModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={async () => {
            setIsModalOpen(false);
            await refreshData();
          }} 
        />
      )}
    </>
  );
}
