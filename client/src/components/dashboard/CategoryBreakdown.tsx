import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { formatCurrency } from '../../utils/format';
import type { DashboardData } from '../../types';

export default function CategoryBreakdown({ categories }: { categories: DashboardData['byCategory'] }) {
  const largest = categories[0]?.total || 1;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Spending by category</Typography>
      {categories.length === 0 ? (
        <Typography color="text.secondary">No spending recorded for this month.</Typography>
      ) : (
        <Stack spacing={2}>
          {categories.map((category) => (
            <Box key={category.categoryId}>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }} spacing={2}>
                <Typography>{category.name}</Typography>
                <Typography sx={{ fontWeight: 600 }}>{formatCurrency(category.total)}</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={(category.total / largest) * 100} sx={{ mt: 0.75, height: 7, borderRadius: 4 }} />
              <Typography variant="caption" color="text.secondary">{category.count} {category.count === 1 ? 'expense' : 'expenses'}</Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}