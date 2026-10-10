import { Alert, Button, LinearProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Budget } from '../../types';
import { formatCurrency } from '../../utils/format';

interface BudgetCardProps {
  budget: Budget;
  onSave: (amount: number) => Promise<void>;
}

const statusLabel: Record<Budget['status'], string> = {
  within: 'On track',
  approaching: 'Approaching limit',
  over: 'Over budget'
};

export default function BudgetCard({ budget, onSave }: BudgetCardProps) {
  const [amount, setAmount] = useState(String(budget.amount || ''));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAmount(String(budget.amount || ''));
  }, [budget.amount]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      setError('Enter a budget of zero or more.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSave(value);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save budget');
    } finally {
      setSaving(false);
    }
  }

  const progress = Math.min(Math.max(budget.percentUsed, 0), 100);
  const tone = budget.status === 'over' ? 'error' : budget.status === 'approaching' ? 'warning' : 'success';

  return (
    <Paper variant="outlined" sx={{ p: 3, borderTop: 4, borderColor: `${tone}.main` }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
          <BoxedBudgetTitle status={statusLabel[budget.status]} />
          <Typography color={`${tone}.main`} sx={{ fontWeight: 700 }}>{statusLabel[budget.status]}</Typography>
        </Stack>
        <LinearProgress color={tone} variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
        <Stack direction="row" sx={{ justifyContent: 'space-between' }} spacing={2}>
          <Typography variant="body2">{formatCurrency(budget.spent)} spent</Typography>
          <Typography variant="body2">{budget.amount > 0 ? `${budget.percentUsed.toFixed(0)}% used` : 'No limit set'}</Typography>
          <Typography variant="body2">{formatCurrency(Math.max(budget.remaining, 0))} left</Typography>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={2} onSubmit={handleSubmit}>
          <TextField label="Monthly budget" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} size="small" fullWidth slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save budget'}</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function BoxedBudgetTitle({ status }: { status: string }) {
  return (
    <Stack>
      <Typography variant="h6">Monthly budget</Typography>
      <Typography variant="body2" color="text.secondary">{status} for the selected month</Typography>
    </Stack>
  );
}