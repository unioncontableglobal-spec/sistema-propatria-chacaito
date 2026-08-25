"use client";

import { useState, useEffect, use } from "react";
import { Phone, Mail, Car, MapPin } from "lucide-react";
import Link from "next/link";

type Socio = {
  id: number;
  ficha: string | null;
  escalafon: string | null;
  nombre_apellido: string;
  cedula: string | null;
  status: string;
  telefono: string | null;
  correo: string | null;
  placa: string | null;
  direccion: string | null;
};

export default function ExpedienteIndividualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [socio, setSocio] = useState<Socio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSocio();
  }, [id]);

  const fetchSocio = async () => {
    try {
      const res = await fetch(`/api/socios/${id}`);
      const data = await res.json();
      if (data && !data.error) setSocio(data);
    } catch (error) {
      console.error("Error fetching socio:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando expediente...</div>;
  if (!socio) return <div style={{ padding: '2rem', textAlign: 'center' }}>Expediente no encontrado.</div>;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="header" style={{ marginBottom: '1.5rem', background: 'transparent', boxShadow: 'none', padding: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>Expedientes Individuales</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Periodo Fiscal: <strong>HISTÓRICO TOTAL</strong></p>
        </div>
      </header>

      {/* Member Profile Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)'
        }}>
          {getInitials(socio.nombre_apellido)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', margin: 0, textTransform: 'uppercase' }}>{socio.nombre_apellido}</h3>
            <span className={`badge ${socio.status === 'ACTIVO' ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.7rem' }}>
              {socio.status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            <span>CÓDIGO: <strong>SA00{socio.id}</strong></span>
            <span>C.I.: <strong>{socio.cedula || 'N/A'}</strong></span>
            <span>FICHA: <strong>{socio.ficha || 'N/A'}</strong></span>
            <span style={{ marginLeft: 'auto', border: '1px solid #ccc', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              TIPO: {socio.escalafon || 'SA'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} color="#EF4444" /> Teléfono: {socio.telefono || 'S/N'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} color="#3B82F6" /> Correo: {socio.correo || 'S/N'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Car size={14} color="#EF4444" /> Placa: {socio.placa || 'S/N'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} color="#EF4444" /> Dirección: {socio.direccion || 'S/N'}</div>
          </div>
        </div>
      </div>

      {/* Balances */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ border: '2px solid #10B981', textAlign: 'center', padding: '1.5rem' }}>
          <h4 style={{ color: '#10B981', fontSize: '0.9rem', marginBottom: '0.5rem' }}>DEUDA OPERATIVA DEL SOCIO (CXC)</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981', margin: 0 }}>$0,00 (A Favor)</p>
        </div>
        <div className="card" style={{ border: '2px solid var(--color-primary)', textAlign: 'center', padding: '1.5rem' }}>
          <h4 style={{ color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>DEUDA DE LA ASOC. AL SOCIO (CXP)</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)', margin: 0 }}>$0,00</p>
        </div>
      </div>

      {/* Trazabilidad Recibos */}
      <h4 style={{ color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        📂 1. Trazabilidad de Recibos Emitidos (Cobros al Socio)
      </h4>

      {/* Mock Receipt Card (Imitating physical receipt) */}
      <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '4px', padding: '1.5rem', maxWidth: '800px', margin: '0 auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #D1D5DB', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '50%', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '10px', height: '15px', backgroundColor: '#EF4444' }}></div>
                <div style={{ width: '10px', height: '15px', backgroundColor: 'var(--color-primary)' }}></div>
              </div>
              <div>
                <h5 style={{ margin: 0, color: 'var(--color-primary)', fontWeight: 'bold' }}>ASOC. CIVIL PRO-PATRIA CARMELITAS - CHACAITO</h5>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>RIF: J-001886842</p>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            <span>Fecha: 2026-01-26T04:00:00.000Z</span>
            <span>INGRESO NRO: <span style={{ color: '#000' }}>I202600275</span></span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #D1D5DB' }}>Descripcion</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #D1D5DB' }}>Cant (USD)</th>
                <th style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #D1D5DB' }}>Total (Bs)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '0.5rem', border: '1px solid #D1D5DB' }}>Prestamos ($) 80$ + 8$ de interes 06/03/2025 ()</td>
                <td style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #D1D5DB' }}>85,28</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #D1D5DB' }}>30.319,89</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', marginTop: '1rem', border: '1px solid #D1D5DB', backgroundColor: 'white' }}>
            <div style={{ padding: '0.5rem', flex: 1, borderRight: '1px solid #D1D5DB' }}>
              <span style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '0.8rem' }}>NOTA:</span>
            </div>
            <div style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#eef2ff' }}>
              <span style={{ fontWeight: 'bold' }}>Total:</span>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Bs 30.319,89</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
