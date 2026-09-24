"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

type Props = {
  data: { name: string; ingresos: number; egresos: number }[];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const ingresos = payload.find((p: any) => p.dataKey === 'ingresos')?.value || 0;
    const egresos = payload.find((p: any) => p.dataKey === 'egresos')?.value || 0;
    const rentabilidad = ingresos > 0 ? (((ingresos - egresos) / ingresos) * 100).toFixed(1) : 0;
    
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 min-w-[200px]">
        <p className="font-bold text-slate-800 text-xs uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Mes: {label}</p>
        
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }}></div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{entry.name}</span>
            </div>
            <span className="text-xs font-bold text-slate-700">Bs. {new Intl.NumberFormat('es-VE').format(entry.value)}</span>
          </div>
        ))}
        
        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margen Neto</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${Number(rentabilidad) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {rentabilidad}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const renderCustomBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text 
      x={x + width / 2} 
      y={y - 8} 
      fill="#94A3B8" 
      textAnchor="middle" 
      fontSize="9px" 
      fontWeight="600"
      className="tracking-wider"
    >
      {`${(value / 1000).toFixed(0)}k`}
    </text>
  );
};

export default function MonthlyTrendChart({ data }: Props) {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 25, right: 10, left: 0, bottom: 5 }} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} 
            tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#F8FAFC'}} />
          <Bar dataKey="ingresos" name="Ingresos" fill="#3B82F6" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="ingresos" content={renderCustomBarLabel} />
          </Bar>
          <Bar dataKey="egresos" name="Egresos" fill="#CBD5E1" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="egresos" content={renderCustomBarLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
