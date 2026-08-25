"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X } from "lucide-react";

type Socio = {
  id: number;
  ficha: string | null;
  escalafon: string | null;
  nombre_apellido: string;
  cedula: string | null;
  f_afiliacion: string | null;
  status: string;
  detalle: string | null;
  telefono: string | null;
  correo: string | null;
  placa: string | null;
  direccion: string | null;
};

export default function SociosPage() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // Form state
  const [formData, setFormData] = useState<Partial<Socio>>({
    status: 'ACTIVO'
  });

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

  const handleOpenModal = (socio?: Socio) => {
    if (socio) {
      setFormData({
        ...socio,
        f_afiliacion: socio.f_afiliacion ? new Date(socio.f_afiliacion).toISOString().split('T')[0] : null
      });
    } else {
      setFormData({ status: 'ACTIVO' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ status: 'ACTIVO' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = formData.id ? `/api/socios/${formData.id}` : "/api/socios";
      const method = formData.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchSocios();
        handleCloseModal();
      } else {
        alert("Error al guardar socio");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este socio? Esta acción no se puede deshacer.")) {
      try {
        const res = await fetch(`/api/socios/${id}`, { method: "DELETE" });
        if (res.ok) fetchSocios();
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const filteredSocios = socios.filter(s => 
    s.nombre_apellido.toLowerCase().includes(search.toLowerCase()) || 
    (s.cedula && s.cedula.includes(search))
  );

  return (
    <>
      <header className="header">
        <div>
          <h2>Módulo de Socios</h2>
          <span style={{color: 'var(--color-text-muted)'}}>Gestión de miembros, altas y bajas.</span>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Nuevo Socio
        </button>
      </header>

      <div className="card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Search size={20} color="var(--color-text-muted)" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o cédula..." 
          style={{ border: 'none', outline: 'none', flex: 1, fontSize: '1rem' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando socios...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ficha / Esc.</th>
                <th>Nombre y Apellido</th>
                <th>Cédula</th>
                <th>Afiliación</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSocios.length > 0 ? filteredSocios.map(socio => (
                <tr key={socio.id}>
                  <td>
                    <div>{socio.ficha || '-'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{socio.escalafon || '-'}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{socio.nombre_apellido}</td>
                  <td>{socio.cedula || '-'}</td>
                  <td>{socio.f_afiliacion ? new Date(socio.f_afiliacion).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`badge ${socio.status === 'ACTIVO' ? 'badge-success' : 'badge-error'}`}>
                      {socio.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon" onClick={() => handleOpenModal(socio)} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(socio.id)} title="Eliminar" style={{ color: '#d93025' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No se encontraron socios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{formData.id ? 'Editar Socio' : 'Nuevo Socio'}</h3>
              <button className="btn-icon" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Ficha</label>
                    <input className="form-control" type="text" value={formData.ficha || ''} onChange={e => setFormData({...formData, ficha: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Escalafón</label>
                    <input className="form-control" type="text" value={formData.escalafon || ''} onChange={e => setFormData({...formData, escalafon: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nombre y Apellido *</label>
                  <input className="form-control" type="text" required value={formData.nombre_apellido || ''} onChange={e => setFormData({...formData, nombre_apellido: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Cédula</label>
                  <input className="form-control" type="text" value={formData.cedula || ''} onChange={e => setFormData({...formData, cedula: e.target.value})} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Fecha de Afiliación</label>
                    <input className="form-control" type="date" value={formData.f_afiliacion || ''} onChange={e => setFormData({...formData, f_afiliacion: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={formData.status || 'ACTIVO'} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                      <option value="FALLECIDO">FALLECIDO</option>
                      <option value="RETIRADO">RETIRADO</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input className="form-control" type="text" value={formData.telefono || ''} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico</label>
                    <input className="form-control" type="email" value={formData.correo || ''} onChange={e => setFormData({...formData, correo: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Placa de Vehículo</label>
                    <input className="form-control" type="text" value={formData.placa || ''} onChange={e => setFormData({...formData, placa: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dirección Corta</label>
                    <input className="form-control" type="text" value={formData.direccion || ''} onChange={e => setFormData({...formData, direccion: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Detalles Adicionales</label>
                  <textarea className="form-control" rows={3} value={formData.detalle || ''} onChange={e => setFormData({...formData, detalle: e.target.value})}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{formData.id ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
