import { Alert, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { getAdminInsights } from '../../api/admin';
import type { AdminInsights } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';

export default function InsightsPanel() {
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminInsights()
      .then(setInsights)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load admin insights'));
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!insights) return <Stack sx={{ alignItems: 'center', py: 4 }}><CircularProgress /></Stack>;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <InsightCard label="Users" value={insights.totalUsers.toString()} />
        <InsightCard label="All expenses" value={insights.totalExpenses.toString()} />
        <InsightCard label="Expense value" value={formatCurrency(insights.totalExpenseValue)} />
        <InsightCard label="Expenses this month" value={insights.expensesThisMonth.toString()} />
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <CategoryList title="Most used categories" categories={insights.topCategories} />
        <CategoryList title="Least used categories" categories={insights.bottomCategories} />
      </Stack>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Recent users</Typography>
        <Stack spacing={1}>
          {insights.recentUsers.map((user) => (
            <Stack key={user.email} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
              <Stack>
                <Typography>{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user.email}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">{formatDate(user.createdAt)}</Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}

function CategoryList({ title, categories }: { title: string; categories: AdminInsights['topCategories'] }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, flex: 1 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Stack spacing={1}>
        {categories.length === 0 ? <Typography color="text.secondary">No categories yet.</Typography> : categories.map((category) => (
          <Stack key={category.categoryId} direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography>{category.name} <Typography component="span" variant="caption" color="text.secondary">({category.count} {category.count === 1 ? 'expense' : 'expenses'})</Typography></Typography>
            <Typography sx={{ fontWeight: 600 }}>{formatCurrency(category.total)}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function InsightCard({ label, value }: { label: string; value: string }) {
  return <Paper variant="outlined" sx={{ p: 2, flex: 1 }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h6" sx={{ mt: 0.5 }}>{value}</Typography></Paper>;
}