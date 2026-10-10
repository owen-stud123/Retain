import { Button, Paper, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import type { Expense } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';

export default function RecentExpenses({ expenses }: { expenses: Expense[] }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }} spacing={2}>
        <Typography variant="h6">Recent expenses</Typography>
        <Button component={Link} to="/expenses" size="small">View all</Button>
      </Stack>
      {expenses.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>Your recent expenses will appear here.</Typography>
      ) : (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {expenses.map((expense) => (
            <Stack key={expense._id} direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <BoxedExpense expense={expense} />
              <Typography sx={{ fontWeight: 600 }}>{formatCurrency(expense.amount)}</Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function BoxedExpense({ expense }: { expense: Expense }) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Typography component={Link} to={`/expenses/${expense._id}`} sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {expense.title}
      </Typography>
      <Typography variant="caption" color="text.secondary">{expense.category.name} · {formatDate(expense.date)}</Typography>
    </Stack>
  );
}