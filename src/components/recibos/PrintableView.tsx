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
    <div className={`w-1/2 h-full p-4 flex flex-col relative overflow-hidden box-border ${!isCopy ? 'border-l border-dashed border-gray-400' : ''}`} style={{ pageBreakInside: 'avoid' }}>
      
      {/* Watermark Logo */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.07] pointer-events-none">
        <img src="/logo.png" alt="Sello" className="w-48 h-48 object-contain grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2 items-center">
             <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
             <div>
               <h2 className="font-bold text-[10px] uppercase leading-tight">ASOC. CIVIL PRO-PATRIA CARMELITAS - CHACAITO</h2>
               <p className="text-[9px] font-bold text-gray-800">RIF: J-00188684-2</p>
               <p className="text-[8px] uppercase font-medium">CARACAS / VENEZUELA</p>
             </div>
          </div>
          <div className="text-right whitespace-nowrap ml-1">
             <p className="text-[8px] font-bold text-gray-500 tracking-widest">{isCopy ? 'COPIA' : 'ORIGINAL'}</p>
          </div>
        </div>

        <div className="flex justify-between items-end border-b-2 border-black pb-1 mb-2">
          <p className="text-[10px] lowercase">{formattedDate}</p>
          <p className="text-[11px] font-bold uppercase">{data.tipo}: {data.numeroRecibo}</p>
        </div>

        <div className="flex justify-between items-center font-bold text-[10px] mb-2">
          <p className="truncate pr-2">
            <span className="mr-2 text-[11px]">{data.socio.ficha}</span>
            <span className="truncate">{data.socio.nombre}</span>
          </p>
          <p className="whitespace-nowrap">C.I.: {data.socio.cedula}</p>
        </div>

        {/* Conceptos */}
        <table className="w-full mb-2 border-collapse text-[9px]">
          <thead>
            <tr className="border-t border-b border-black">
              <th className="text-left font-bold py-1">Cod</th>
              <th className="text-left font-bold py-1">Desc</th>
              <th className="text-right font-bold py-1">SubT</th>
              <th className="text-right font-bold py-1">Cant</th>
              <th className="text-right font-bold py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.conceptos.map((c, i) => {
              const rate = data.pago.tasa_cambio || 1;
              const dollars = rate > 1 ? c.total / rate : c.total; 
              
              return (
                <tr key={i} className="border-b border-gray-300">
                  <td className="py-1">{c.codigo}</td>
                  <td className="py-1 uppercase truncate max-w-[80px]">{c.descripcion}</td>
                  <td className="text-right py-1">{rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-right py-1">{dollars.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-right py-1 font-semibold">{c.total.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="flex-grow"></div>

        {/* Note and Gran Total */}
        <div className="flex justify-between items-center border border-black p-1.5 mb-2 text-[9px] bg-gray-50/50">
          <div className="flex-1 flex items-end overflow-hidden">
            <span className="font-bold italic mr-1">NOTA:</span>
            <span className="border-b border-black flex-1 border-dashed truncate">{data.nota || '\u00A0'}</span>
          </div>
          <div className="ml-2 font-bold text-[11px] whitespace-nowrap pl-2 border-l border-gray-300">
            Total: Bs {data.granTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Pagos */}
        <table className="w-full border-collapse text-[9px] mt-auto">
          <thead>
            <tr className="border-t border-b border-black">
              <th className="text-left font-bold py-1">Pago</th>
              <th className="text-left font-bold py-1">Ref</th>
              <th className="text-center font-bold py-1">Banco</th>
              <th className="text-right font-bold py-1">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="py-1 uppercase">{data.pago.tipo_pago}</td>
              <td className="py-1 font-mono">{data.pago.referencia || '-'}</td>
              <td className="text-center py-1 uppercase">{data.pago.banco || '-'}</td>
              <td className="text-right py-1">{data.pago.monto_bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-right font-bold italic py-1 pr-2">Total:</td>
              <td className="text-right py-1 font-bold">{data.pago.monto_bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          #print-container, #print-container * {
            visibility: visible;
          }
          #print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 8.5in !important;
            height: 5.5in !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}} />
      <div id="print-container" className="fixed top-0 left-0 z-[9999] bg-white text-black w-[8.5in] h-[5.5in] box-border flex flex-row overflow-hidden">
        {/* Izquierda (Copia) y Derecha (Original) */}
        <ReceiptBlock isCopy={true} />
        <ReceiptBlock isCopy={false} />
      </div>
    </>
  );
}
