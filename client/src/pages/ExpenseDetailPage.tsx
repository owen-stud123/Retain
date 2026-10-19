import { Alert, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteExpense, getExpense, updateExpense } from '../api/expenses';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Toast from '../components/common/Toast';
import ExpenseForm from '../components/expenses/ExpenseForm';
import { useCategories } from '../hooks/useCategories';
import type { Expense, ExpenseInput } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

export default function ExpenseDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading } = useCategories();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getExpense(id)
      .then((data) => { if (active) setExpense(data); })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load expense');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleUpdate(input: ExpenseInput) {
    const updated = await updateExpense(id, input);
    setExpense(updated);
    setEditing(false);
    setToastSeverity('success');
    setToast('Expense updated.');
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteExpense(id);
      navigate('/expenses', { replace: true });
    } catch (requestError) {
      setDeleteDialogOpen(false);
      setDeleting(false);
      setToastSeverity('error');
      setToast(requestError instanceof Error ? requestError.message : 'Unable to delete expense');
    }
  }

  if (loading) return <Stack sx={{ alignItems: 'center', py: 8 }}><CircularProgress /></Stack>;
  if (error || !expense) return <Alert severity="error">{error || 'Expense not found.'}</Alert>;

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Expense details</Typography>
      {editing ? (
        <Paper sx={{ p: 3 }}>{categoriesLoading ? <CircularProgress /> : <ExpenseForm expense={expense} categories={categories} onSubmit={handleUpdate} onCancel={() => setEditing(false)} />}</Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h5">{expense.title}</Typography>
            <Typography variant="h4">{formatCurrency(expense.amount)}</Typography>
            <Typography>Date: {formatDate(expense.date)}</Typography>
            <Typography>Category: {expense.category.name}</Typography>
            <Typography>Payment method: {expense.paymentMethod.replaceAll('_', ' ')}</Typography>
            {expense.notes && <Typography>Notes: {expense.notes}</Typography>}
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => setEditing(true)}>Edit</Button>
            <Button color="error" variant="outlined" onClick={() => setDeleteDialogOpen(true)}>Delete</Button>
          </Stack>
        </Paper>
      )}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete expense?"
        message="This action cannot be undone."
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => void handleDelete()}
        confirming={deleting}
      />
      <Toast message={toast} severity={toastSeverity} onClose={() => setToast('')} />
    </Stack>
  );
}