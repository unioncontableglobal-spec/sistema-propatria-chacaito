PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Socio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ficha" TEXT,
    "escalafon" TEXT,
    "nombre_apellido" TEXT NOT NULL,
    "cedula" TEXT,
    "f_afiliacion" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVO',
    "detalle" TEXT
, "correo" TEXT, "direccion" TEXT, "placa" TEXT, "telefono" TEXT, "codigo" TEXT, "rif" TEXT);
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
    CONSTRAINT "Transaccion_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
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
DELETE FROM sqlite_sequence;
CREATE UNIQUE INDEX "Conciliacion_formaPagoId_key" ON "Conciliacion"("formaPagoId");
COMMIT;
