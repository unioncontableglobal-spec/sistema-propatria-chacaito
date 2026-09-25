---
description: Regla de oro de sincronización entre módulos y la centralización en los libros contables.
---

# Ecosistema Sincronizado e Integración Contable

1. **Sincronización Total (Cero Islas):**
   - El sistema es un único organismo. Todos los módulos (Balance General, Publicaciones, Emisión de Recibos, Asociados, y Auditoría) **deben trabajar de forma totalmente conectada**.
   - Si se desarrolla una nueva funcionalidad en un módulo, el asistente debe pensar proactivamente en cómo ese cambio afecta a los demás módulos y actualizar la lógica en cascada.
   - Ningún módulo debe tener datos huérfanos o procesos aislados.

2. **Destino Final Contable:** 
   - TODA operación financiera (ingreso, egreso, ajuste) que se registre en la base de datos, ya sea de forma automática por el sistema o de forma manual por un usuario, **DEBE** filtrarse hacia el módulo de Libros Contables.
   
3. **Generación Obligatoria de Asientos:**
   - La contabilidad de la empresa se alimenta única y exclusivamente de los Asientos Contables (`AsientoContable`). 
   - Por lo tanto, cualquier nuevo módulo de cobro o pago que se desarrolle en el futuro debe implementar o invocar el motor de `generarAsientoDesdeTransaccion` u obligar al usuario a asentar la operación manualmente.

4. **Cuadratura:**
   - Los libros contables (Diario, Mayor) son la fuente de la verdad financiera. No se puede permitir una transacción sin cuenta contable (`CategoriaMovimiento` -> `CuentaContable`).
