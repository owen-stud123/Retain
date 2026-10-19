import { Alert, Button, CircularProgress, Pagination, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ExpenseFilters from '../components/expenses/ExpenseFilters';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseListItem from '../components/expenses/ExpenseListItem';
import Toast from '../components/common/Toast';
import { createExpense } from '../api/expenses';
import { useCategories } from '../hooks/useCategories';
import { fetchExpenses } from '../store/expensesSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPage } from '../store/filtersSlice';
import type { ExpenseFilters as ExpenseFilterState } from '../store/filtersSlice';
import type { ExpenseInput } from '../types';

export default function ExpensesPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);
  const expenses = useAppSelector((state) => state.expenses);
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    void dispatch(fetchExpenses());
  }, [dispatch, filters]);

  // If the current page no longer exists (e.g. the last item on the last page was deleted),
  // move to the last page that does.
  useEffect(() => {
    if (!expenses.loading && !expenses.error && expenses.pages > 0 && filters.page > expenses.pages) {
      dispatch(setPage(expenses.pages));
    }
  }, [dispatch, expenses.error, expenses.loading, expenses.pages, filters.page]);

  const filterKeys: Array<keyof ExpenseFilterState> = ['search', 'category', 'paymentMethod', 'startDate', 'endDate', 'minAmount', 'maxAmount'];
  const hasActiveFilters = filterKeys.some((key) => filters[key] !== '');

  async function handleCreate(input: ExpenseInput) {
    await createExpense(input);
    setShowForm(false);
    setToast('Expense created.');
    await dispatch(fetchExpenses()).unwrap();
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h4">Expenses</Typography>
        <Button variant="contained" onClick={() => setShowForm((value) => !value)}>{showForm ? 'Close form' : 'Add expense'}</Button>
      </Stack>
      {showForm && <Paper sx={{ p: 3 }}><Typography variant="h6" gutterBottom>Add expense</Typography>{categoriesLoading ? <CircularProgress /> : <ExpenseForm categories={categories} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}</Paper>}
      {categoriesError && <Alert severity="error">{categoriesError}</Alert>}
      <ExpenseFilters categories={categories} />
      {expenses.loading && <Stack sx={{ alignItems: 'center' }}><CircularProgress /></Stack>}
      {expenses.error && <Alert severity="error">{expenses.error}</Alert>}
      {!expenses.loading && !expenses.error && expenses.items.length === 0 && <Paper sx={{ p: 4, textAlign: 'center' }}><Typography>{hasActiveFilters ? 'No expenses match your filters.' : 'No expenses yet. Use "Add expense" to record your first one.'}</Typography></Paper>}
      <Stack spacing={2}>{expenses.items.map((expense) => <ExpenseListItem key={expense._id} expense={expense} />)}</Stack>
      {expenses.pages > 1 && <Pagination count={expenses.pages} page={filters.page} onChange={(_, page) => dispatch(setPage(page))} color="primary" sx={{ alignSelf: 'center' }} />}
      {expenses.total > 0 && (
        <Typography variant="body2" color="text.secondary">
          Showing {(expenses.page - 1) * expenses.limit + 1}–{(expenses.page - 1) * expenses.limit + expenses.items.length} of {expenses.total} expenses
        </Typography>
      )}
      <Button component={Link} to="/" sx={{ alignSelf: 'flex-start' }}>Back to dashboard</Button>
      <Toast message={toast} onClose={() => setToast('')} />
    </Stack>
  );
}