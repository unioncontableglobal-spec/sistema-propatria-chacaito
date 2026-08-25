import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Ignorar peticiones a archivos estáticos y rutas de _next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;

  // Si no está logueado y no está en /login, enviarlo al login
  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Si está logueado e intenta ir al login, sacarlo de ahí según su rol
  if (token && pathname === '/login') {
    if (token === 'ASISTENTE') {
      return NextResponse.redirect(new URL('/recibos', req.url));
    }
    return NextResponse.redirect(new URL('/', req.url)); // MASTER al dashboard
  }

  // Rutas protegidas por Rol
  if (token === 'ASISTENTE') {
    // Si la ruta no es /recibos y no es una API general (algunas APIs quizás deba usarlas)
    // Para mayor seguridad en la UI, bloqueamos todo lo que no empiece con /recibos o /api
    if (!pathname.startsWith('/recibos') && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/recibos', req.url));
    }
  }

  // Si no es ASISTENTE y es MASTER (o token presente y no Asistente), lo dejamos pasar
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
