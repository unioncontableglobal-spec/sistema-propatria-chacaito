CREATE TABLE IF NOT EXISTS "Socio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT,
    "ficha" TEXT,
    "escalafon" TEXT,
    "nombre_apellido" TEXT NOT NULL,
    "cedula" TEXT,
    "rif" TEXT,
    "f_afiliacion" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVO',
    "detalle" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "placa" TEXT,
    "direccion" TEXT
);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE IF NOT EXISTS "FormaPago" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transaccionId" INTEGER NOT NULL,
    "tipo_pago" TEXT NOT NULL,
    "referencia" TEXT,
    "banco" TEXT,
    "monto_bs" REAL NOT NULL,
    "tasa_cambio" REAL,
    "monto_usd" REAL,
    CONSTRAINT "FormaPago_transaccionId_fkey" FOREIGN KEY ("transaccionId") REFERENCES "Transaccion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "CuentaPorCobrar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "socioId" INTEGER NOT NULL,
    "tipo_publicacion" TEXT,
    "mes" TEXT,
    "monto_a_cobrar" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT "CuentaPorCobrar_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "CuentaPorPagar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "socioId" INTEGER NOT NULL,
    "tipo_publicacion" TEXT,
    "parentesco" TEXT,
    "mes" TEXT,
    "monto" REAL NOT NULL,
    "total" REAL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT "CuentaPorPagar_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Conciliacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "formaPagoId" INTEGER NOT NULL,
    "estado_cuenta_ref" TEXT,
    "mes" TEXT,
    "discrepancia" REAL,
    "estado" TEXT NOT NULL DEFAULT 'TRANSITO',
    CONSTRAINT "Conciliacion_formaPagoId_fkey" FOREIGN KEY ("formaPagoId") REFERENCES "FormaPago" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ParametroLegal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ente" TEXT NOT NULL,
    "clave_parametro" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "fecha_vigencia" DATETIME
);
CREATE UNIQUE INDEX "Conciliacion_formaPagoId_key" ON "Conciliacion"("formaPagoId");
CREATE TABLE IF NOT EXISTS "PublicacionMensual" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mes" TEXT NOT NULL,
    "fecha_pub" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "reglas_json" TEXT
);
CREATE UNIQUE INDEX "PublicacionMensual_mes_key" ON "PublicacionMensual"("mes");
CREATE TABLE IF NOT EXISTS "CuentaContable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoSaldo" TEXT NOT NULL,
    "clase" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "AsientoContable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "DetalleAsiento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "asientoId" INTEGER NOT NULL,
    "cuentaId" INTEGER NOT NULL,
    "debe" REAL NOT NULL DEFAULT 0,
    "haber" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "DetalleAsiento_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "AsientoContable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DetalleAsiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaContable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CuentaContable_codigo_key" ON "CuentaContable"("codigo");
CREATE UNIQUE INDEX "AsientoContable_numero_key" ON "AsientoContable"("numero");
CREATE TABLE IF NOT EXISTS "Transaccion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "recibo" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mes" TEXT,
    "socioId" INTEGER,
    "monto_bs" REAL NOT NULL,
    "monto_usd" REAL,
    "tasa_cambio" REAL,
    "clasificacion" TEXT,
    "codigo_concepto" TEXT,
    "detalle" TEXT,
    "asientoId" INTEGER,
    CONSTRAINT "Transaccion_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaccion_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "AsientoContable" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Transaccion_asientoId_key" ON "Transaccion"("asientoId");
