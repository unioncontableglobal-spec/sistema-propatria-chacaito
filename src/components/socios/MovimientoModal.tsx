'use client';

import { useState, useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function MovimientoModal({ isOpen, onClose, onSuccess }: Props) {
  const [tipo, setTipo] = useState('Inscripciones');
  const [prefijo, setPrefijo] = useState<'SA' | 'SB'>('SA');
  const [socioId, setSocioId] = useState('');
  
  // Datos para nuevo socio en Inscripción
  const [nuevoSocio, setNuevoSocio] = useState({
    nombre_apellido: '',
    cedula: '',
    ficha: ''
  });

  const [nuevoCupo, setNuevoCupo] = useState('');
  const [detalle, setDetalle] = useState('');

  const [socios, setSocios] = useState<any[]>([]);
  const [cupos, setCupos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Cargar socios para seleccionar
      fetch('/api/socios')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSocios(data.data);
          }
        });

      // Cargar cupos disponibles
      fetch('/api/cupos-disponibles')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCupos(data.data);
          }
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtrar socios dependiendo del tipo
  const sociosFiltrados = socios.filter(s => {
    if (tipo === 'Inscripciones') return true; // Puede ser nuevo (sin cupo) o inactivo
    if (tipo === 'Cambios') return s.status === 'ACTIVO' && s.codigo;
    if (tipo === 'Retiros') return s.status === 'ACTIVO' && s.codigo;
    return true;
  });

  const socioSeleccionado = socios.find(s => s.id.toString() === socioId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tipo === 'Inscripciones') {
      if (!nuevoSocio.nombre_apellido) return alert("Debe ingresar el nombre y apellido del nuevo socio");
    } else {
      if (!socioId) return alert("Debe seleccionar un socio");
    }
    
    if ((tipo === 'Inscripciones' || tipo === 'Cambios') && !nuevoCupo) return alert("Debe seleccionar un nuevo cupo");

    let autoDetalle = detalle;
    
    // Autogenerar detalle si está vacío para ayudar al usuario
    if (!autoDetalle) {
      if (tipo === 'Retiros') {
        autoDetalle = `Retiro de ${socioSeleccionado?.codigo}`;
      } else if (tipo === 'Cambios') {
        autoDetalle = `Era ${socioSeleccionado?.codigo} y pasa a ser ${nuevoCupo}`;
      } else if (tipo === 'Inscripciones') {
        autoDetalle = `Inscripción al cupo ${nuevoCupo}`;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/movimientos-socios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          socioId: tipo === 'Inscripciones' ? null : parseInt(socioId),
          nuevoCupo: tipo === 'Retiros' ? null : nuevoCupo,
          detalle: autoDetalle,
          nuevoSocio: tipo === 'Inscripciones' ? nuevoSocio : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setTipo('Inscripciones');
        setSocioId('');
        setNuevoCupo('');
        setDetalle('');
        setNuevoSocio({ nombre_apellido: '', cedula: '', ficha: '' });
        onSuccess();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#1E3A8A]">Registrar Movimiento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Movimiento</label>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setSocioId('');
                setNuevoCupo('');
              }}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
            >
              <option value="Inscripciones">Inscripción</option>
              <option value="Cambios">Cambio de Cupo</option>
              <option value="Retiros">Retiro</option>
            </select>
          </div>

          {tipo === 'Inscripciones' ? (
            <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre y Apellido</label>
                <input
                  type="text"
                  value={nuevoSocio.nombre_apellido}
                  onChange={e => setNuevoSocio({...nuevoSocio, nombre_apellido: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 uppercase"
                  placeholder="Ej: JUAN PEREZ"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cédula</label>
                  <input
                    type="text"
                    value={nuevoSocio.cedula}
                    onChange={e => setNuevoSocio({...nuevoSocio, cedula: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                    placeholder="Ej: V-12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ficha (Opcional)</label>
                  <input
                    type="text"
                    value={nuevoSocio.ficha}
                    onChange={e => setNuevoSocio({...nuevoSocio, ficha: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                    placeholder="Ej: SA40123"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Socio</label>
              <select
                value={socioId}
                onChange={(e) => setSocioId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                required
              >
                <option value="">-- Seleccionar Socio --</option>
                {sociosFiltrados.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.ficha ? `[${s.ficha}]` : ''} {s.nombre_apellido} {s.codigo ? `(Cupo: ${s.codigo})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(tipo === 'Inscripciones' || tipo === 'Cambios') && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prefijo de Cupo a Asignar</label>
                <div className="flex gap-4">
                  <label className={`flex-1 py-3 px-4 border rounded-lg cursor-pointer transition-all flex items-center gap-3 ${prefijo === 'SA' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="prefijo" value="SA" checked={prefijo === 'SA'} onChange={() => { setPrefijo('SA'); setNuevoCupo(''); }} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span className="font-bold text-gray-800">Cupos SA</span>
                  </label>
                  <label className={`flex-1 py-3 px-4 border rounded-lg cursor-pointer transition-all flex items-center gap-3 ${prefijo === 'SB' ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="prefijo" value="SB" checked={prefijo === 'SB'} onChange={() => { setPrefijo('SB'); setNuevoCupo(''); }} className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
                    <span className="font-bold text-gray-800">Cupos SB</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cupos Libres ({prefijo})</label>
                <select
                  value={nuevoCupo}
                  onChange={(e) => setNuevoCupo(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold text-gray-800 shadow-sm"
                  required
                >
                  <option value="">-- Seleccionar Cupo Libre --</option>
                  {cupos.filter(c => c.startsWith(prefijo)).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Detalle / Observación</label>
            <textarea
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Ej: Era SA088 y pasa a ser SB010..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              rows={3}
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">Si se deja vacío, el sistema autogenerará el detalle.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-[#0A1128] rounded-lg hover:bg-opacity-90 shadow-md">
              {loading ? 'Guardando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
