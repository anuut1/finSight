import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import Modal from './Modal';
import Button from './Button';
import useReceiptScan from '../hooks/useReceiptScan';
import { reencodeImageToJpeg } from '../utils/receiptImage';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * One-step "Add expense" for an active trip.
 * Defaults: paid by the host, split equally among everyone. Just type what and how much.
 * Supports receipt photo/image attachment with automatic Textract OCR extraction and graceful fallback.
 */
const TripAddExpenseModal = ({ isOpen, onClose, trip, symbol = '₹', onAdded }) => {
  const members = trip?.members || [];
  const [splitMode, setSplitMode] = useState('pick'); // 'pick' | 'poll' | 'items'
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [paidBy, setPaidBy] = useState('');
  const [splitBetween, setSplitBetween] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Receipt attachment & OCR state
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
  const [receiptKey, setReceiptKey] = useState('');
  const [extractedItems, setExtractedItems] = useState([]);
  const [scanSummary, setScanSummary] = useState(null);
  const [scanFailed, setScanFailed] = useState(false);

  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  const {
    scanning,
    uploadProgress,
    scanReceipt,
    reset: resetScan,
  } = useReceiptScan({ tripId: trip?._id });

  const handleRemoveReceipt = () => {
    if (receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl);
    }
    setReceiptFile(null);
    setReceiptPreviewUrl('');
    setReceiptKey('');
    setExtractedItems([]);
    setScanSummary(null);
    setScanFailed(false);
    resetScan();
    if (splitMode === 'items') {
      setSplitMode('pick');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      handleRemoveReceipt();
      return;
    }
    const ids = (trip?.members || []).map((m) => m._id);
    setSplitMode('pick');
    setDescription('');
    setAmount('');
    setDate(today());
    setPaidBy(ids[0] || '');
    setSplitBetween(ids);
    setError('');
  }, [isOpen, trip?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReceiptSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset native input so the user can re-select the same file if needed
    e.target.value = '';

    setScanFailed(false);
    resetScan();

    try {
      const prepared = await reencodeImageToJpeg(file);
      setReceiptFile(prepared);
      const preview = URL.createObjectURL(prepared);
      setReceiptPreviewUrl(preview);

      const res = await scanReceipt(prepared, { tripId: trip?._id, previewUrl: preview });
      if (res) {
        if (res.receiptKey) {
          setReceiptKey(res.receiptKey);
        }
        if (res.merchant) {
          setDescription((prev) => (prev.trim() ? prev : res.merchant));
        }
        if (res.amount !== undefined && res.amount !== null) {
          setAmount(String(res.amount));
        }
        if (res.date) {
          setDate(res.date);
        }
        if (Array.isArray(res.items) && res.items.length > 0) {
          setExtractedItems(res.items);
        }
        setScanSummary({
          itemsCount: (res.items || []).length,
          tax: res.tax || 0,
          total: res.total !== undefined ? res.total : res.amount || 0,
          mismatch: Boolean(res.mismatch),
        });
      } else {
        setScanFailed(true);
      }
    } catch {
      setScanFailed(true);
    }
  };

  const toggle = (id) =>
    setSplitBetween((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allSelected = members.length > 0 && splitBetween.length === members.length;
  const share = splitBetween.length && Number(amount) > 0 ? Number(amount) / splitBetween.length : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return setError('Add a short description, e.g. "Lunch".');
    if (!(Number(amount) > 0)) return setError('Enter a valid amount.');
    setSaving(true);
    setError('');

    try {
      if (splitMode === 'poll') {
        const draftRes = await api.post(`/splits/groups/${trip._id}/upi-drafts`, {
          amount: Number(amount),
          merchant: description.trim(),
          category: 'Shared',
          date: date || today(),
          receiptKey: receiptKey || undefined,
        });
        if (draftRes.data?.data?._id) {
          await api.post(`/splits/groups/${trip._id}/upi-drafts/${draftRes.data.data._id}/assign`, {
            mode: 'poll',
            paidBy,
            question: `Did you share the expense of ${symbol}${amount} for ${description.trim()}?`,
          });
        }
        if (onAdded) onAdded(draftRes.data?.data);
        onClose();
      } else {
        if (!splitBetween.length) return setError('Pick at least one person to split with.');
        const res = await api.post(`/splits/groups/${trip._id}/expenses`, {
          description: description.trim(),
          amount: Number(amount),
          paidBy,
          splitBetween,
          date: date || today(),
          category: 'Shared',
          syncPersonal: true,
          receiptKey: receiptKey || undefined,
        });
        if (res.data?.success) {
          if (onAdded) onAdded(res.data.data);
          onClose();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add the expense.');
    } finally {
      setSaving(false);
    }
  };

  const field = { display: 'flex', flexDirection: 'column', gap: '6px' };
  const label = { fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' };

  return (
    <Modal title="Add trip expense" isOpen={isOpen} onClose={() => !saving && onClose()}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Segmented Control: Pick people vs Ask everyone vs By items */}
        <div
          style={{
            display: 'flex',
            borderRadius: 'var(--radius-md, 8px)',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface-elevated, rgba(255,255,255,0.03))',
          }}
        >
          <button
            type="button"
            onClick={() => setSplitMode('pick')}
            style={{
              flex: 1,
              padding: '7px 8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              background: splitMode === 'pick' ? 'var(--accent-primary, #6366F1)' : 'transparent',
              color: splitMode === 'pick' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            👥 Pick people
          </button>
          <button
            type="button"
            onClick={() => setSplitMode('poll')}
            style={{
              flex: 1,
              padding: '7px 8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              background: splitMode === 'poll' ? 'var(--accent-primary, #6366F1)' : 'transparent',
              color: splitMode === 'poll' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            📊 Ask everyone (Poll)
          </button>
          <button
            type="button"
            onClick={() => setSplitMode('items')}
            disabled={extractedItems.length === 0}
            title={extractedItems.length > 0 ? 'Split items individually' : 'Attach a receipt with items to split by item'}
            style={{
              flex: 1,
              padding: '7px 8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              background: splitMode === 'items' ? 'var(--accent-primary, #6366F1)' : 'transparent',
              color:
                splitMode === 'items'
                  ? '#fff'
                  : extractedItems.length === 0
                  ? 'var(--text-muted, #64748b)'
                  : 'var(--text-secondary)',
              cursor: extractedItems.length === 0 ? 'not-allowed' : 'pointer',
              opacity: extractedItems.length === 0 ? 0.5 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            🧾 By items
          </button>
        </div>

        {/* Add receipt row (top of modal above "What was it for?") */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={label}>Receipt</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
              Receipt available for 30 days
            </span>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleReceiptSelect}
            aria-label="Take photo of receipt"
          />
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
            onChange={handleReceiptSelect}
            aria-label="Upload receipt image"
          />

          {!receiptFile ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                aria-label="Take photo"
              >
                📷 Take photo
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => uploadInputRef.current?.click()}
                aria-label="Upload image"
              >
                📁 Upload image
              </Button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface-elevated, rgba(255,255,255,0.03))',
              }}
            >
              <img
                src={receiptPreviewUrl}
                alt="Receipt thumbnail"
                style={{
                  width: 44,
                  height: 44,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: '1px solid var(--border-color)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {receiptFile.name}
                </div>
                {scanning ? (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--accent-primary, #6366F1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>Scanning…</span>
                    {uploadProgress > 0 && <span>({uploadProgress}%)</span>}
                  </div>
                ) : scanFailed ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.25 }}>
                    Couldn't read the receipt. You can still attach it and enter the amount yourself.
                  </div>
                ) : scanSummary ? (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>
                      {scanSummary.itemsCount} items found · tax {symbol}
                      {scanSummary.tax} · total {symbol}
                      {scanSummary.total}
                    </span>
                    {scanSummary.mismatch && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: 'var(--color-warning, #f59e0b)',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        ⚠️ Check totals
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveReceipt}
                aria-label="Remove receipt"
              >
                Remove
              </Button>
            </div>
          )}
        </div>

        <div style={field}>
          <label htmlFor="trip-exp-desc" style={label}>
            What was it for?
          </label>
          <input
            id="trip-exp-desc"
            className="form-input"
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Lunch"
          />
        </div>
        <div style={field}>
          <label htmlFor="trip-exp-amt" style={label}>
            Amount ({symbol})
          </label>
          <input
            id="trip-exp-amt"
            className="form-input"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="600"
          />
        </div>
        <div style={field}>
          <label htmlFor="trip-exp-date" style={label}>
            Date
          </label>
          <input
            id="trip-exp-date"
            className="form-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div style={field}>
          <label htmlFor="trip-exp-paid" style={label}>
            Paid by
          </label>
          <select id="trip-exp-paid" className="form-input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {splitMode === 'pick' && (
          <div style={field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={label}>Split between</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSplitBetween(allSelected ? [] : members.map((m) => m._id))}
              >
                {allSelected ? 'Clear' : 'Select all'}
              </Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {members.map((m) => {
                const on = splitBetween.includes(m._id);
                return (
                  <Button
                    key={m._id}
                    type="button"
                    size="sm"
                    variant={on ? 'primary' : 'secondary'}
                    aria-pressed={on}
                    onClick={() => toggle(m._id)}
                  >
                    {on ? '✓ ' : ''}
                    {m.name}
                  </Button>
                );
              })}
            </div>
            {share > 0 && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {symbol}
                {share.toLocaleString(undefined, { maximumFractionDigits: 2 })} each, split equally
              </span>
            )}
          </div>
        )}

        {splitMode === 'poll' && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md, 8px)',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary, #6366F1)' }}>
              📊 Opt-in Poll Mode
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Everyone in the group will be polled: <strong>"I was part of this"</strong> or <strong>"Not me"</strong>.
              The total will be split down to the exact integer paise among members who join.
            </div>
          </div>
        )}

        {splitMode === 'items' && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md, 8px)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-success, #10B981)' }}>
              🧾 Split By Items Mode
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {extractedItems.length} items extracted from receipt. You will be able to review line items, tax, and service charges before publishing the claim screen to members.
            </div>
          </div>
        )}

        {error && (
          <div role="alert" style={{ fontSize: '0.85rem', color: 'var(--color-warning)' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {splitMode === 'poll' ? 'Start Poll' : splitMode === 'items' ? 'Continue with items' : 'Add expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TripAddExpenseModal;
