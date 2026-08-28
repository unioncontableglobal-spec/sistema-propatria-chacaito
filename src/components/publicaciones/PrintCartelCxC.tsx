import React from 'react';

export type ReglasMensuales = {
  mes: string; // ej. ENERO 2026
  finanzas: number;
  eventos: {
    tipo: string;
    montoTotal: number;
    costoPorSocio: number;
  }[];
  sociosA: number;
  sociosB: number;
};

export default function PrintCartelCxC({ reglas }: { reglas: ReglasMensuales }) {
  if (!reglas) return null;

  const otrosEventos = reglas.eventos.filter(ev => !ev.tipo.toUpperCase().includes('GRUA'));
  const gruaEvento = reglas.eventos.find(ev => ev.tipo.toUpperCase().includes('GRUA'));

  const totalOtros = reglas.finanzas + otrosEventos.reduce((acc, ev) => acc + ev.costoPorSocio, 0);
  const totalGrua = gruaEvento ? gruaEvento.costoPorSocio : 0;
  
  const totalSociosA = totalOtros + totalGrua;
  const totalSociosB = totalOtros; // SB no pagan grúa

  return (
    <div className="print-only text-black" style={{ width: '8.5in', margin: '0 auto', padding: '0.5in', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Membrete Formal */}
      <div className="text-center mb-6">
        <h2 className="font-bold text-lg uppercase tracking-wide">A.C. Propatria Carmelitas Chacaíto</h2>
        <h3 className="font-bold text-sm text-gray-800">RIF: J-00188684-2</h3>
      </div>

      <h1 className="text-center text-3xl font-bold uppercase mb-4 tracking-wider">
        Mes de {reglas.mes}
      </h1>

      <table className="w-full text-lg font-bold border-collapse">
        <tbody>
          <tr>
            <td className="py-2 border-b-2 border-black" colSpan={4}>Ayudas</td>
            <td className="py-2 border-b-2 border-black text-right">Bs. 0,00</td>
          </tr>
          <tr>
            <td className="py-2 border-b-2 border-black">Finanzas</td>
            <td className="py-2 border-b-2 border-black font-normal text-base">(Ref. BCV)</td>
            <td className="py-2 border-b-2 border-black text-sm uppercase underline">Socios "A" y "B"</td>
            <td className="py-2 border-b-2 border-black text-right"></td>
            <td className="py-2 border-b-2 border-black text-right">${reglas.finanzas.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          
          {otrosEventos.map((ev, i) => (
            <tr key={i}>
              <td className="py-2 border-b-2 border-black uppercase">{ev.tipo}</td>
              <td className="py-2 border-b-2 border-black font-normal text-base">(Ref. BCV)</td>
              <td className="py-2 border-b-2 border-black text-sm uppercase underline">Socios "A" y "B"</td>
              <td className="py-2 border-b-2 border-black text-sm font-normal text-center">x SOCIOS</td>
              <td className="py-2 border-b-2 border-black text-right">${ev.costoPorSocio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          ))}

          {/* Grúa */}
          <tr>
            <td className="py-2 border-b-2 border-black">Grúa</td>
            <td className="py-2 border-b-2 border-black"></td>
            <td className="py-2 border-b-2 border-black text-sm uppercase underline text-center">Socios "A"</td>
            <td className="py-2 border-b-2 border-black text-right"></td>
            <td className="py-2 border-b-2 border-black text-right">${totalGrua.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>

      <div className="text-center font-bold text-2xl my-4">
        <p>TOTAL SOCIOS "A": ${totalSociosA.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p>TOTAL SOCIOS "B": ${totalSociosB.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>

      <div className="text-center text-red-600 font-bold text-sm mb-4 border-t-2 border-black pt-2">
        <p>Todo Asociado, A o B, que tenga DOS (2) o MAS meses vencidos en sus obligaciones, serán</p>
        <p>colocados en el Listado de Depuración para ser excluidos de la Asociación.</p>
        <p>En cumplimiento con los Artículos, 15, literal "b", Artículo 68, literal "e" y el Artículo 138, de</p>
        <p>nuestros Estatutos Sociales vigentes.</p>
      </div>

      <div className="text-center font-bold text-sm leading-tight">
        <p className="text-lg mb-1">Depositar o hacer transferencia a cualquiera de las cuentas bancarias:</p>
        <p className="text-gray-700 italic">BANESCO N° 01340206012061005369. MERCANTIL N° 01050699971699013675.</p>
        <p className="text-gray-700 italic">BANCAMIGA N° 01720102691024003335 o cuenta en dólares BANCAMIGA N°</p>
        <p className="text-gray-700 italic">01720107731074429893. Rif.: J 001886842,</p>
        <p className="text-gray-700 italic mb-2">a nombre de la A.C. Propatria carmelitas Chacaíto.</p>
        <p className="text-gray-700 italic">También puede realizar un Pago Móvil a Bancamiga 0172, (0414)-152-47-02 J 1886842</p>
      </div>

      <div className="text-center text-red-600 font-bold text-lg mt-2 underline">
        <p>VALOR DEL DÓLAR</p>
        <p>TIPO DE CAMBIO DE REFERENCIA AL BCV</p>
      </div>
    </div>
  );
}
