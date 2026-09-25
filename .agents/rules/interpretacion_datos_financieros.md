# Interpretación de Datos Financieros y Contables

## El "Efecto 1 USD" (Transacciones Exclusivas en Bolívares)
En la base de datos `Transaccion` de este sistema, existe un patrón de entrada de datos específico llamado el "Efecto 1 USD". 

Cuando un registro tiene `monto_usd == 1` y `tasa_cambio == monto_bs` (o una tasa de cambio irrealmente alta comparada con el mercado, como > 50), **NO significa que haya un error de digitación o datos corruptos**. Significa que la transacción se realizó **estrictamente en Bolívares puros** y no hubo conversión a dólares real al momento del registro.

### Reglas Obligatorias de Procesamiento:
1. **Promedios:** Al auditar o calcular promedios de tasas de cambio históricas en scripts, **siempre debes excluir** cualquier registro que cumpla con el "Efecto 1 USD", ya que distorsionará drásticamente las matemáticas de la tasa real del mercado.
2. **Cálculo Referencial:** Si el sistema o un Dashboard necesita mostrar el equivalente en USD real de esas transacciones, **NUNCA debe multiplicar/dividir por el campo `tasa_cambio` de ese registro**. Debe utilizar una Tasa de Cambio Referencial global inyectada en el módulo (ej. 35.00) para calcular correctamente.
3. **Comunicación:** Al interactuar con el usuario, nunca te refieras a estos registros como "errores" o "tasas absurdas"; reconócelos formalmente como "Transacciones en Bs puro (Efecto 1 USD)".

## 4. Limitación de Dominio: Módulo de Asociados (CxC y CxP)
- **Regla Estricta**: Los submódulos de CxC (Cuentas por Cobrar) y CxP (Cuentas por Pagar) dentro del **Módulo de Asociados** están destinados **única y exclusivamente** al tratamiento y desglose de los recibos generados por **Publicaciones**.
- **Filtros Mandatorios**: En cualquier consulta o endpoint dirigido a CxC o CxP, se debe aplicar explícitamente el filtro de clasificación (ej. `clasificacion = 'INGRESO_CXP'` o conceptos específicos de las publicaciones).
- **Exclusión**: No se deben renderizar, auditar ni listar ingresos o egresos de conceptos "varios", administrativos o ajenos a las publicaciones de los socios en estos submódulos. Todo lo externo pertenece al **Módulo Financiero**.

## 5. Cálculo de Meta de Recaudación (CxC)
- **Fórmula Base**: La "Meta CxC" (Total a recaudar) de un mes específico es el resultado de: `(Cantidad de Socios Activos) × (Costo Per Cápita de la Publicación)`.
- **Naturaleza del Dato**: El sistema materializa esta meta creando registros individuales en la tabla `CuentaPorCobrar` para cada socio activo durante la "Aprobación de la Publicación".
- **Conceptos Exclusivos**: La multiplicación no es homogénea para todos los conceptos. Por ejemplo, el cobro de "Grúa" se prorratea y multiplica **únicamente** por los socios con cupo tipo "SA".
