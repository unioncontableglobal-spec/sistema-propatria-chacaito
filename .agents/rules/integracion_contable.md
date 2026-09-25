---
description: Regla fundamental sobre el flujo de dinero y la generación de asientos contables.
---

# Flujo de Integración Contable

1. **Principio de Centralización Contable:** 
   - TODA operación financiera (ingreso, egreso, ajuste) que se registre en la base de datos, ya sea de forma automática por el sistema o de forma manual por un usuario, **DEBE** filtrarse hacia el módulo de Libros Contables.
   
2. **Generación Obligatoria de Asientos:**
   - La contabilidad de la empresa se alimenta única y exclusivamente de los Asientos Contables (`AsientoContable`). 
   - Por lo tanto, cualquier nuevo módulo de cobro o pago que se desarrolle en el futuro debe implementar o invocar el motor de `generarAsientoDesdeTransaccion` u obligar al usuario a asentar la operación manualmente.

3. **Cuadratura:**
   - Los libros contables (Diario, Mayor) son la fuente de la verdad financiera. No se puede permitir una transacción sin cuenta contable (`CategoriaMovimiento` -> `CuentaContable`).
