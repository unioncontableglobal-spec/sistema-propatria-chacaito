---
description: Bases de conocimiento fundamentales del sistema Propatria Chacaito (Arquitectura, Reglas de Negocio, UX y Contabilidad).
---

# Pilares del Sistema - A.C. Propatria Chacaito

## 1. Identidad y Branding
- **Cliente:** A.C. Propatria Chacaito (RIF: J-00188684-2).
- **Desarrollador:** Unión Contable Global (RIF: J-50714716-9).
- **Diseño Visual:** Estética Premium. Egresos en rojo, Ingresos en azul/emerald. Todo PDF o reporte generado DEBE incluir membretes con ambos RIFs y verse extremadamente profesional y minimalista.

## 2. Stack Tecnológico y Entornos
- **Framework:** Next.js (App Router), TailwindCSS, TypeScript.
- **Base de Datos:** SQLite alojada remotamente en **Turso** (`@libsql/client`).
- **Peculiaridad de Datos (IMPORTANTE):** Las fechas en SQLite/Turso están guardadas como strings ISO. Las consultas en Prisma que usen `gte`/`lte` con objetos `Date` fallarán silenciosamente. **Regla de oro:** Traer datos y filtrar en memoria, o usar strings consistentes para comparar fechas.
- **Producción:** Todo despliegue es en Vercel. NUNCA dar enlaces a `localhost`.

## 3. UX y Gestión de Estado (Zustand)
- **Cero Islas:** El sistema es un único organismo. 
- **Calendario Global:** El Filtro Analítico Global ubicado en el Sidebar (gestionado mediante `useAppStore` -> `filtroMesGlobal`) es el dictador del tiempo. Todas las páginas de resultados y contabilidad deben leer este estado para filtrar sus vistas. No se permite usar estados locales aislados para fechas si existe un selector global.

## 4. El Corazón Contable
- **Destino Ineludible:** Todo movimiento de dinero (Transacción) termina obligatoriamente en un Asiento Contable (`AsientoContable`).
- **Motor Automático:** Las transacciones están vinculadas a una `CategoriaMovimiento`, la cual internamente está conectada a una `CuentaContable`. Al procesar un recibo, se llama al motor automático para asentar el débito y crédito.
- **Libros Oficiales:** El Libro Diario y Libro Mayor se calculan a partir de los `DetalleAsiento`. Son la única fuente de verdad financiera.
