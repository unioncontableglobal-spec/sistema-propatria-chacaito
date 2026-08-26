'use client';

import React, { useState } from 'react';
import { Download, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ConfiguracionPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean | null>(null);

  const handleDownloadBackup = async () => {
    try {
      setIsDownloading(true);
      setDownloadSuccess(null);
      
      const response = await fetch('/api/backup');
      
      if (!response.ok) {
        throw new Error('Error al descargar el respaldo');
      }
      
      // Obtener el blob de la respuesta
      const blob = await response.blob();
      
      // Crear URL y forzar descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Respaldo_Sistema_Propatria_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Limpieza
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadSuccess(true);
    } catch (error) {
      console.error(error);
      setDownloadSuccess(false);
    } finally {
      setIsDownloading(false);
      
      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        if (downloadSuccess) setDownloadSuccess(null);
      }, 5000);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Configuración y Sistema</h1>
      <p className="text-gray-500 mb-8">Administra los parámetros generales y resguardos de seguridad del sistema.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Panel de Respaldo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Respaldo de Base de Datos</h2>
              <p className="text-sm text-gray-500">Exportar toda la información a Excel</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mb-6 border border-gray-100">
            <p className="mb-2"><strong>Se incluirá en el archivo descargable:</strong></p>
            <ul className="list-disc pl-5 space-y-1 text-gray-500">
              <li>Directorio completo de Asociados</li>
              <li>Historial de Transacciones (Ingresos y Egresos)</li>
              <li>Estado de Cuentas por Cobrar (CxC)</li>
              <li>Estado de Cuentas por Pagar (CxP)</li>
            </ul>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-xs text-amber-600 font-medium">Mantén este archivo en un lugar seguro (ej. Google Drive personal o pendrive).</span>
          </div>
          
          <button
            onClick={handleDownloadBackup}
            disabled={isDownloading}
            className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isDownloading 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isDownloading ? (
              <>Generando archivo...</>
            ) : (
              <>
                <Download size={18} />
                Descargar Respaldo (Excel)
              </>
            )}
          </button>
          
          {downloadSuccess === true && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2 border border-green-100">
              <CheckCircle2 size={16} /> Respaldo generado y descargado exitosamente.
            </div>
          )}
          
          {downloadSuccess === false && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-100">
              <AlertTriangle size={16} /> Ocurrió un error al intentar generar el archivo.
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
