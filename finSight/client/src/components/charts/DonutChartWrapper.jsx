import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import GlassCard from '../GlassCard.jsx';

const COLORS = ['#4f8ef7', '#00d4aa', '#ff6b6b', '#f9c74f', '#9b5de5', '#48bfe3'];

const DonutChartWrapper = ({ title, data, dataKeyName, dataKeyValue }) => {
  return (
    <GlassCard style={{ padding: '1rem 1.25rem', height: 260 }}>
      <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>{title}</div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKeyValue}
            nameKey={dataKeyName}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell key={entry[dataKeyName]} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#050713',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

export default DonutChartWrapper;

