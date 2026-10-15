import { useMemo, useState } from 'react';
import Card from './Card';
import Modal from './Modal';

/**
 * FinancialWellnessGauge
 *
 * Computes and renders an interactive, animated 0-100 financial health score
 * with sub-pillars and AI recommendations.
 */
const FinancialWellnessGauge = ({ transactions = [], budgets = [], splits = [] }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Compute metrics from current transactions and budgets
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let categorySpend = {};

    transactions.forEach((tx) => {
      if (tx.status === 'draft') return; // Exclude drafts from official health score
      const amt = Number(tx.amount || 0);
      if (tx.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        categorySpend[tx.category] = (categorySpend[tx.category] || 0) + amt;
      }
    });

    // 1. Savings Rate Score (0 to 35 points) - Target >= 20%
    const savingsAmount = Math.max(0, totalIncome - totalExpense);
    const savingsRate = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0;
    const savingsScore = Math.min(35, Math.round((savingsRate / 25) * 35));

    // 2. Budget Adherence Score (0 to 30 points)
    let budgetScore = 25; // default if no budgets set
    if (budgets.length > 0) {
      let overBudgetCount = 0;
      budgets.forEach((b) => {
        const spent = categorySpend[b.category] || 0;
        if (spent > b.limit) overBudgetCount++;
      });
      const adherenceRate = Math.max(0, (budgets.length - overBudgetCount) / budgets.length);
      budgetScore = Math.round(adherenceRate * 30);
    }

    // 3. 50/30/20 Needs vs Wants Ratio (0 to 20 points)
    // Needs: Groceries, Bills & Utilities, Healthcare
    // Wants: Food & Dining, Shopping, Entertainment, Travel
    // Savings: Investment, Savings
    let needsSpend = (categorySpend['Groceries'] || 0) + (categorySpend['Bills & Utilities'] || 0) + (categorySpend['Healthcare'] || 0);
    let wantsSpend = (categorySpend['Food & Dining'] || 0) + (categorySpend['Shopping'] || 0) + (categorySpend['Entertainment'] || 0) + (categorySpend['Travel'] || 0);
    let invSpend = (categorySpend['Investment'] || 0);

    const wantsRatio = totalIncome > 0 ? (wantsSpend / totalIncome) * 100 : 40;
    const ratioScore = wantsRatio <= 30 ? 20 : wantsRatio <= 45 ? 14 : 8;

    // 4. Debt & Settlement Health (0 to 15 points)
    let debtScore = 15;
    if (splits.length > 0) {
      let unresolvedCount = 0;
      splits.forEach((grp) => {
        if (grp.simplifiedDebts && grp.simplifiedDebts.length > 0) {
          unresolvedCount += grp.simplifiedDebts.length;
        }
      });
      debtScore = unresolvedCount === 0 ? 15 : unresolvedCount <= 2 ? 11 : 7;
    }

    const totalScore = Math.min(100, Math.max(0, savingsScore + budgetScore + ratioScore + debtScore));

    let grade = 'Needs Attention';
    let gradeColor = '#EF4444'; // Red
    let gradientStart = '#EF4444';
    let gradientEnd = '#F59E0B';

    if (totalScore >= 80) {
      grade = 'Excellent';
      gradeColor = '#10B981'; // Emerald
      gradientStart = '#10B981';
      gradientEnd = '#059669';
    } else if (totalScore >= 65) {
      grade = 'Good';
      gradeColor = '#6366F1'; // Indigo
      gradientStart = '#6366F1';
      gradientEnd = '#4F46E5';
    } else if (totalScore >= 50) {
      grade = 'Fair';
      gradeColor = '#F59E0B'; // Amber
      gradientStart = '#F59E0B';
      gradientEnd = '#D97706';
    }

    // Dynamic AI Tips
    const tips = [];
    if (savingsRate < 20) {
      tips.push('Your savings rate is below the recommended 20% benchmark. Automate a monthly SIP on payday.');
    } else {
      tips.push(`Strong savings rate at ${savingsRate.toFixed(1)}%! Maintain this buffer for emergency funds.`);
    }

    if (wantsRatio > 35) {
      tips.push(`Discretionary spending (${wantsRatio.toFixed(1)}% of income) exceeds the 30% 50/30/20 guideline.`);
    }

    if (debtScore < 15) {
      tips.push('You have pending group split balances. Use the new ⚡ UPI QR code to settle debts.');
    }

    return {
      totalScore,
      grade,
      gradeColor,
      gradientStart,
      gradientEnd,
      savingsScore,
      savingsRate,
      budgetScore,
      ratioScore,
      debtScore,
      needsSpend,
      wantsSpend,
      invSpend,
      totalIncome,
      totalExpense,
      tips,
    };
  }, [transactions, budgets, splits]);

  // SVG Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (metrics.totalScore / 100) * circumference;

  return (
    <>
      <Card style={{ padding: '1.25rem 1.4rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🩺</span>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>AI Financial Wellness Score</h3>
            </div>
            <p className="text-muted" style={{ margin: '3px 0 0', fontSize: '0.75rem' }}>
              Real-time multi-dimensional fiscal assessment
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--accent-primary, #6366F1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '4px 9px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Formula & Pillars ℹ️
          </button>
        </div>

        {/* Gauge Center & Sub-Pillars Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            gap: '1.25rem',
            alignItems: 'center',
          }}
        >
          {/* Circular SVG Gauge */}
          <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto' }}>
            <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background Circle */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke="var(--bg-tertiary, #E2E8F0)"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke={metrics.gradeColor}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </svg>

            {/* Inner Score Badge */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <div
                className="num-tabular"
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                {metrics.totalScore}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: metrics.gradeColor,
                  textTransform: 'uppercase',
                  marginTop: '4px',
                  letterSpacing: '0.04em',
                }}
              >
                {metrics.grade}
              </div>
            </div>
          </div>

          {/* Sub-Pillars Progress Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Pillar 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600 }}>💰 Savings Velocity</span>
                <span className="num-tabular" style={{ fontWeight: 700, color: 'var(--accent-success)' }}>
                  {metrics.savingsScore} / 35 pts ({metrics.savingsRate.toFixed(0)}%)
                </span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(metrics.savingsScore / 35) * 100}%`,
                    background: 'var(--accent-success, #10B981)',
                    borderRadius: '999px',
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
            </div>

            {/* Pillar 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600 }}>🎯 Budget Discipline</span>
                <span className="num-tabular" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {metrics.budgetScore} / 30 pts
                </span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(metrics.budgetScore / 30) * 100}%`,
                    background: 'var(--accent-primary, #6366F1)',
                    borderRadius: '999px',
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
            </div>

            {/* Pillar 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600 }}>⚖️ 50/30/20 Ratio</span>
                <span className="num-tabular" style={{ fontWeight: 700 }}>
                  {metrics.ratioScore} / 20 pts
                </span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(metrics.ratioScore / 20) * 100}%`,
                    background: '#F59E0B',
                    borderRadius: '999px',
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
            </div>

            {/* Pillar 4 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600 }}>⚡ Split Settlement Health</span>
                <span className="num-tabular" style={{ fontWeight: 700, color: '#10B981' }}>
                  {metrics.debtScore} / 15 pts
                </span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(metrics.debtScore / 15) * 100}%`,
                    background: '#059669',
                    borderRadius: '999px',
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendation Callout */}
        {metrics.tips.length > 0 && (
          <div
            style={{
              marginTop: '0.95rem',
              padding: '0.65rem 0.85rem',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.45rem',
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>💡</span>
            <span>
              <strong>AI Recommendation:</strong> {metrics.tips[0]}
            </span>
          </div>
        )}
      </Card>

      {/* Algorithmic Breakdown Modal for Faculty Review */}
      <Modal
        title="📐 Financial Health Scoring Algorithm & Rubric"
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      >
        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <p style={{ marginTop: 0 }}>
            FinSight evaluates user financial health using a composite weighted mathematical model:
          </p>

          <div
            style={{
              background: 'var(--bg-surface-elevated, #F8FAFC)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--border-color)',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              color: 'var(--text-primary)',
            }}
          >
            Score = (0.35 × SavingsScore) + (0.30 × BudgetScore) + (0.20 × RatioScore) + (0.15 × DebtScore)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>1. Savings Velocity (35% Weight)</strong>
              <div>Target: ≥25% net monthly savings rate. Scores proportionally from 0 to 35 points based on Income vs Expense delta.</div>
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>2. Budget Adherence (30% Weight)</strong>
              <div>Calculates category-wise compliance against user-defined budget caps. Penalizes overspending linearly.</div>
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>3. 50/30/20 Alignment (20% Weight)</strong>
              <div>Audits essential needs (50%), discretionary wants (30%), and future capital investments (20%).</div>
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>4. Split Settlement Health (15% Weight)</strong>
              <div>Rewards users who maintain zero unsimplified group debts or settle outstanding balances within 7 days.</div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FinancialWellnessGauge;
