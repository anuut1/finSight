import { useState, useRef } from 'react';
import api from '../api/axios';

const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Shopping',
  'Travel',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Personal Care',
  'Other',
];

const ReceiptScannerBox = ({ onTransactionCreated, compact = false }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, or WebP).');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setError('');
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    setDraft(null);
    setSuccess(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const syntheticEvent = { target: { files: [droppedFile] } };
      handleFileChange(syntheticEvent);
    }
  };

  // Helper to generate a sample cafe receipt on a virtual canvas for instant testing
  const handleUseSampleReceipt = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');

    // Draw receipt styling
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 500);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STARBUCKS COFFEE', 200, 45);

    ctx.font = '13px monospace';
    ctx.fillText('Store #1042 - Indiranagar', 200, 70);
    ctx.fillText('Bengaluru, Karnataka', 200, 90);
    ctx.fillText('Date: 03-Oct-2026 14:32', 200, 115);

    ctx.fillText('-----------------------------------', 200, 140);
    ctx.textAlign = 'left';
    ctx.fillText('1x Caffè Mocha (Grande)', 30, 175);
    ctx.textAlign = 'right';
    ctx.fillText('₹345.00', 370, 175);

    ctx.textAlign = 'left';
    ctx.fillText('1x Blueberry Muffin', 30, 205);
    ctx.textAlign = 'right';
    ctx.fillText('₹220.00', 370, 205);

    ctx.textAlign = 'left';
    ctx.fillText('CGST (2.5%) + SGST (2.5%)', 30, 235);
    ctx.textAlign = 'right';
    ctx.fillText('₹28.25', 370, 235);

    ctx.textAlign = 'center';
    ctx.fillText('-----------------------------------', 200, 265);

    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL AMOUNT', 30, 305);
    ctx.textAlign = 'right';
    ctx.fillText('₹593.25', 370, 305);

    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Payment: Paid via UPI (Auth #99281)', 200, 360);
    ctx.fillText('THANK YOU FOR VISITING!', 200, 400);

    canvas.toBlob((blob) => {
      if (blob) {
        const sampleFile = new File([blob], 'sample-starbucks-receipt.png', { type: 'image/png' });
        const syntheticEvent = { target: { files: [sampleFile] } };
        handleFileChange(syntheticEvent);
      }
    }, 'image/png');
  };

  const handleScanReceipt = async () => {
    if (!file) {
      setError('Please select or drop a receipt image first.');
      return;
    }

    setScanning(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const res = await api.post('/transactions/receipt/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setDraft({
          type: 'expense',
          amount: d.amount || 0,
          category: d.category || 'Food & Dining',
          date: d.date || new Date().toISOString().slice(0, 10),
          description: d.merchant || 'Receipt Expense',
          lineItems: Array.isArray(d.lineItems) ? d.lineItems : [],
          source: d.source || 'aws-textract',
          note: d.note || '',
        });
      } else {
        setError('Could not extract details from receipt image.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Receipt scan request failed.');
    } finally {
      setScanning(false);
    }
  };

  const handleDraftChange = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDiscard = () => {
    setDraft(null);
    setFile(null);
    setPreviewUrl('');
    setError('');
    setSuccess(false);
  };

  const handleConfirmAndSave = async (asDraft = false) => {
    if (!draft) return;
    if (!draft.amount || Number(draft.amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        type: 'expense',
        category: draft.category,
        amount: Number(draft.amount),
        description: draft.description,
        date: draft.date,
        tags: ['receipt', 'aws-textract'],
        mood: 'neutral',
        isDraft: asDraft,
        status: asDraft ? 'draft' : 'confirmed',
      };

      const res = await api.post('/transactions', payload);
      if (res.data?.success) {
        setSuccess(true);
        setDraft(null);
        setFile(null);
        setPreviewUrl('');
        if (onTransactionCreated) {
          onTransactionCreated(res.data.data);
        }
        setTimeout(() => setSuccess(false), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: compact ? 'transparent' : 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        padding: compact ? '0' : '1.25rem',
        border: compact ? 'none' : '1px solid var(--border-color)',
        marginBottom: compact ? '0' : '1.25rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🧾</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Receipt Scanner
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--accent-warning, #f59e0b)',
              fontWeight: 600,
            }}
          >
            AWS Textract
          </span>
        </div>
        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
          Never saved without confirmation
        </span>
      </div>

      {/* Upload Dropzone */}
      {!draft && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(82, 85, 119, 0.04)',
            transition: 'border-color 0.2s ease',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {previewUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <img
                src={previewUrl}
                alt="Receipt preview"
                style={{
                  maxHeight: '160px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border-color)',
                }}
              />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {file?.name} ({(file.size / 1024).toFixed(0)} KB)
              </span>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                Click to change image or scan below
              </span>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📸</div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                Drag & drop your receipt photo here, or browse
              </div>
              <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                Supports JPG, PNG, WebP up to 5MB
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls & Sample Button */}
      {!draft && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={handleUseSampleReceipt}
            style={{
              background: 'rgba(82, 85, 119, 0.1)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              padding: '3px 12px',
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            ⚡ Try with Sample Receipt
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleScanReceipt}
            disabled={scanning || !file}
            style={{ padding: '6px 20px', fontSize: '0.82rem' }}
          >
            {scanning ? 'Analyzing with Textract...' : '🔍 Scan Receipt'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--accent-danger)',
            fontSize: '0.8rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-success)',
            fontSize: '0.82rem',
          }}
        >
          ✅ Receipt expense confirmed and saved!
        </div>
      )}

      {/* ======================================================== */}
      {/* EDITABLE CONFIRMATION CARD (Never save without confirm)  */}
      {/* ======================================================== */}
      {draft && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--accent-primary-light)',
            background: 'var(--bg-primary)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--divider-color)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Review & Confirm Receipt Details
              </div>
              <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                Extracted via AWS Textract AnalyzeExpense • Verify fields before saving
              </div>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-warning)',
              }}
            >
              {draft.source}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                TOTAL AMOUNT (₹)
              </label>
              <input
                type="number"
                step="any"
                className="input-glass"
                value={draft.amount}
                onChange={(e) => handleDraftChange('amount', e.target.value)}
                style={{ fontWeight: 700, fontSize: '1.05rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                MERCHANT / VENDOR
              </label>
              <input
                type="text"
                className="input-glass"
                value={draft.description}
                onChange={(e) => handleDraftChange('description', e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                CATEGORY
              </label>
              <select
                className="input-glass"
                value={draft.category}
                onChange={(e) => handleDraftChange('category', e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                RECEIPT DATE
              </label>
              <input
                type="date"
                className="input-glass"
                value={draft.date}
                onChange={(e) => handleDraftChange('date', e.target.value)}
              />
            </div>
          </div>

          {/* Line items if detected by Textract */}
          {draft.lineItems?.length > 0 && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                DETECTED LINE ITEMS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {draft.lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>• {item.description}</span>
                    <span>₹{item.price?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.65rem',
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--divider-color)',
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDiscard}
              disabled={saving}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              Discard
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleConfirmAndSave(true)}
              disabled={saving || !draft.amount || Number(draft.amount) <= 0}
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderColor: '#6366F1',
                color: '#A5B4FC',
              }}
            >
              💾 Save as Draft
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleConfirmAndSave(false)}
              disabled={saving || !draft.amount || Number(draft.amount) <= 0}
              style={{ fontSize: '0.82rem', padding: '7px 22px', fontWeight: 700 }}
            >
              {saving ? 'Saving...' : '✓ Confirm & Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptScannerBox;
