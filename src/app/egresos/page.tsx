"use client";

import { useState } from "react";
import { TrendingDown, Search } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { transaccionMatchesMes, labelFiltro } from "@/lib/mesUtils";

type Transaccion = {
  id: number;
  tipo: string;
  recibo: string | null;
  fecha: string;
  mes: string | null;
  monto_bs: number;
  monto_usd: number | null;
  clasificacion: string | null;
  detalle: string | null;
  socio: { nombre_apellido: string; ficha: string | null } | null;
  tercero: { nombre: string } | null;
  formas_pago: { tipo_pago: string; monto_bs: number; monto_usd: number | null }[];
};

export default function EgresosPage() {
  const [search, setSearch] = useState("");
  const [filtroClasificacion, setFiltroClasificacion] = useState("");
  const { transacciones, filtroMesGlobal } = useAppStore();

  // Filtrar solo egresos del store global (ya viene completo ahora)
  const egresos = transacciones.filter((t) => t.tipo === "EGRESO");

  const filteredEgresos = egresos.filter((e) => {
    const matchesMes = transaccionMatchesMes(e.mes, filtroMesGlobal);

    const matchesSearch =
      !search ||
      e.recibo?.toLowerCase().includes(search.toLowerCase()) ||
      e.socio?.nombre_apellido?.toLowerCase().includes(search.toLowerCase()) ||
      e.tercero?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      e.clasificacion?.toLowerCase().includes(search.toLowerCase());

    const matchesClasificacion =
      !filtroClasificacion || e.clasificacion === filtroClasificacion;

    return matchesMes && matchesSearch && matchesClasificacion;
  });

  // Clasificaciones únicas para el filtro
  const clasificaciones = Array.from(
    new Set(egresos.map((e) => e.clasificacion).filter(Boolean))
  ).sort() as string[];

  // Totales
  const totalUsd = filteredEgresos.reduce((s, e) => s + (e.monto_usd || 0), 0);
  const totalBs = filteredEgresos.reduce((s, e) => s + e.monto_bs, 0);

  const formatUsd = (v: number) =>
    new Intl.NumberFormat("es-VE", { style: "currency", currency: "USD" }).format(v);

  return (
    <>
      <header
        className="header"
        style={{ marginBottom: "1.5rem", background: "transparent", boxShadow: "none", padding: 0 }}
      >
        <div>
          <h2 style={{ fontSize: "1.5rem", color: "var(--color-primary)" }}>
            Auditoría de Egresos
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            Registro y control de recibos de egresos y pagos
          </p>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm border-l-4 border-l-red-500">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Egresos (filtrado)</p>
          <p className="text-2xl font-black text-red-600">{formatUsd(totalUsd)}</p>
          <p className="text-xs text-gray-400 mt-1">
            ~ Bs. {totalBs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Registros Encontrados</p>
          <p className="text-2xl font-black text-gray-800">{filteredEgresos.length}</p>
          <p className="text-xs text-gray-400 mt-1">de {egresos.length} egresos totales</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Período Activo</p>
          <p className="text-xl font-black text-blue-700">
            {filtroMesGlobal === "HISTÓRICO TOTAL" ? "Histórico Total" : filtroMesGlobal}
          </p>
          <p className="text-xs text-gray-400 mt-1">Usa el selector global para cambiar</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-5 flex flex-wrap gap-4 items-end">
        <div className="flex-[2] min-w-[200px]">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              background: "white",
            }}
          >
            <Search size={20} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Buscar por Nro Recibo, Socio, Tercero o Concepto..."
              style={{ border: "none", outline: "none", flex: 1, fontSize: "1rem", background: "transparent" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <select
            value={filtroClasificacion}
            onChange={(e) => setFiltroClasificacion(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Todas las categorías</option>
            {clasificaciones.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr style={{ backgroundColor: "#DC2626", color: "white" }}>
              <th style={{ color: "white" }}>Nro Recibo</th>
              <th style={{ color: "white" }}>Fecha</th>
              <th style={{ color: "white" }}>Destinatario</th>
              <th style={{ color: "white" }}>Clasificación</th>
              <th style={{ color: "white" }}>Forma de Pago</th>
              <th style={{ color: "white", textAlign: "right" }}>Monto Bs.</th>
              <th style={{ color: "white", textAlign: "right" }}>Monto USD</th>
            </tr>
          </thead>
          <tbody>
            {filteredEgresos.length > 0 ? (
              filteredEgresos.map((egreso) => {
                const formas = egreso.formas_pago || [];
                const metodos =
                  formas.length > 0
                    ? formas.map((f: any) => f.tipo_pago).join(", ")
                    : "—";
                const nombre =
                  egreso.socio?.nombre_apellido ||
                  egreso.tercero?.nombre ||
                  "N/A";

                return (
                  <tr key={egreso.id}>
                    <td style={{ fontWeight: 600 }}>{egreso.recibo || "-"}</td>
                    <td>{new Date(egreso.fecha).toLocaleDateString("es-VE")}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{nombre}</div>
                      {egreso.socio?.ficha && (
                        <div style={{ fontSize: "0.75rem", color: "gray" }}>
                          {egreso.socio.ficha}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-warning" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5" }}>
                        {egreso.clasificacion || "EGRESO"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "gray" }}>{metodos}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      Bs {egreso.monto_bs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "#DC2626" }}>
                      {egreso.monto_usd ? `$${egreso.monto_usd.toLocaleString("es-VE", { minimumFractionDigits: 2 })}` : "-"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                  No se encontraron egresos con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
          {filteredEgresos.length > 0 && (
            <tfoot>
              <tr style={{ background: "#FEF2F2", fontWeight: "bold" }}>
                <td colSpan={5} style={{ padding: "0.75rem 1rem", textAlign: "right", color: "#DC2626" }}>
                  TOTALES:
                </td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "right", color: "#DC2626" }}>
                  Bs {totalBs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "right", color: "#DC2626" }}>
                  {formatUsd(totalUsd)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
}
