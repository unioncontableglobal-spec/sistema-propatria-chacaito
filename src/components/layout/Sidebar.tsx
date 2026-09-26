'use client';

import React, { useState } from 'react';
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
  Book, 
  BookOpen, 
  Scale,
  Receipt,
  PieChart,
  Lock,
  Calculator,
  ClipboardList,
  Inbox,
  LogOut,
  Menu,
  X
} from "lucide-react";
import GlobalMonthSelector from "@/components/layout/GlobalMonthSelector";
import { useAppStore } from '@/store/useAppStore';

export default function Sidebar({ initialRole }: { initialRole: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, setUserRole } = useAppStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  React.useEffect(() => {
    if (initialRole && !userRole) {
      setUserRole(initialRole);
    }
  }, [initialRole, userRole, setUserRole]);

  // Cerrar menú móvil al cambiar de ruta
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const activeRole = userRole || initialRole;

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUserRole(null);
    router.push('/login');
    router.refresh();
  };

  const linkCls = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
      active ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'
    }`;

  return (
    <>
      {/* ── MOBILE: Barra superior fija ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between px-4 h-14">
        <div>
          <p className="text-[11px] font-extrabold text-blue-400 tracking-wider leading-tight">ASOC. CIVIL PROPATRIA</p>
          <p className="text-[9px] text-gray-500 font-bold">CHACAITO · J-00188684-2</p>
        </div>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-gray-300 hover:text-white"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* ── MOBILE: Overlay ── */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        flex flex-col justify-between
        fixed md:sticky top-0 left-0
        h-screen w-[270px] shrink-0
        bg-[#0F172A] text-white
        border-r border-[#1E293B]
        z-50 transition-transform duration-300 ease-in-out
        print:hidden
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          
          {/* Logo / Header */}
          <div className="p-5 pb-4 border-b border-[#1E293B] flex items-start justify-between">
            <div>
              <h1 className="text-[13px] font-extrabold text-blue-400 tracking-wider leading-tight">ASOC. CIVIL PROPATRIA CHACAITO</h1>
              <p className="text-[10px] text-gray-400 font-bold mt-1">RIF: J-00188684-2</p>
              <p className="text-[10px] text-gray-500 font-semibold tracking-widest mt-2.5 border-t border-[#1E293B] pt-2">DESARROLLADO POR:</p>
              <p className="text-[10px] text-gray-300 font-bold tracking-widest">UNIÓN CONTABLE GLOBAL</p>
              <p className="text-[10px] text-gray-400 font-bold">RIF: J-50714716-9</p>
            </div>
            <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-gray-500 hover:text-white ml-2 mt-0.5">
              <X size={18} />
            </button>
          </div>

          {/* Filtro Mes */}
          <div className="px-4 pt-4 pb-2">
            <GlobalMonthSelector />
          </div>

          {/* Navigation */}
          <nav className="px-3 pb-4 space-y-4">
            
            {activeRole !== 'ASISTENTE' && (
              <div>
                <Link href="/" className={linkCls(pathname === '/')}>
                  <BarChart2 size={17} /> Balance General
                </Link>
              </div>
            )}

            {activeRole !== 'ASISTENTE' && (
              <div>
                <p className="text-[9px] font-bold text-gray-600 tracking-widest px-3 mb-1.5 uppercase">Publicaciones</p>
                <ul className="space-y-0.5">
                  <li><Link href="/publicaciones" className={linkCls(pathname.startsWith('/publicaciones'))}><ClipboardCheck size={17} /> Publicación Mensual</Link></li>
                </ul>
              </div>
            )}

            <div>
              <p className="text-[9px] font-bold text-gray-600 tracking-widest px-3 mb-1.5 uppercase">Recibos</p>
              <ul className="space-y-0.5">
                <li><Link href="/recibos" className={linkCls(pathname === '/recibos')}><Receipt size={17} /> Emisión de Recibos</Link></li>
                <li><Link href="/recibos/historial" className={linkCls(pathname.startsWith('/recibos/historial'))}><ClipboardList size={17} /> Historial de Recibos</Link></li>
              </ul>
            </div>

            {activeRole !== 'ASISTENTE' && (
              <div>
                <p className="text-[9px] font-bold text-gray-600 tracking-widest px-3 mb-1.5 uppercase">Asociados</p>
                <ul className="space-y-0.5">
                  <li><Link href="/directorio" className={linkCls(pathname.startsWith('/directorio'))}><Users size={17} /> Directorio</Link></li>
                  <li><Link href="/movimientos-socios" className={linkCls(pathname.startsWith('/movimientos-socios'))}><FolderOpen size={17} /> Inscripciones y Cambios</Link></li>
                  <li><Link href="/cxc" className={linkCls(pathname.startsWith('/cxc'))}><TrendingUp size={17} /> CxC</Link></li>
                  <li><Link href="/cxp" className={linkCls(pathname.startsWith('/cxp'))}><TrendingDown size={17} /> CxP</Link></li>
                </ul>
              </div>
            )}

            {activeRole !== 'ASISTENTE' && (
              <div>
                <p className="text-[9px] font-bold text-gray-600 tracking-widest px-3 mb-1.5 uppercase">Financiero</p>
                <ul className="space-y-0.5">
                  <li><Link href="/ingresos" className={linkCls(pathname.startsWith('/ingresos'))}><FileText size={17} /> Auditoría Ingresos</Link></li>
                  <li><Link href="/egresos" className={linkCls(pathname.startsWith('/egresos'))}><ClipboardCheck size={17} /> Auditoría Egresos</Link></li>
                  <li><Link href="/resultados" className={linkCls(pathname.startsWith('/resultados'))}><TrendingUp size={17} /> Auditoría Resultados</Link></li>
                </ul>
              </div>
            )}

            {activeRole === 'CONTABLE' && (
              <div>
                <p className="text-[9px] font-bold text-gray-600 tracking-widest px-3 mb-1.5 uppercase">Libros Contables</p>
                <ul className="space-y-0.5">
                  <li><Link href="/contabilidad/asientos" className={linkCls(pathname.startsWith('/contabilidad/asientos'))}><Calculator size={17} /> Asientos Contables</Link></li>
                  <li><Link href="/contabilidad/plan-cuentas" className={linkCls(pathname.startsWith('/contabilidad/plan-cuentas'))}><ClipboardList size={17} /> Plan de Cuentas</Link></li>
                  <li><Link href="/contabilidad/libro-diario" className={linkCls(pathname.startsWith('/contabilidad/libro-diario'))}><Book size={17} /> Libro Diario</Link></li>
                  <li><Link href="/contabilidad/libro-mayor" className={linkCls(pathname.startsWith('/contabilidad/libro-mayor'))}><BookOpen size={17} /> Libro Mayor</Link></li>
                  <li><Link href="/contabilidad/balance-comprobacion" className={linkCls(pathname.startsWith('/contabilidad/balance-comprobacion'))}><Scale size={17} /> Balance de Comprobación</Link></li>
                  <li><Link href="/contabilidad/estado-situacion" className={linkCls(pathname.startsWith('/contabilidad/estado-situacion'))}><PieChart size={17} /> Edo. Situación Financiera</Link></li>
                  <li><Link href="/contabilidad/estado-resultados" className={linkCls(pathname.startsWith('/contabilidad/estado-resultados'))}><TrendingUp size={17} /> Estado de Resultados</Link></li>
                  <li><Link href="/contabilidad/cierre" className={linkCls(pathname.startsWith('/contabilidad/cierre'))}><Lock size={17} /> Asientos de Cierre</Link></li>
                </ul>
              </div>
            )}

            {activeRole !== 'ASISTENTE' && (
              <div>
                <p className="text-[9px] font-bold text-gray-600 tracking-widest px-3 mb-1.5 uppercase">Sistema</p>
                <ul className="space-y-0.5">
                  <li><Link href="/configuracion" className={linkCls(pathname.startsWith('/configuracion'))}><Inbox size={17} /> Configuración y Respaldos</Link></li>
                </ul>
              </div>
            )}

          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] shrink-0">
          <p className="px-1 py-1 text-[11px] text-gray-500 mb-2">
            Conectado como: <span className="text-white font-bold">{activeRole || 'Invitado'}</span>
          </p>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-colors text-sm"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
