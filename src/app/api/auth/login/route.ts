import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    let role = null;

    // Usuarios "quemados" temporalmente
    if (username === 'master' && password === 'admin123') {
      role = 'MASTER';
    } else if (username === 'asistente' && password === 'asis123') {
      role = 'ASISTENTE';
    } else if (username === 'contable' && password === 'conta123') {
      role = 'CONTABLE';
    }

    if (!role) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Configurar la cookie de sesión
    const res = NextResponse.json({ success: true, role });
    
    // Guardamos el rol en la cookie en texto plano para este prototipo.
    // En producción usar jwt o session encriptada.
    res.cookies.set('auth_token', role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 día
    });

    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
