import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import type { Expense } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';

export default function ExpenseListItem({ expense }: { expense: Expense }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
          <Stack spacing={0.5}>
            <Typography variant="h6">{expense.title}</Typography>
            <Typography color="text.secondary">{expense.category.name} · {expense.paymentMethod.replace('_', ' ')}</Typography>
            <Typography variant="body2" color="text.secondary">{formatDate(expense.date)}</Typography>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Typography variant="h6">{formatCurrency(expense.amount)}</Typography>
            <Button component={Link} to={`/expenses/${expense._id}`}>View</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}