# Estándar de Reportes de Impresión (Print Layouts)

Cada vez que se implemente una función de impresión en una página (ej. botón "Imprimir Reporte" que invoca `window.print()`), el bloque diseñado para la hoja de papel (`.print-only`) debe cumplir obligatoriamente con la siguiente estructura:

1. **Membrete Fiscal (Encabezado)**:
   Debe estar centrado al inicio del documento con el nombre legal y el RIF.
   - **Nombre**: A.C. Propatria Carmelitas Chacaíto
   - **RIF**: J-00188684-2

2. **Pie de Página del Desarrollador (Footer)**:
   Al final del reporte (debajo de las firmas o totales), debe incluirse discretamente un pie de página de desarrollo, por ejemplo:
   `Software desarrollado por Leydi Zerpa` (o similar, en texto gris pequeño y centrado).

3. **Restricción CSS**: 
   Todo el bloque debe usar la clase `.print-only` y `.hidden print:block` para asegurar que no contamine la interfaz web normal y garantizar que la impresión salga perfecta en tamaño carta (100%).
