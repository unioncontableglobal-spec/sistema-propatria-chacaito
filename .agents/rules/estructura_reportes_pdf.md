---
name: "Estructura Oficial para Reportes PDF (Impresión)"
description: "Estándar obligatorio para cualquier vista o componente diseñado para ser impreso (reportes, balances, auditorías)."
---

# Regla: Estructura de Reportes PDF

Todo componente, página o vista destinada a impresión (usualmente bajo clases como `print-show-block` o similar) debe utilizar el componente centralizado `PrintReport.tsx` o, si es un módulo totalmente nuevo que requiere código customizado, **debe** replicar exactamente la siguiente estructura y estética:

## 1. Membrete Oficial (Obligatorio en todo reporte)
- **Izquierda:** 
  - Título: "A.C. Propatria Carmelitas Chacaíto" (uppercase, negrita)
  - Subtítulo: "RIF: J-00188684-2"
- **Derecha:**
  - "Desarrollado por"
  - "UNIÓN CONTABLE GLOBAL" (uppercase, negrita)
  - "RIF: J-50714716-9"
- Separador: Borde inferior grueso con el color principal del reporte.

## 2. Encabezado del Reporte
- **Título del Reporte:** Centrado, uppercase, negrita, con el color principal del módulo.
- **Subtítulo / Período:** "Período: [Mes/Rango o Histórico Total]".
- **Metadatos:** Fecha de generación del documento y conteo de registros.

## 3. Resumen Ejecutivo (KPIs en Columnas)
Debe presentar métricas clave en formato de tarjetas o columnas (máximo 4):
- **Caja 1:** Total Monetario Principal (USD) y su equivalente referencial en Bs.
- **Caja 2 y 3:** Desgloses (ej. Vía Banco vs Vía Efectivo) con porcentajes de participación.
- **Caja 4:** Meta, Margen de Utilidad, o Tasa de Cambio Promedio.

## 4. Resumen Agrupado (Subtotales)
- Una tabla pequeña resumen antes del detalle principal.
- Usualmente agrupada por "Categoría" o "Clasificación".
- Debe incluir: Cantidad de transacciones, Subtotal USD, Subtotal Bs, y un Porcentaje (% del total) acompañado de una **barra visual proporcional**.

## 5. Tabla de Detalles
- **Orden:** Debe estar ordenada primero de forma lógica (ej. por Categoría) y luego cronológicamente (Fecha).
- **Subencabezados:** Si los datos están agrupados, usar filas de subtítulo coloreadas (ej. fondo claro) para separar los grupos, indicando el nombre del grupo y el subtotal de ese grupo.
- **Columnas mínimas requeridas:** Fecha, Identificador (Recibo/Comprobante), Sujeto (Emisor/Receptor), Concepto, Forma de Pago, Monto USD, Monto Bs.

## 6. Fila de Totales
- Al final de la tabla de detalles, una fila `<tfoot>` con fondo oscuro (ej. `#0A1128`), texto en blanco, y los montos totales resaltados (ej. en amarillo `#FDE047`).

## 7. Pie de Página (Firmas)
- Tres (3) líneas de firma horizontales:
  1. Responsable Financiero
  2. Presidente / Director
  3. Sello y Revisado por
- Texto al pie (centrado, gris claro): "Documento confidencial generado por el Sistema de Gestión Propatria Chacaíto · Software desarrollado por Unión Contable Global · RIF: J-50714716-9".

## Colores Corporativos para Reportes
- **Ingresos / CxC:** Azul (`#1D4ED8`)
- **Egresos / CxP:** Rojo (`#DC2626`)
- **Neutral / Fondos:** Gris claro (`#f9fafb`), Azul marino (`#0A1128`) para encabezados oscuros o totales.
- Tipografía limpia, tamaño pequeño (ej. 7pt a 10pt) para acomodar data en formato A4 / Letter.
