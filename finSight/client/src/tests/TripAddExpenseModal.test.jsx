import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TripAddExpenseModal from '../components/TripAddExpenseModal.jsx';
import api from '../api/axios.js';

vi.mock('../api/axios.js', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('TripAddExpenseModal Component', () => {
  const mockTrip = {
    _id: 'trip123',
    name: 'Goa Holiday',
    members: [
      { _id: 'm1', name: 'Alice' },
      { _id: 'm2', name: 'Bob' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with trip members when isOpen is true', () => {
    render(
      <TripAddExpenseModal
        isOpen={true}
        onClose={vi.fn()}
        trip={mockTrip}
        onAdded={vi.fn()}
      />
    );

    expect(screen.getByText('Add trip expense')).toBeInTheDocument();
    expect(screen.getByLabelText(/What was it for/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('calculates and displays per-person equal share preview', () => {
    render(
      <TripAddExpenseModal
        isOpen={true}
        onClose={vi.fn()}
        trip={mockTrip}
        onAdded={vi.fn()}
      />
    );

    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '800' } });

    // 800 divided by 2 members = 400 each
    expect(screen.getByText(/₹400 each, split equally/i)).toBeInTheDocument();
  });

  it('submits trip expense to API and invokes onAdded callback', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: { _id: 'exp1', description: 'Dinner', amount: 800 },
      },
    });

    const handleAdded = vi.fn();
    const handleClose = vi.fn();

    render(
      <TripAddExpenseModal
        isOpen={true}
        onClose={handleClose}
        trip={mockTrip}
        onAdded={handleAdded}
      />
    );

    fireEvent.change(screen.getByLabelText(/What was it for/i), { target: { value: 'Dinner' } });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '800' } });

    fireEvent.click(screen.getByRole('button', { name: /Add expense/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/splits/groups/trip123/expenses',
        expect.objectContaining({
          description: 'Dinner',
          amount: 800,
          paidBy: 'm1',
          splitBetween: ['m1', 'm2'],
        })
      );
      expect(handleAdded).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
