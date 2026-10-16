import { Stack, Typography } from '@mui/material';
import CategoryManager from '../components/admin/CategoryManager';
import InsightsPanel from '../components/admin/InsightsPanel';

export default function AdminPage() {
  return (
    <Stack spacing={3}>
      <Stack>
        <Typography variant="overline" color="primary">Retain administration</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Admin</Typography>
      </Stack>
      <InsightsPanel />
      <CategoryManager />
    </Stack>
  );
}