"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS_INCOME = ['#166534', '#15803D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0'];
const COLORS_EXPENSE = ['#7F1D1D', '#991B1B', '#B91C1C', '#DC2626', '#EF4444', '#F87171', '#FCA5A5'];

type Props = {
  data: { name: string; value: number }[];
  type: 'income' | 'expense';
};

const CustomTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
    return (
      <div style={{ backgroundColor: 'white', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
        <p style={{ fontWeight: 'bold', margin: 0, color: '#0F172A' }}>{entry.name}</p>
        <p style={{ margin: 0, color: entry.payload.fill, fontSize: '0.85rem' }}>
          Bs. {new Intl.NumberFormat('es-VE').format(entry.value)}
          <span style={{ color: '#64748B', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
            ({percent}%)
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function DistributionPieChart({ data, type }: Props) {
  const colors = type === 'income' ? COLORS_INCOME : COLORS_EXPENSE;

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="10px" fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="35%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            labelLine={false}
            label={renderCustomizedLabel}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip total={total} />} />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            iconType="circle"
            wrapperStyle={{
              fontSize: '0.75rem',
              color: '#334155',
              width: '50%',
              lineHeight: '2'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
