"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Props = {
  data: { name: string; fianzas: number; ayudasBs: number; vidrios: number; montepio: number; grua: number }[];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc: number, curr: any) => acc + curr.value, 0);

    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 min-w-[220px]">
        <p className="font-bold text-slate-800 text-xs uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Mes: {label}</p>
        
        {payload.map((entry: any, index: number) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
          return (
            <div key={`item-${index}`} className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold truncate max-w-[90px]" title={entry.name}>
                  {entry.name.replace('($)', '').replace('(Bs)', '').trim()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  {entry.name.includes('$') ? '$' : 'Bs.'} {new Intl.NumberFormat('en-US').format(entry.value)}
                </span>
                <span className="text-[9px] font-bold text-slate-400 w-7 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function CxCStackedBarChart({ data }: Props) {
  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }} barSize={40}>
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
            tickFormatter={(value) => `$${value}`} 
            tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#F8FAFC'}} />
          <Bar dataKey="fianzas" name="Fianzas ($)" stackId="a" fill="#0F172A" />
          <Bar dataKey="vidrios" name="Vidrios ($)" stackId="a" fill="#334155" />
          <Bar dataKey="montepio" name="Montepio ($)" stackId="a" fill="#64748B" />
          <Bar dataKey="grua" name="Grua ($)" stackId="a" fill="#94A3B8" />
          {/* Ayudas is usually in Bs, use a distinctly different pastel color to separate it from USD layers */}
          <Bar dataKey="ayudasBs" name="Ayudas (Bs)" stackId="a" fill="#38BDF8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
