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
      <div style={{ backgroundColor: 'white', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
        <p style={{ fontWeight: 'bold', margin: 0, marginBottom: '0.5rem', color: '#0F172A' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ margin: 0, color: entry.fill, fontSize: '0.85rem' }}>
            {entry.name}: Bs. {new Intl.NumberFormat('es-VE').format(entry.value)}
          </p>
        ))}
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#64748B', fontWeight: 'bold' }}>
          Margen: {rentabilidad}%
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
    <text x={x + width / 2} y={y - 8} fill="#64748B" textAnchor="middle" fontSize="10px" fontWeight="bold">
      {`Bs${(value / 1000).toFixed(0)}k`}
    </text>
  );
};

export default function MonthlyTrendChart({ data }: Props) {

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 25, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Bs ${(value / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="ingresos" name="Ingresos" fill="#16A34A" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="ingresos" content={renderCustomBarLabel} />
          </Bar>
          <Bar dataKey="egresos" name="Egresos" fill="#DC2626" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="egresos" content={renderCustomBarLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
