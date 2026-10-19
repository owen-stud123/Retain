import { Alert, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { getDashboard } from '../api/dashboard';
import { updateBudget } from '../api/budgets';
import BudgetCard from '../components/budget/BudgetCard';
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown';
import RecentExpenses from '../components/dashboard/RecentExpenses';
import StatCard from '../components/dashboard/StatCard';
import Toast from '../components/common/Toast';
import type { DashboardData } from '../types';
import { currentMonthValue, formatCurrency, formatDate } from '../utils/format';

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonthValue);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDashboard(month)
      .then((data) => {
        if (active) {
          setDashboard(data);
          setError('');
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [month]);

  async function handleSaveBudget(amount: number) {
    if (!dashboard) return;
    const budget = await updateBudget(month, amount);
    setDashboard({ ...dashboard, budget });
    setToast('Budget saved.');
  }

  if (loading && !dashboard) return <Stack sx={{ alignItems: 'center', py: 8 }}><CircularProgress /></Stack>;
  if (error && !dashboard) return <Alert severity="error">{error}</Alert>;
  if (!dashboard) return <Alert severity="error">Dashboard data is unavailable.</Alert>;

  const remaining = dashboard.budget.amount > 0 ? dashboard.budget.remaining : 0;
  const highest = dashboard.highestExpense;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Stack>
          <Typography variant="overline" color="primary">Your money, in focus</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Dashboard</Typography>
        </Stack>
        <TextField label="Month" type="month" value={month} onChange={(event) => { if (event.target.value) setMonth(event.target.value); }} size="small" slotProps={{ inputLabel: { shrink: true } }} />
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <StatCard label="Total spent" value={formatCurrency(dashboard.totalSpent)} detail={`For ${month}`} />
        <StatCard label="Budget remaining" value={formatCurrency(remaining)} detail={dashboard.budget.amount > 0 ? `${dashboard.budget.percentUsed.toFixed(0)}% of budget used` : 'Set a budget below'} />
        <StatCard label="Highest expense" value={highest ? formatCurrency(highest.amount) : formatCurrency(0)} detail={highest ? `${highest.title} · ${formatDate(highest.date)}` : 'No expenses yet'} />
      </Stack>
      <BudgetCard budget={dashboard.budget} onSave={handleSaveBudget} />
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Stack sx={{ flex: 1 }}><CategoryBreakdown categories={dashboard.byCategory} /></Stack>
        <Stack sx={{ flex: 1 }}><RecentExpenses expenses={dashboard.recentExpenses} /></Stack>
      </Stack>
      <Toast message={toast} onClose={() => setToast('')} />
    </Stack>
  );
}