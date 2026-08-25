'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Download } from 'lucide-react';
import { format, endOfMonth, isBefore, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LibroMayorPage() {
  const [datosMayor, setDatosMayor] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mesFiltro, setMesFiltro] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    fetch('/api/asientos')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          // Filtrar y agrupar
          const filterDate = new Date(mesFiltro + '-01T00:00:00');
          const lastDayOfFilterMonth = endOfMonth(filterDate);
          
          // Filtrar asientos que sean <= al fin del mes seleccionado
          const asientosValidos = data.filter((a: any) => new Date(a.fecha) <= lastDayOfFilterMonth);
          
          const cuentaMap = new Map<number, any>();

          asientosValidos.forEach((asiento: any) => {
            const isCurrentMonth = isSameMonth(new Date(asiento.fecha), filterDate);
            const isPast = isBefore(new Date(asiento.fecha), filterDate);

            asiento.detalles.forEach((detalle: any) => {
              if (!cuentaMap.has(detalle.cuenta.id)) {
                cuentaMap.set(detalle.cuenta.id, {
                  cuenta: detalle.cuenta,
                  saldoAnterior: 0,
                  movimientos: [],
                  totalDebeMes: 0,
                  totalHaberMes: 0
                });
              }

              const cuentaData = cuentaMap.get(detalle.cuenta.id);

              if (isPast) {
                // Sumar al saldo anterior
                if (detalle.cuenta.tipoSaldo === 'DEUDOR') {
                  cuentaData.saldoAnterior += (detalle.debe - detalle.haber);
                } else {
                  cuentaData.saldoAnterior += (detalle.haber - detalle.debe);
                }
              } else if (isCurrentMonth) {
                // Registrar como movimiento del mes actual
                cuentaData.movimientos.push({
                  fecha: asiento.fecha,
                  numero: asiento.numero,
                  descripcion: asiento.descripcion,
                  debe: detalle.debe,
                  haber: detalle.haber
                });
                cuentaData.totalDebeMes += detalle.debe;
                cuentaData.totalHaberMes += detalle.haber;
              }
            });
          });

          // Convertir map a array y filtrar cuentas que no tuvieron movimiento este mes ni saldo anterior
          const resultado = Array.from(cuentaMap.values())
            .filter(c => c.movimientos.length > 0 || c.saldoAnterior !== 0)
            .sort((a, b) => a.cuenta.codigo.localeCompare(b.cuenta.codigo));

          // Ordenar movimientos de cada cuenta cronológicamente
          resultado.forEach(c => {
            c.movimientos.sort((m1: any, m2: any) => new Date(m1.fecha).getTime() - new Date(m2.fecha).getTime());
          });

          setDatosMayor(resultado);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [mesFiltro]);

  const formatCurrency = (amount: number) => {
    if (amount === 0 || !amount) return '';
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg text-[#3B82F6]">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Libro Mayor</h1>
            <p className="text-gray-500">Saldos y Movimientos por Cuenta</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input 
            type="month" 
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#3B82F6] outline-none font-medium text-gray-700"
          />
          <button className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors">
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            Cargando Libro Mayor...
          </div>
        ) : datosMayor.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            No hay movimientos contables para el mes seleccionado.
          </div>
        ) : (
          datosMayor.map((datosCuenta, index) => {
            let saldoAcumulado = datosCuenta.saldoAnterior;

            return (
              <div key={datosCuenta.cuenta.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#1E293B] text-white px-6 py-3 flex justify-between items-center">
                  <h3 className="font-bold text-lg">{datosCuenta.cuenta.codigo} - {datosCuenta.cuenta.nombre}</h3>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded font-medium tracking-wider">
                    {datosCuenta.cuenta.tipoSaldo} / {datosCuenta.cuenta.clase}
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold w-28">Fecha</th>
                        <th className="px-6 py-3 font-semibold w-24">Nro. Asiento</th>
                        <th className="px-6 py-3 font-semibold">Concepto / Descripción</th>
                        <th className="px-6 py-3 font-semibold text-right w-32">Debe</th>
                        <th className="px-6 py-3 font-semibold text-right w-32">Haber</th>
                        <th className="px-6 py-3 font-semibold text-right w-32">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* Fila de Saldo Anterior */}
                      <tr className="bg-yellow-50/50">
                        <td colSpan={3} className="px-6 py-3 font-semibold text-gray-600 text-right italic">
                          Saldo Anterior al {format(new Date(mesFiltro + '-01T00:00:00'), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3 text-right font-bold text-gray-800">
                          {formatCurrency(datosCuenta.saldoAnterior)}
                        </td>
                      </tr>
                      
                      {/* Movimientos del mes */}
                      {datosCuenta.movimientos.map((mov: any, i: number) => {
                        if (datosCuenta.cuenta.tipoSaldo === 'DEUDOR') {
                          saldoAcumulado += (mov.debe - mov.haber);
                        } else {
                          saldoAcumulado += (mov.haber - mov.debe);
                        }

                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-gray-600 font-medium">
                              {format(new Date(mov.fecha), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-6 py-3 text-[#3B82F6] font-bold">
                              {String(mov.numero).padStart(5, '0')}
                            </td>
                            <td className="px-6 py-3 text-gray-700">{mov.descripcion}</td>
                            <td className="px-6 py-3 text-right text-gray-800">{formatCurrency(mov.debe)}</td>
                            <td className="px-6 py-3 text-right text-gray-800">{formatCurrency(mov.haber)}</td>
                            <td className={`px-6 py-3 text-right font-bold ${saldoAcumulado < 0 ? 'text-red-500' : 'text-[#0F172A]'}`}>
                              {formatCurrency(saldoAcumulado)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-800 uppercase tracking-wider text-xs">
                          Totales del Mes:
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-[#0F172A]">
                          {formatCurrency(datosCuenta.totalDebeMes)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-[#0F172A]">
                          {formatCurrency(datosCuenta.totalHaberMes)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-blue-700 bg-blue-50/50">
                          {formatCurrency(saldoAcumulado)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
