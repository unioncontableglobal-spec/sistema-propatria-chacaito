import React from 'react';

export type EventoParaPagar = {
  tipo: string;
  socioBeneficiarioId?: number;
  ficha: string;
  nombre: string;
  parentesco: string;
  monto: number;
};

export type PrintListadoCxPProps = {
  mes: string;
  eventos: EventoParaPagar[];
  sociosActivosCount: number;
};

export default function PrintListadoCxP({ mes, eventos, sociosActivosCount }: PrintListadoCxPProps) {
  // Agrupar eventos por tipo
  const eventosAgrupados = eventos.reduce((acc, ev) => {
    if (!acc[ev.tipo]) acc[ev.tipo] = [];
    acc[ev.tipo].push(ev);
    return acc;
  }, {} as Record<string, EventoParaPagar[]>);

  return (
    <div className="print-only text-black p-8" style={{ width: '8.5in', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}>
      {Object.entries(eventosAgrupados).map(([tipo, lista], index) => {
        const totalCategoria = lista.reduce((sum, e) => sum + e.monto, 0);
        const porSocio = sociosActivosCount > 0 ? totalCategoria / sociosActivosCount : 0;

        return (
          <div key={index} className="mb-8 page-break-after-auto">
            {/* Membrete Formal */}
            <div className="text-center mb-6">
              <h2 className="font-bold text-lg uppercase tracking-wide">A.C. Propatria Carmelitas Chacaíto</h2>
              <h3 className="font-bold text-sm text-gray-800">RIF: J-00188684-2</h3>
            </div>

            <h2 className="text-2xl font-bold uppercase mb-4 text-center">
              {tipo} {mes}
            </h2>
            <table className="w-full border-collapse border border-black text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-black p-2 text-left uppercase">Socio</th>
                  <th className="border border-black p-2 text-left uppercase">Nombre y Apellido</th>
                  <th className="border border-black p-2 text-center uppercase">Parentesco</th>
                  <th className="border border-black p-2 text-right uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((ev, i) => (
                  <tr key={i}>
                    <td className="border border-black p-2 font-bold">{ev.ficha}</td>
                    <td className="border border-black p-2 font-bold uppercase">{ev.nombre}</td>
                    <td className="border border-black p-2 text-center uppercase font-bold">{ev.parentesco || '-'}</td>
                    <td className="border border-black p-2 text-right">{ev.monto.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="border border-black p-2 font-bold">
                    {sociosActivosCount} SOCIOS
                  </td>
                  <td className="border border-black p-2 text-right font-bold uppercase">Total</td>
                  <td className="border border-black p-2 text-right font-bold bg-gray-100">
                    {totalCategoria.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="border border-black p-2 text-right">
                    Monto a pagar por cada asociado
                  </td>
                  <td className="border border-black p-2 text-right font-bold underline">
                    {porSocio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })}
    </div>
  );
}
