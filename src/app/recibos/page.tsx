import React from 'react';
import ReceiptForm from '@/components/recibos/ReceiptForm';

export const metadata = {
  title: 'Emisión de Recibos - Sistema Propatria Chacaito',
  description: 'Módulo transaccional para la emisión de recibos de ingresos y egresos',
};

export default function RecibosPage() {
  return (
    <div className="p-6">
      <div className="mb-6 no-print">
        <h1 className="text-2xl font-bold text-[#0A1128]">Módulo de Facturación y Recibos</h1>
        <p className="text-gray-500">Gestione los ingresos y egresos de los asociados</p>
      </div>
      
      <ReceiptForm />
    </div>
  );
}
