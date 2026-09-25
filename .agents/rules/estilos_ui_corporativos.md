---
description: Lineamientos visuales y de colores corporativos para el desarrollo del frontend de la aplicación.
---

# Estilos UI y Colores Corporativos

El sistema web es propiedad intelectual de **Unión Contable Global** y toda su interfaz gráfica (KPIs, Tarjetas, Menús, Dashboard) debe estar ambientada estrictamente en los colores de la marca (derivados de `logo.png`).

## Paleta de Colores Corporativa
Debes emplear primordialmente las siguientes variables CSS y sus equivalentes en Tailwind:
1. **Azul Marino Profundo (Primary):** `#0A1128` 
   - Uso: Fondos de menú lateral (Sidebar), botones principales, encabezados oscuros, y fondos de KPIs destacados.
2. **Azul Rey/Claro (Secondary):** `#2563EB` (Tailwind `blue-600`)
   - Uso: Enlaces, botones secundarios, barras de progreso de ingresos, íconos de énfasis y detalles decorativos.
3. **Amarillo (Accent):** `#FDE047` (Tailwind `yellow-300` / `yellow-400`)
   - Uso: Headers del menú, alertas, badges de advertencia, y detalles para hacer contraste contra el Azul Marino.

## Directrices de Diseño (Tarjetas y KPIs)
- **Ambientación:** Prioriza el `Azul Marino Profundo` para transmitir sobriedad, profesionalismo y confianza financiera.
- **Detalles Analíticos (Métricas y KPIs):** 
  - Para los **Ingresos (Positivos):** Utiliza siempre los tonos azules corporativos (Blue).
  - Para los **Egresos (Negativos/Gastos):** Utiliza **SIEMPRE el color Rojo** (Red) para diferenciarlos gráficamente, indicando salida de dinero de forma clara y universal.
- **Diseño Profesional:** Mantén un diseño limpio (minimalista), evitando la saturación de recuadros. Usa sombras suaves (`shadow-sm`, `shadow-md`) y bordes muy sutiles (`border-gray-200`) para separar componentes sobre fondos claros (`#F8FAFC`).
