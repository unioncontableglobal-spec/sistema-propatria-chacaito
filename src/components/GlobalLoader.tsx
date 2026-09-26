"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

// GlobalLoader ya NO bloquea la app — deja que cada página cargue sus datos.
// Solo lanza la carga de datos en background para "precalentar" el store.
export default function GlobalLoader({ children }: { children: React.ReactNode }) {
  const { initializeData } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Inicia la carga de datos en background sin bloquear el render
    initializeData();
  }, [initializeData]);

  // Render children immediately — no blocking spinner
  if (!mounted) {
    // Evitar hydration mismatch — render mínimo en servidor
    return <>{children}</>;
  }

  return <>{children}</>;
}
