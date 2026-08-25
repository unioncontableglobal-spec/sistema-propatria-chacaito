"use client";
import { useState, useEffect } from "react";
import { Search, FolderOpen } from "lucide-react";
import Link from "next/link";

type Socio = {
  id: number;
  ficha: string | null;
  escalafon: string | null;
  nombre_apellido: string;
  cedula: string | null;
  status: string;
};

export default function ExpedientesPage() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSocios();
  }, []);

  const fetchSocios = async () => {
    try {
      const res = await fetch("/api/socios");
      const data = await res.json();
      if (Array.isArray(data)) setSocios(data);
    } catch (error) {
      console.error("Error fetching socios:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSocios = socios.filter(s => 
    s.nombre_apellido.toLowerCase().includes(search.toLowerCase()) || 
    (s.cedula && s.cedula.includes(search)) ||
    (s.ficha && s.ficha.includes(search))
  );

  return (
    <>
      <header className="header" style={{ marginBottom: '1.5rem', background: 'transparent', boxShadow: 'none', padding: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>Expedientes Individuales</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Periodo Fiscal: <strong>HISTÓRICO TOTAL</strong></p>
        </div>
      </header>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>GESTIÓN DE EXPEDIENTES</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 1rem' }}>
          <Search size={20} color="var(--color-text-muted)" />
          <input 
            type="text" 
            placeholder="Ingrese Código, Nombre o C.I...." 
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: '1rem', background: 'transparent' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando expedientes...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                <th style={{ color: 'white' }}>Código</th>
                <th style={{ color: 'white' }}>Tipo</th>
                <th style={{ color: 'white' }}>Nombre y Apellido</th>
                <th style={{ color: 'white' }}>C.I.</th>
                <th style={{ color: 'white', textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredSocios.length > 0 ? filteredSocios.map(socio => (
                <tr key={socio.id}>
                  <td style={{ fontWeight: 600 }}>{socio.ficha || `SA00${socio.id}`}</td>
                  <td>
                    <span style={{ border: '1px solid #cbd5e1', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {socio.escalafon || 'SA'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{socio.nombre_apellido}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: socio.status === 'ACTIVO' ? '#10B981' : '#EF4444' }}>
                      {socio.status}
                    </div>
                  </td>
                  <td>{socio.cedula || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/expedientes/${socio.id}`} className="btn btn-primary" style={{ backgroundColor: 'var(--color-primary)' }}>
                      <FolderOpen size={16} /> Abrir Expediente
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No se encontraron expedientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
