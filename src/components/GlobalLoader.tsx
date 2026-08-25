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
        <div className="spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Cargando datos del sistema...</h2>
        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>Optimizando rendimiento...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
