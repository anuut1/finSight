import { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import BarChartWrapper from '../components/charts/BarChartWrapper.jsx';
import DonutChartWrapper from '../components/charts/DonutChartWrapper.jsx';
import api from '../api/axios.js';

const AnalyticsPage = () => {
  const [health, setHealth] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [spendingPattern, setSpendingPattern] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [moodSpending, setMoodSpending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [
          healthRes,
          trendRes,
          catRes,
          patternRes,
          subRes,
          txRes,
        ] = await Promise.all([
          api.get('/analytics/health-score'),
          api.get('/analytics/monthly-trend'),
          api.get('/analytics/category-breakdown'),
          api.get('/analytics/spending-pattern'),
          api.get('/analytics/subscriptions'),
          api.get('/transactions?type=expense&limit=500&page=1'),
        ]);

        if (healthRes.data?.success) setHealth(healthRes.data.data);
        if (trendRes.data?.success) setMonthlyTrend(trendRes.data.data);
        if (catRes.data?.success) setCategoryBreakdown(catRes.data.data);
        if (patternRes.data?.success) setSpendingPattern(patternRes.data.data);
        if (subRes.data?.success) setSubscriptions(subRes.data.data);

        if (txRes.data?.success) {
          const items = txRes.data.data.items || [];
          const byMood = items.reduce(
            (acc, t) => {
              const key = t.mood || 'neutral';
              if (!acc[key]) acc[key] = 0;
              acc[key] += t.amount;
              return acc;
            },
            { happy: 0, neutral: 0, stressed: 0 }
          );
          setMoodSpending(
            Object.entries(byMood).map(([mood, total]) => ({
              mood: mood.charAt(0).toUpperCase() + mood.slice(1),
              total,
            }))
          );
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const healthScore = health?.score ?? 0;
  const grade = health?.grade ?? '—';

  const monthlyChartData = monthlyTrend
    .map((t) => ({
      label: `${t.month}/${String(t.year).slice(-2)}`,
      income: t.income,
      expense: t.expense,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const categoryData = categoryBreakdown.map((c) => ({
    category: c.category,
    total: c.total,
  }));

  const spendingPatternData = spendingPattern.map((d) => ({
    day: d.day,
    total: d.total,
  }));

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Analytics</h1>
          <p className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
            Your financial health score, patterns, and subscriptions in one view.
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '0.75rem',
            padding: '0.6rem 0.9rem',
            borderRadius: 999,
            background: 'rgba(255, 107, 107, 0.1)',
            color: 'var(--accent-red)',
            fontSize: '0.8rem',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1.6fr',
          gap: '1.25rem',
          marginBottom: '1.25rem',
        }}
      >
        <GlassCard
          style={{
            padding: '1.1rem 1.3rem',
            display: 'flex',
            gap: '1.25rem',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background:
                'conic-gradient(from 220deg, var(--accent-red), var(--accent-blue), var(--accent-teal))',
              position: 'relative',
              boxShadow: '0 0 40px rgba(0,0,0,0.7)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 10,
                borderRadius: '50%',
                background: 'rgba(5,7,19,0.95)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  fontSize: '2.1rem',
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                {loading ? '—' : healthScore}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  color: 'var(--text-muted)',
                  marginTop: '0.2rem',
                }}
              >
                / 100
              </div>
              <div
                style={{
                  marginTop: '0.4rem',
                  fontSize: '0.85rem',
                  color: 'var(--accent-teal)',
                }}
              >
                Grade {grade}
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '0.9rem',
                marginBottom: '0.5rem',
              }}
            >
              Financial Health Score
            </div>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 0 }}>
              Based on savings rate, budget adherence, goal progress, expense stability,
              and emergency buffer.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '0.4rem',
                marginTop: '0.5rem',
                fontSize: '0.78rem',
              }}
            >
              {health &&
                Object.entries(health.breakdown || {}).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">
                      {key
                        .replace(/Score$/i, '')
                        .replace(/([A-Z])/g, ' $1')
                        .trim()}
                    </span>
                    <span>{value}</span>
                  </div>
                ))}
            </div>
          </div>
        </GlassCard>

        <BarChartWrapper
          title="Monthly income vs expense trend"
          data={monthlyChartData}
          dataKeyX="label"
          dataKeyY="expense"
          color="#ff6b6b"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '1.25rem' }}>
        <DonutChartWrapper
          title="Category breakdown"
          data={categoryData}
          dataKeyName="category"
          dataKeyValue="total"
        />

        <BarChartWrapper
          title="Spending by day of week"
          data={spendingPatternData}
          dataKeyX="day"
          dataKeyY="total"
          color="#4f8ef7"
        />

        <GlassCard style={{ padding: '1rem 1.1rem' }}>
          <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Mood vs spending
          </div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.8rem',
            }}
          >
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'left', paddingBottom: '0.4rem' }}>Mood</th>
                <th style={{ textAlign: 'right', paddingBottom: '0.4rem' }}>Total spent</th>
              </tr>
            </thead>
            <tbody>
              {moodSpending.map((m) => (
                <tr key={m.mood}>
                  <td style={{ padding: '0.3rem 0' }}>{m.mood}</td>
                  <td style={{ padding: '0.3rem 0', textAlign: 'right' }}>
                    ₹{m.total.toFixed(0)}
                  </td>
                </tr>
              ))}
              {moodSpending.length === 0 && (
                <tr>
                  <td colSpan="2" className="text-muted" style={{ paddingTop: '0.4rem' }}>
                    Not enough mood data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </GlassCard>
      </div>

      <div style={{ marginTop: '1.4rem' }}>
        <GlassCard style={{ padding: '1rem 1.1rem' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Detected subscriptions
          </div>
          {loading && (
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>
              Analysing recurring expenses...
            </p>
          )}
          {!loading && subscriptions.length === 0 && (
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>
              No clear recurring subscriptions detected yet.
            </p>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.75rem',
              marginTop: '0.5rem',
            }}
          >
            {subscriptions.map((s) => (
              <GlassCard key={s.description} style={{ padding: '0.7rem 0.8rem' }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  {s.description}
                </div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Estimated monthly cost{' '}
                  <span style={{ color: 'var(--accent-blue)' }}>₹{s.estimatedMonthlyCost}</span>
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  {s.occurrences} similar charges detected
                </div>
              </GlassCard>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  );
};

export default AnalyticsPage;

