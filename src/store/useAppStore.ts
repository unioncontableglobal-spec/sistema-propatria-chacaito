import { create } from 'zustand';

export type RawIngreso = { mes: string; clasificacion: string; montoBs: number; montoUsd: number; };
export type RawEgreso = { mes: string; clasificacion: string; montoBs: number; montoUsd: number; };
export type RawCxC = { mes: string; fianzas: number; ayudasBs: number; vidrios: number; montepio: number; grua: number };
export type RawCxP = { mes: string; montoUsd: number };
export type RawSocioActivo = { mes: string; tipo: string };
export type RawNuevoIngreso = { mes: string; ficha: string };

export type Tercero = {
  id: number;
  tipo: string;
  nombre: string;
  identificacion: string | null;
  telefono: string | null;
  direccion: string | null;
};

export type CategoriaMovimiento = {
  id: number;
  nombre: string;
  tipo: string;
  codigo: string;
  activo: boolean;
};

export type AppData = {
  ingresosRaw: RawIngreso[];
  egresosRaw: RawEgreso[];
  cxcRaw: RawCxC[];
  cxpRaw: RawCxP[];
  sociosActivosRaw: RawSocioActivo[];
  nuevosIngresosRaw: RawNuevoIngreso[];
  tasaReferencial: number;
  tasaPorMes: Record<string, number>;
};

interface AppState {
  data: AppData | null;
  sociosDirectorio: any[];
  terceros: Tercero[];
  categoriasMovimiento: CategoriaMovimiento[];
  transacciones: any[];
  publicaciones: any[];
  isLoading: boolean;
  error: string | null;
  filtroMesGlobal: string;
  userRole: string | null;
  setUserRole: (role: string | null) => void;
  setFiltroMesGlobal: (mes: string) => void;
  initializeData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

// ✅ REFACTORIZADO: Función interna compartida para evitar código duplicado
async function _loadAllData() {
  const [dashRes, sociosRes, transaccionesRes, pubRes, tercerosRes, catRes] = await Promise.all([
    fetch('/api/dashboard', { cache: 'no-store' }).catch(() => null),
    fetch('/api/socios?status=TODOS', { cache: 'no-store' }).catch(() => null),
    // ✅ CORRECCIÓN: cargar TODAS las transacciones, sin filtrar por tipo
    fetch('/api/transacciones', { cache: 'no-store' }).catch(() => null),
    fetch('/api/publicaciones', { cache: 'no-store' }).catch(() => null),
    fetch('/api/terceros', { cache: 'no-store' }).catch(() => null),
    fetch('/api/categorias', { cache: 'no-store' }).catch(() => null)
  ]);

  const dashData = (dashRes && dashRes.ok) ? await dashRes.json().catch(() => null) : null;
  const sociosData = (sociosRes && sociosRes.ok) ? await sociosRes.json().catch(() => []) : [];
  const transaccionesData = (transaccionesRes && transaccionesRes.ok) ? await transaccionesRes.json().catch(() => []) : [];
  const pubData = (pubRes && pubRes.ok) ? await pubRes.json().catch(() => []) : [];
  const tercerosData = (tercerosRes && tercerosRes.ok) ? await tercerosRes.json().catch(() => []) : [];
  const catData = (catRes && catRes.ok) ? await catRes.json().catch(() => []) : [];

  return { dashData, sociosData, transaccionesData, pubData, tercerosData, catData };
}

// ✅ REFACTORIZADO: Carga progresiva para no bloquear el Dashboard
export const useAppStore = create<AppState>((set, get) => ({
  data: null,
  sociosDirectorio: [],
  terceros: [],
  categoriasMovimiento: [],
  transacciones: [],
  publicaciones: [],
  isLoading: true,
  error: null,
  filtroMesGlobal: 'HISTÓRICO TOTAL',
  userRole: null,
  setUserRole: (role) => set({ userRole: role }),
  setFiltroMesGlobal: (mes) => set({ filtroMesGlobal: mes }),

  initializeData: async () => {
    if (get().data) return; // already loaded
    set({ isLoading: true, error: null });
    
    // 1. Cargar el Dashboard PRIMERO para mostrar la pantalla principal instantáneamente
    try {
      fetch('/api/dashboard')
        .then(res => res.ok ? res.json() : null)
        .then(dashData => {
          if (dashData) set({ data: dashData, isLoading: false });
        })
        .catch(err => console.error("Error loading dashboard data:", err));
        
      // 2. Cargar el resto de los datos en paralelo sin bloquear
      Promise.all([
        fetch('/api/socios?status=TODOS', { cache: 'no-store' }).then(res => res.ok ? res.json() : []),
        fetch('/api/transacciones', { cache: 'no-store' }).then(res => res.ok ? res.json() : []),
        fetch('/api/publicaciones', { cache: 'no-store' }).then(res => res.ok ? res.json() : []),
        fetch('/api/terceros', { cache: 'no-store' }).then(res => res.ok ? res.json() : []),
        fetch('/api/categorias', { cache: 'no-store' }).then(res => res.ok ? res.json() : [])
      ]).then(([sociosData, transaccionesData, pubData, tercerosData, catData]) => {
        set({
          sociosDirectorio: sociosData || [],
          transacciones: transaccionesData || [],
          publicaciones: pubData || [],
          terceros: tercerosData || [],
          categoriasMovimiento: catData || [],
        });
      }).catch(err => console.error("Error loading secondary data:", err));

    } catch (error) {
      console.error("Error crítico en initializeData:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  refreshData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Para refresh, sí esperamos todo para evitar parpadeos extraños
      const [dashRes, sociosRes, transRes, pubRes, tercerosRes, catRes] = await Promise.all([
        fetch('/api/dashboard', { cache: 'no-store' }),
        fetch('/api/socios?status=TODOS', { cache: 'no-store' }),
        fetch('/api/transacciones', { cache: 'no-store' }),
        fetch('/api/publicaciones', { cache: 'no-store' }),
        fetch('/api/terceros', { cache: 'no-store' }),
        fetch('/api/categorias', { cache: 'no-store' })
      ]);

      set({
        data: dashRes.ok ? await dashRes.json() : get().data,
        sociosDirectorio: sociosRes.ok ? await sociosRes.json() : get().sociosDirectorio,
        transacciones: transRes.ok ? await transRes.json() : get().transacciones,
        publicaciones: pubRes.ok ? await pubRes.json() : get().publicaciones,
        terceros: tercerosRes.ok ? await tercerosRes.json() : get().terceros,
        categoriasMovimiento: catRes.ok ? await catRes.json() : get().categoriasMovimiento,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error("Error crítico en refreshData:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  }
}));
