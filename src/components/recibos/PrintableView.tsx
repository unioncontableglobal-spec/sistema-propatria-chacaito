import React from 'react';

export type Concepto = {
  codigo: string;
  descripcion: string;
  subtotal: number;
  cantidad: number;
  total: number;
};

export type DetallePago = {
  tipo_pago: string;
  referencia: string;
  banco: string;
  tasa_cambio: number;
  monto_bs: number;
  monto_usd: number;
};

export type ReceiptData = {
  tipo: 'INGRESO' | 'EGRESO';
  numeroRecibo: string;
  fecha: Date;
  socio: {
    ficha: string;
    nombre: string;
    cedula: string;
  };
  conceptos: Concepto[];
  pago: DetallePago;
  granTotalBs: number;
  nota: string;
};

interface PrintableViewProps {
  data: ReceiptData;
}

export default function PrintableView({ data }: PrintableViewProps) {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = data.fecha.toLocaleDateString('es-ES', options);

  return (
    <div className="print-only bg-white text-black text-sm p-8" style={{ width: '8.5in', height: '5.5in', boxSizing: 'border-box' }}>
      <div className="text-center mb-4">
        <h2 className="font-bold text-lg uppercase tracking-wide">ASOC. CIVIL PROPATRIA CHACAITO</h2>
        <h3 className="font-bold text-sm text-gray-800">RIF: J-00188684-2</h3>
        <p className="text-xs mt-1">CARACAS / VENEZUELA</p>
      </div>

      <div className="flex justify-between items-end border-b border-black pb-1 mb-2">
        <p className="lowercase">{formattedDate}</p>
        <p className="font-bold uppercase">{data.tipo}: {data.numeroRecibo}</p>
      </div>

      <div className="flex justify-between items-center font-bold mb-2">
        <p>
          <span className="mr-4">{data.socio.ficha}</span>
          <span>{data.socio.nombre}</span>
        </p>
        <p>C.I.: {data.socio.cedula}</p>
      </div>

      <table className="w-full mb-4 border-collapse">
        <thead>
          <tr className="border-t border-b border-black">
            <th className="text-left font-bold py-1">Codigo</th>
            <th className="text-left font-bold py-1">Descripcion</th>
            <th className="text-right font-bold py-1">Subtotal</th>
            <th className="text-right font-bold py-1">Cant</th>
            <th className="text-right font-bold py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.conceptos.map((c, i) => (
            <tr key={i} className="border-b border-gray-300">
              <td className="py-1">{c.codigo}</td>
              <td className="py-1">{c.descripcion}</td>
              <td className="text-right py-1">{c.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="text-right py-1">{c.cantidad.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="text-right py-1">{c.total.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center border border-black p-2 mb-4">
        <div className="flex-1 flex">
          <span className="font-bold italic mr-2">NOTA:</span>
          <span className="border-b border-black flex-1 border-dashed">{data.nota || '\u00A0'}</span>
        </div>
        <div className="ml-4 font-bold text-lg whitespace-nowrap">
          Total: Bs {data.granTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-t border-b border-black">
            <th className="text-left font-bold py-1">Descripción</th>
            <th className="text-left font-bold py-1">Numero</th>
            <th className="text-center font-bold py-1">Proveniente</th>
            <th className="text-right font-bold py-1">Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-300">
            <td className="py-1 uppercase">{data.pago.tipo_pago}</td>
            <td className="py-1">{data.pago.referencia || '-'}</td>
            <td className="text-center py-1 uppercase">{data.pago.banco || '-'}</td>
            <td className="text-right py-1">{data.pago.monto_bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="text-right font-bold italic py-1">Total:</td>
            <td className="text-right py-1">{data.pago.monto_bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
