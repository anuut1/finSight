import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import GlassCard from '../GlassCard.jsx';

const LineChartWrapper = ({ title, data, dataKeyX, dataKeyY1, dataKeyY2, labelY1, labelY2 }) => {
  return (
    <GlassCard style={{ padding: '1rem 1.25rem', height: 280 }}>
      <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>{title}</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
          <Line type="monotone" dataKey={dataKeyY1} name={labelY1} stroke="#4f8ef7" dot={false} />
          {dataKeyY2 && (
            <Line type="monotone" dataKey={dataKeyY2} name={labelY2} stroke="#ff6b6b" dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

export default LineChartWrapper;

