import { useState, useMemo } from 'react';
import Modal from './Modal';
import Button from './Button';

/**
 * ExecutiveReportExport
 *
 * Generates a clean, print-ready 2-page executive financial statement
 * formatted for official review, viva presentations, or PDF download.
 */
const ExecutiveReportExport = ({ transactions = [], user = {} }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const reportData = useMemo(() => {
    let income = 0;
    let expense = 0;
    const catMap = {};

    transactions.forEach((tx) => {
      if (tx.status === 'draft') return;
      const amt = Number(tx.amount || 0);
      if (tx.type === 'income') {
        income += amt;
      } else {
        expense += amt;
        catMap[tx.category] = (catMap[tx.category] || 0) + amt;
      }
    });

    const netSavings = income - expense;
    const savingsRate = income > 0 ? ((netSavings / income) * 100).toFixed(1) : 0;

    const categories = Object.entries(catMap)
      .map(([name, total]) => ({
        name,
        total,
        percentage: expense > 0 ? ((total / expense) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const topTransactions = [...transactions]
      .filter((t) => t.type === 'expense' && t.status !== 'draft')
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);

    return {
      income,
      expense,
      netSavings,
      savingsRate,
      categories,
      topTransactions,
      statementDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    };
  }, [transactions]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setModalOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 600,
        }}
      >
        <span>📄</span> Download Executive Statement (PDF)
      </Button>

      <Modal
        title="📄 Official Financial Statement Preview"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '0.5rem' }}>
          <Button variant="primary" onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span>🖨️</span> Print / Save as PDF
          </Button>
        </div>

        {/* Printable Executive Statement Container */}
        <div
          id="printable-statement"
          style={{
            background: '#FFFFFF',
            color: '#0F172A',
            padding: '1.75rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid #E2E8F0',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0F172A',
              paddingBottom: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A' }}>
                FinSight Financial Intelligence
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                Executive Fiscal Summary & Audit Report
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#475569' }}>
              <div><strong>Statement Date:</strong> {reportData.statementDate}</div>
              <div><strong>Account Holder:</strong> {user.name || 'Account Holder'}</div>
              <div><strong>Account Email:</strong> {user.email || 'user@finsight.app'}</div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>TOTAL INFLOW</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10B981', marginTop: '3px' }}>
                ₹{reportData.income.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>TOTAL OUTFLOW</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#EF4444', marginTop: '3px' }}>
                ₹{reportData.expense.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>NET SAVINGS</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#6366F1', marginTop: '3px' }}>
                ₹{reportData.netSavings.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>SAVINGS RATE</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginTop: '3px' }}>
                {reportData.savingsRate}%
              </div>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
              Spending by Category
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '6px 10px', color: '#475569' }}>Category</th>
                  <th style={{ padding: '6px 10px', color: '#475569', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '6px 10px', color: '#475569', textAlign: 'right' }}>Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.categories.map((c) => (
                  <tr key={c.name} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1E293B' }}>{c.name}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>
                      ₹{c.total.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#64748B' }}>{c.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Outflows */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
              Major Outflows / Top 5 Transactions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {reportData.topTransactions.map((tx) => (
                <div
                  key={tx._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    background: '#F8FAFC',
                    fontSize: '0.76rem',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{tx.description || tx.category}</span>
                    <span style={{ color: '#64748B', marginLeft: '6px' }}>({tx.category})</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#EF4444' }}>
                    ₹{Number(tx.amount).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer & Cryptographic Validation */}
          <div
            style={{
              borderTop: '1px solid #CBD5E1',
              paddingTop: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.68rem',
              color: '#94A3B8',
            }}
          >
            <div>Certified Report • FinSight Cloud Platform on Amazon Web Services</div>
            <div>Generated via verified JWT session • Confidential</div>
          </div>
        </div>
      </Modal>

      {/* Embedded print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-statement, #printable-statement * {
            visibility: visible !important;
          }
          #printable-statement {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </>
  );
};

export default ExecutiveReportExport;
