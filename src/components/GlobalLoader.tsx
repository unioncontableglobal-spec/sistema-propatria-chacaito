"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function GlobalLoader({ children }: { children: React.ReactNode }) {
  const { initializeData, isLoading } = useAppStore();

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0A1128',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        color: 'white'
      }}>
        <img 
          src="/icon.png" 
          alt="Cargando..." 
          style={{
            width: '80px',
            height: '80px',
            marginBottom: '1rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} 
        />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Cargando datos del sistema...</h2>
        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>Optimizando rendimiento...</p>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
