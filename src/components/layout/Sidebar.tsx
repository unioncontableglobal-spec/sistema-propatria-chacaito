'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart2, 
  Users, 
  FolderOpen, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  ClipboardCheck, 
  ArrowRightLeft, 
  Book, 
  BookOpen, 
  Scale,
  Receipt,
  PieChart,
  Lock,
  Calculator,
  ClipboardList,
  Inbox,
  LogOut
} from "lucide-react";
import GlobalMonthSelector from "@/components/layout/GlobalMonthSelector";
import { useAppStore } from '@/store/useAppStore';

export default function Sidebar({ initialRole }: { initialRole: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, setUserRole } = useAppStore();

  // Inicializar rol si no estaba en Zustand
  React.useEffect(() => {
    if (initialRole && !userRole) {
      setUserRole(initialRole);
    }
  }, [initialRole, userRole, setUserRole]);

  const activeRole = userRole || initialRole;

  if (pathname === '/login') {
    return null;
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUserRole(null);
    router.push('/login');
    router.refresh(); // Refrescar para que el middleware tome la nueva cookie
  };

  return (
    <aside className="sidebar flex flex-col justify-between h-screen sticky top-0 bg-[#0F172A] text-white overflow-hidden w-[280px] shrink-0 border-r border-[#1E293B]">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 pb-4 border-b border-[#1E293B]">
          <h1 className="text-[14px] font-extrabold text-blue-400 tracking-wider">ASOC. CIVIL PROPATRIA CHACAITO</h1>
          <p className="text-[10px] text-gray-400 font-bold mt-1">RIF: J-00188684-2</p>
          <p className="text-[10px] text-gray-500 font-semibold tracking-widest mt-3 border-t border-[#1E293B] pt-2">DESARROLLADO POR:</p>
          <p className="text-[10px] text-gray-300 font-bold tracking-widest">UNIÓN CONTABLE GLOBAL</p>
          <p className="text-[10px] text-gray-400 font-bold">RIF: J-50714716-9</p>
        </div>
        
        <div className="px-5 mt-4 mb-2">
          <GlobalMonthSelector />
        </div>

        <nav className="p-4 space-y-6">
          {activeRole !== 'ASISTENTE' && (
            <div className="space-y-1">
              <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'}`}>
                <BarChart2 size={18} /> Balance General
              </Link>
            </div>
          )}

          {activeRole !== 'ASISTENTE' && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-gray-500 tracking-widest px-3 mb-2 uppercase">MÓDULO DE PUBLICACIONES</div>
              <ul className="space-y-1">
                <li><Link href="/publicaciones" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/publicaciones') ? 'bg-[#1E293B] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'}`}><ClipboardCheck size={18} /> Publicación Mensual</Link></li>
              </ul>
            </div>
          )}

          <div className="space-y-1">
            <div className="text-[10px] font-bold text-gray-500 tracking-widest px-3 mb-2 uppercase">MÓDULO DE RECIBOS</div>
            <ul className="space-y-1">
              <li><Link href="/recibos" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/recibos' ? 'bg-[#1E293B] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'}`}><Receipt size={18} /> Emisión de Recibos</Link></li>
              <li><Link href="/recibos/historial" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/recibos/historial') ? 'bg-[#1E293B] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'}`}><ClipboardList size={18} /> Historial de Recibos</Link></li>
            </ul>
          </div>

          {activeRole !== 'ASISTENTE' && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-gray-500 tracking-widest px-3 mb-2 uppercase">MÓDULO DE ASOCIADOS</div>
              <ul className="space-y-1">
                <li><Link href="/directorio" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/directorio') ? 'bg-[#1E293B] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'}`}><Users size={18} /> Directorio de Asociados</Link></li>
                <li><Link href="/movimientos-socios" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/movimientos-socios') ? 'bg-[#1E293B] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'}`}><FolderOpen size={18} /> Inscripciones y Cambios</Link></li>
                <li><Link href="/cxc" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/cxc') ? 'bg-[#1E293B] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'}`}><TrendingUp size={18} /> Cuenta por Cobrar (CxC)</Link></li>
                <li><Link href="/cxp" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/cxp') ? 'bg-[#1E293B] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'}`}><TrendingDown size={18} /> Cuenta por Pagar (CxP)</Link></li>
              </ul>
            </div>
          )}

          {activeRole !== 'ASISTENTE' && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-gray-500 tracking-widest px-3 mb-2 uppercase">MÓDULO FINANCIERO</div>
              <ul className="space-y-1">
                <li><Link href="/ingresos" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/ingresos') ? 'bg-[#1E293B] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'}`}><FileText size={18} /> Auditoría de Ingresos</Link></li>
                <li><Link href="#" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-[#1E293B]`}><ClipboardCheck size={18} /> Auditoría de Egresos</Link></li>
              </ul>
            </div>
          )}

          {activeRole === 'CONTABLE' && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-gray-500 tracking-widest px-3 mb-2 uppercase">LIBROS CONTABLES LEGALES</div>
              <ul className="space-y-1">
                <li><Link href="/contabilidad/asientos" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/contabilidad/asientos') ? 'bg-[#1E293B] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'}`}><Calculator size={18} /> Asientos Contables</Link></li>
                <li><Link href="/contabilidad/plan-cuentas" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/contabilidad/plan-cuentas') ? 'bg-[#1E293B] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'}`}><ClipboardList size={18} /> Plan de Cuentas</Link></li>
                <li><Link href="/contabilidad/libro-diario" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-[#1E293B]`}><Book size={18} /> Libro Diario</Link></li>
                <li><Link href="/contabilidad/libro-mayor" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-[#1E293B]`}><BookOpen size={18} /> Libro Mayor</Link></li>
                <li><Link href="/contabilidad/balance-comprobacion" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-[#1E293B]`}><Scale size={18} /> Balance de Comprobación</Link></li>
                <li><Link href="/contabilidad/estado-situacion" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-[#1E293B]`}><PieChart size={18} /> Edo. Situación Financiera</Link></li>
                <li><Link href="/contabilidad/estado-resultados" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-[#1E293B]`}><TrendingUp size={18} /> Estado de Resultados</Link></li>
                <li><Link href="/contabilidad/cierre" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-[#1E293B]`}><Lock size={18} /> Asientos de Cierre</Link></li>
              </ul>
            </div>
          )}

          {activeRole !== 'ASISTENTE' && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-gray-500 tracking-widest px-3 mb-2 uppercase">SISTEMA</div>
              <ul className="space-y-1">
                <li><Link href="/configuracion" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/configuracion') ? 'bg-[#1E293B] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'}`}><Inbox size={18} /> Configuración y Respaldos</Link></li>
              </ul>
            </div>
          )}

        </nav>
      </div>

      <div className="p-4 border-t border-[#1E293B]">
        <div className="px-3 py-2 text-xs text-gray-500 mb-2 font-medium">
          Conectado como: <span className="text-white font-bold">{activeRole || 'Invitado'}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-colors"
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
