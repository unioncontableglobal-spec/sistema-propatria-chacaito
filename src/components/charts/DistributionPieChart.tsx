"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS_INCOME = ['#3B82F6', '#60A5FA', '#93C5FD', '#10B981', '#34D399', '#6EE7B7', '#F59E0B'];
const COLORS_EXPENSE = ['#F43F5E', '#FB7185', '#FDA4AF', '#F59E0B', '#FBBF24', '#FCD34D', '#8B5CF6'];

type Props = {
  data: { name: string; value: number }[];
  type: 'income' | 'expense';
};

const CustomTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100">
        <p className="font-bold text-slate-800 text-xs uppercase tracking-widest mb-1">{entry.name}</p>
        <p className="text-sm font-medium" style={{ color: entry.payload.fill }}>
          Bs. {new Intl.NumberFormat('es-VE').format(entry.value)}
        </p>
        <p className="text-slate-400 text-xs mt-0.5">
          Representa el {percent}% del total
        </p>
      </div>
    );
  }
  return null;
};

export default function DistributionPieChart({ data, type }: Props) {
  const colors = type === 'income' ? COLORS_INCOME : COLORS_EXPENSE;
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-slate-400 text-sm font-light">Sin datos suficientes</p>
      </div>
    );
  }

  // Sort para que los más grandes estén primero
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col md:flex-row items-center w-full h-full min-h-[220px]">
      
      {/* Gráfico Donut Estilizado */}
      <div className="w-full md:w-1/2 h-[180px] md:h-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip total={total} />} cursor={{fill: 'transparent'}} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Centro del Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
          <span className="text-sm font-bold text-slate-700">100%</span>
        </div>
      </div>

      {/* Leyenda Personalizada Elegante */}
      <div className="w-full md:w-1/2 flex flex-col gap-3 justify-center pl-4 mt-4 md:mt-0">
        {sortedData.slice(0, 5).map((entry, index) => {
          const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
          return (
            <div key={index} className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 overflow-hidden">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate" title={entry.name}>
                  {entry.name}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 ml-2">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
