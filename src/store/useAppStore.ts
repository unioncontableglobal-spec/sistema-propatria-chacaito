import { create } from 'zustand';

export type RawIngreso = { mes: string; clasificacion: string; montoBs: number };
export type RawEgreso = { mes: string; clasificacion: string; montoBs: number };
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

export type AppData = {
  ingresosRaw: RawIngreso[];
  egresosRaw: RawEgreso[];
  cxcRaw: RawCxC[];
  cxpRaw: RawCxP[];
  sociosActivosRaw: RawSocioActivo[];
  nuevosIngresosRaw: RawNuevoIngreso[];
};

interface AppState {
  data: AppData | null;
  sociosDirectorio: any[];
  terceros: Tercero[];
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

export const useAppStore = create<AppState>((set, get) => ({
  data: null,
  sociosDirectorio: [],
  terceros: [],
  transacciones: [],
  publicaciones: [],
  isLoading: true, // starts loading to block initial render
  error: null,
  filtroMesGlobal: 'HISTÓRICO TOTAL',
  userRole: null,
  setUserRole: (role) => set({ userRole: role }),
  setFiltroMesGlobal: (mes) => set({ filtroMesGlobal: mes }),

  initializeData: async () => {
    if (get().data) return; // already loaded
    
    set({ isLoading: true, error: null });
    
    try {
      const [dashRes, sociosRes, transaccionesRes, pubRes, tercerosRes] = await Promise.all([
        fetch('/api/dashboard', { cache: 'no-store' }).catch(() => null),
        fetch('/api/socios?status=TODOS', { cache: 'no-store' }).catch(() => null),
        fetch('/api/transacciones?tipo=INGRESO', { cache: 'no-store' }).catch(() => null),
        fetch('/api/publicaciones', { cache: 'no-store' }).catch(() => null),
        fetch('/api/terceros', { cache: 'no-store' }).catch(() => null)
      ]);

      const dashData = (dashRes && dashRes.ok) ? await dashRes.json().catch(() => null) : null;
      const sociosData = (sociosRes && sociosRes.ok) ? await sociosRes.json().catch(() => []) : [];
      const transaccionesData = (transaccionesRes && transaccionesRes.ok) ? await transaccionesRes.json().catch(() => []) : [];
      const pubData = (pubRes && pubRes.ok) ? await pubRes.json().catch(() => []) : [];
      const tercerosData = (tercerosRes && tercerosRes.ok) ? await tercerosRes.json().catch(() => []) : [];

      console.log("Datos cargados:", { pubDataLength: pubData.length, sociosDataLength: sociosData.length });

      set({
        data: dashData,
        sociosDirectorio: sociosData || [],
        transacciones: transaccionesData || [],
        publicaciones: pubData || [],
        terceros: tercerosData || [],
        isLoading: false
      });
    } catch (error) {
      console.error("Error crítico en initializeData:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  refreshData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [dashRes, sociosRes, transaccionesRes, pubRes, tercerosRes] = await Promise.all([
        fetch('/api/dashboard', { cache: 'no-store' }).catch(() => null),
        fetch('/api/socios?status=TODOS', { cache: 'no-store' }).catch(() => null),
        fetch('/api/transacciones?tipo=INGRESO', { cache: 'no-store' }).catch(() => null),
        fetch('/api/publicaciones', { cache: 'no-store' }).catch(() => null),
        fetch('/api/terceros', { cache: 'no-store' }).catch(() => null)
      ]);

      const dashData = (dashRes && dashRes.ok) ? await dashRes.json().catch(() => null) : null;
      const sociosData = (sociosRes && sociosRes.ok) ? await sociosRes.json().catch(() => []) : [];
      const transaccionesData = (transaccionesRes && transaccionesRes.ok) ? await transaccionesRes.json().catch(() => []) : [];
      const pubData = (pubRes && pubRes.ok) ? await pubRes.json().catch(() => []) : [];
      const tercerosData = (tercerosRes && tercerosRes.ok) ? await tercerosRes.json().catch(() => []) : [];

      set({
        data: dashData,
        sociosDirectorio: sociosData || [],
        transacciones: transaccionesData || [],
        publicaciones: pubData || [],
        terceros: tercerosData || [],
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error("Error crítico en refreshData:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  }
}));
