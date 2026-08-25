'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { setUserRole } = useAppStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Guardamos en el estado global
      setUserRole(data.role);

      // Redirigir según rol
      if (data.role === 'ASISTENTE') {
        router.push('/recibos');
      } else {
        router.push('/');
      }
      
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1128] px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-[#1E293B] p-8 text-center">
          <h1 className="text-xl font-bold text-blue-400 mb-1">ASOC. CIVIL PROPATRIA CHACAITO</h1>
          <p className="text-xs text-gray-400 font-bold mb-4">RIF: J-00188684-2</p>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Acceso al Sistema</h2>
          <p className="text-gray-400 mt-2 text-sm">Control Financiero de Socios</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-6 border border-red-100 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usuario
              </label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                placeholder="Ingresa tu usuario"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full bg-[#2563EB] text-white p-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Ingresando...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Sistema Privado • A.C. Propatria Chacaito</p>
            <p className="mt-1">Desarrollado por <strong>UNIÓN CONTABLE GLOBAL</strong> (RIF: J-50714716-9)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
