import { Alert, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import type { Category, Expense, ExpenseInput, PaymentMethod } from '../../types';
import { dateInputToUtc, toDateInputValue } from '../../utils/format';

const methods: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'other', label: 'Other' }
];

interface ExpenseFormProps {
  categories: Category[];
  expense?: Expense;
  onSubmit: (input: ExpenseInput) => Promise<void>;
  onCancel?: () => void;
}

export default function ExpenseForm({ categories, expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [title, setTitle] = useState(expense?.title || '');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [category, setCategory] = useState(expense?.category._id || '');
  const [date, setDate] = useState(expense ? toDateInputValue(expense.date) : new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(expense?.paymentMethod || 'cash');
  const [notes, setNotes] = useState(expense?.notes || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!category) {
      setError('Choose a category.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), amount: Number(amount), category, date: dateInputToUtc(date), paymentMethod, notes: notes.trim() || undefined });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save expense');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required slotProps={{ htmlInput: { maxLength: 120 } }} />
      <TextField label="Amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} required slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }} />
      <TextField select label="Category" value={category} onChange={(event) => setCategory(event.target.value)} required>
        {categories.map((item) => <MenuItem key={item._id} value={item._id}>{item.name}</MenuItem>)}
      </TextField>
      <TextField label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required slotProps={{ inputLabel: { shrink: true } }} />
      <TextField select label="Payment method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} required>
        {methods.map((method) => <MenuItem key={method.value} value={method.value}>{method.label}</MenuItem>)}
      </TextField>
      <TextField label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} multiline minRows={3} />
      <Stack direction="row" spacing={2}>
        {onCancel && <Button onClick={onCancel} disabled={submitting}>Cancel</Button>}
        <Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Saving...' : expense ? 'Update expense' : 'Add expense'}</Button>
      </Stack>
    </Stack>
  );
}