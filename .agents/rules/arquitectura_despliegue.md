---
description: Describe la arquitectura del proyecto (Vercel y Turso) y cómo esto afecta el flujo de trabajo
---

# Arquitectura y Flujo de Despliegue

Este documento define la arquitectura de despliegue del proyecto y las reglas obligatorias al realizar cambios o interactuar con la base de datos.

1. **Frontend / Aplicación (Vercel)**:
   - Este sistema está desplegado en **Vercel**.
   - Cualquier cambio en el código fuente (archivos locales) **debe ser subido al repositorio remoto (usando git commit y git push)** para que Vercel inicie el proceso de *build* y el usuario pueda ver los cambios en producción.
   - Si el usuario indica que "no ve los cambios", debes recordarle proactivamente que Vercel tarda un par de minutos en realizar el despliegue automático tras un push.

2. **Base de Datos (Turso)**:
   - La base de datos es SQLite pero está alojada en **Turso** (remoto).
   - Para interactuar con la base de datos vía scripts interactivos (como validaciones rápidas en Node.js), siempre se deben usar las variables de entorno remotas.
   - Cualquier script de Node.js que cree el asistente para corregir, auditar o migrar datos *debe* incluir en su cabecera `require('dotenv').config()` para poder leer `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` exitosamente de los archivos `.env` locales.
