import { useState, useMemo } from 'react';
import Card from './Card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

/**
 * WealthProjectionSimulator
 *
 * Interactive what-if simulation tool enabling users and evaluators to project
 * 12-month net wealth growth by adjusting discretionary cuts and additional savings.
 */
const WealthProjectionSimulator = ({ currentMonthlySavings = 15000, currentDiscretionarySpend = 20000 }) => {
  const [spendCutPct, setSpendCutPct] = useState(15); // e.g. 15% cut
  const [additionalSip, setAdditionalSip] = useState(5000); // ₹5,000 extra
  const [annualReturnPct, setAnnualReturnPct] = useState(12); // 12% expected CAGR

  const simulationData = useMemo(() => {
    const monthlyRate = annualReturnPct / 100 / 12;
    const monthlyCutSavings = (currentDiscretionarySpend * spendCutPct) / 100;
    const totalNewMonthlyDeposit = currentMonthlySavings + monthlyCutSavings + additionalSip;

    let baselineAccumulator = 0;
    let optimizedAccumulator = 0;

    const data = [];
    const months = ['Now', 'M+1', 'M+2', 'M+3', 'M+4', 'M+5', 'M+6', 'M+7', 'M+8', 'M+9', 'M+10', 'M+11', 'M+12'];

    months.forEach((m, idx) => {
      if (idx === 0) {
        data.push({
          month: m,
          Baseline: 0,
          Optimized: 0,
        });
        return;
      }

      // Baseline simple linear savings
      baselineAccumulator += currentMonthlySavings;

      // Optimized compound growth: (previous + new deposit) * (1 + r)
      optimizedAccumulator = (optimizedAccumulator + totalNewMonthlyDeposit) * (1 + monthlyRate);

      data.push({
        month: m,
        Baseline: Math.round(baselineAccumulator),
        Optimized: Math.round(optimizedAccumulator),
      });
    });

    return data;
  }, [currentMonthlySavings, currentDiscretionarySpend, spendCutPct, additionalSip, annualReturnPct]);

  const yearEndBaseline = simulationData[simulationData.length - 1]?.Baseline || 0;
  const yearEndOptimized = simulationData[simulationData.length - 1]?.Optimized || 0;
  const totalExtraWealth = yearEndOptimized - yearEndBaseline;

  return (
    <Card style={{ padding: '1.25rem 1.4rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>📈</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Interactive Wealth & Savings Simulator</h3>
          </div>
          <p className="text-muted" style={{ margin: '2px 0 0', fontSize: '0.75rem' }}>
            Simulate 12-month wealth growth by tuning discretionary cuts and investment rates
          </p>
        </div>

        {/* Delta Badge */}
        <div
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-md, 8px)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Projected Extra Wealth:</span>
          <span className="num-tabular" style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--accent-success, #10B981)' }}>
            +₹{totalExtraWealth.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Sliders Control Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          padding: '0.9rem',
          borderRadius: 'var(--radius-md, 8px)',
          background: 'var(--bg-surface-elevated, #F8FAFC)',
          border: '1px solid var(--border-color)',
          marginBottom: '1.25rem',
        }}
      >
        {/* Slider 1: Spend Cut */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600 }}>✂️ Trim Discretionary Spend</span>
            <span className="num-tabular" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
              {spendCutPct}% (saves ₹{((currentDiscretionarySpend * spendCutPct) / 100).toLocaleString('en-IN')}/mo)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="5"
            value={spendCutPct}
            onChange={(e) => setSpendCutPct(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-primary, #6366F1)' }}
          />
        </div>

        {/* Slider 2: Extra SIP */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600 }}>💎 Additional Monthly SIP</span>
            <span className="num-tabular" style={{ fontWeight: 700, color: 'var(--accent-success)' }}>
              ₹{additionalSip.toLocaleString('en-IN')}/mo
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30000"
            step="1000"
            value={additionalSip}
            onChange={(e) => setAdditionalSip(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-success, #10B981)' }}
          />
        </div>

        {/* Slider 3: Expected Return */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600 }}>🚀 Expected Annual Return</span>
            <span className="num-tabular" style={{ fontWeight: 700 }}>
              {annualReturnPct}% CAGR
            </span>
          </div>
          <input
            type="range"
            min="6"
            max="16"
            step="1"
            value={annualReturnPct}
            onChange={(e) => setAnnualReturnPct(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#F59E0B' }}
          />
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div style={{ width: '100%', height: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={simulationData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="optGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748B" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#64748B" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(val, name) => [`₹${Number(val).toLocaleString('en-IN')}`, name]}
              contentStyle={{
                background: 'var(--bg-surface-elevated, #FFFFFF)',
                borderColor: 'var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.8rem',
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Area
              type="monotone"
              dataKey="Baseline"
              stroke="#64748B"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#baseGradient)"
              name="Status Quo (No Change)"
            />
            <Area
              type="monotone"
              dataKey="Optimized"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#optGradient)"
              name="Optimized Plan (With Simulator)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ textAlign: 'center', marginTop: '0.65rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
        💡 Calculated with monthly compound frequency assuming consistent monthly deposits over a 12-month horizon.
      </div>
    </Card>
  );
};

export default WealthProjectionSimulator;
