"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Props = {
  data: { name: string; fianzas: number; ayudasBs: number; vidrios: number; montepio: number; grua: number }[];
};

export default function CxCStackedBarChart({ data }: Props) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((acc: number, curr: any) => acc + curr.value, 0);

      return (
        <div style={{ backgroundColor: 'white', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          <p style={{ fontWeight: 'bold', margin: 0, marginBottom: '0.5rem', color: '#0F172A' }}>{label}</p>
          {payload.map((entry: any, index: number) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
            return (
              <p key={`item-${index}`} style={{ margin: 0, color: entry.fill, fontSize: '0.85rem' }}>
                {entry.name}: {entry.name.includes('$') ? '$' : 'Bs.'} {new Intl.NumberFormat('en-US').format(entry.value)}
                <span style={{ color: '#64748B', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                  ({pct}%)
                </span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="fianzas" name="Fianzas ($)" stackId="a" fill="#0A1128" />
          <Bar dataKey="vidrios" name="Vidrios ($)" stackId="a" fill="#1E3A8A" />
          <Bar dataKey="montepio" name="Montepio ($)" stackId="a" fill="#3B82F6" />
          <Bar dataKey="grua" name="Grua ($)" stackId="a" fill="#93C5FD" />
          <Bar dataKey="ayudasBs" name="Ayudas (Bs)" stackId="a" fill="#FB923C" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
