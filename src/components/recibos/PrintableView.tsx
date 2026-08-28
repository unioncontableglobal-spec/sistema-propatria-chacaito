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

  const ReceiptBlock = ({ isCopy }: { isCopy: boolean }) => (
    <div className={`w-full h-[50vh] p-8 flex flex-col relative overflow-hidden box-border ${!isCopy ? 'border-b-2 border-dashed border-gray-300' : ''}`} style={{ pageBreakInside: 'avoid' }}>
      
      {/* Watermark Logo */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.07] pointer-events-none">
        <img src="/icon.png" alt="Sello" className="w-80 h-80 object-contain grayscale" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-4 items-center">
             <img src="/icon.png" alt="Logo" className="w-14 h-14 object-contain" />
             <div>
               <h2 className="font-bold text-[15px] uppercase tracking-wide">ASOC. CIVIL PRO-PATRIA CARMELITAS - CHACAITO</h2>
               <p className="text-sm font-bold text-gray-800">RIF: J-00188684-2</p>
               <p className="text-xs uppercase font-medium">CARACAS / VENEZUELA</p>
             </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-gray-400 mb-1 tracking-widest">{isCopy ? 'COPIA' : 'ORIGINAL'}</p>
          </div>
        </div>

        <div className="flex justify-between items-end border-b-2 border-black pb-1 mb-3">
          <p className="text-sm lowercase">{formattedDate}</p>
          <p className="text-base font-bold uppercase">{data.tipo}: {data.numeroRecibo}</p>
        </div>

        <div className="flex justify-between items-center font-bold text-sm mb-3">
          <p>
            <span className="mr-4 text-base">{data.socio.ficha}</span>
            <span>{data.socio.nombre}</span>
          </p>
          <p>C.I.: {data.socio.cedula}</p>
        </div>

        {/* Conceptos */}
        <table className="w-full mb-3 border-collapse text-sm">
          <thead>
            <tr className="border-t border-b border-black">
              <th className="text-left font-bold py-1.5">Codigo</th>
              <th className="text-left font-bold py-1.5">Descripcion</th>
              <th className="text-right font-bold py-1.5">Subtotal</th>
              <th className="text-right font-bold py-1.5">Cant</th>
              <th className="text-right font-bold py-1.5">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.conceptos.map((c, i) => {
              const rate = data.pago.tasa_cambio || 1;
              const dollars = rate > 1 ? c.total / rate : c.total; 
              
              return (
                <tr key={i} className="border-b border-gray-300">
                  <td className="py-1.5">{c.codigo}</td>
                  <td className="py-1.5 uppercase">{c.descripcion}</td>
                  <td className="text-right py-1.5">{rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-right py-1.5">{dollars.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-right py-1.5">{c.total.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="flex-grow"></div>

        {/* Note and Gran Total */}
        <div className="flex justify-between items-center border border-black p-2 mb-3 text-sm bg-gray-50/50">
          <div className="flex-1 flex items-end">
            <span className="font-bold italic mr-2 mb-1">NOTA:</span>
            <span className="border-b border-black flex-1 border-dashed mb-1">{data.nota || '\u00A0'}</span>
          </div>
          <div className="ml-4 font-bold text-base whitespace-nowrap px-4 border-l border-gray-300">
            Total: Bs {data.granTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Pagos */}
        <table className="w-full border-collapse text-sm mt-auto">
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
              <td className="py-1.5 uppercase">{data.pago.tipo_pago}</td>
              <td className="py-1.5 font-mono">{data.pago.referencia || '-'}</td>
              <td className="text-center py-1.5 uppercase">{data.pago.banco || '-'}</td>
              <td className="text-right py-1.5">{data.pago.monto_bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-right font-bold italic py-1.5 pr-4">Total:</td>
              <td className="text-right py-1.5 font-bold">{data.pago.monto_bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: letter portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}} />
      <div className="print-only bg-white text-black w-full min-h-screen box-border flex flex-col">
        <ReceiptBlock isCopy={false} />
        <ReceiptBlock isCopy={true} />
      </div>
    </>
  );
}
