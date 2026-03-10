import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import GlassCard from '../GlassCard.jsx';

const BarChartWrapper = ({ title, data, dataKeyX, dataKeyY, color }) => {
  return (
    <GlassCard style={{ padding: '1rem 1.25rem', height: 260 }}>
      <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>{title}</div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey={dataKeyX} stroke="var(--text-muted)" />
          <YAxis stroke="var(--text-muted)" />
          <Tooltip
            contentStyle={{
              background: '#050713',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
            }}
          />
          <Bar dataKey={dataKeyY} fill={color || '#4f8ef7'} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

export default BarChartWrapper;

