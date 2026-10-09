import { Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Stack spacing={2} sx={{ alignItems: 'center' }}>
      <Typography variant="h4">Page not found</Typography>
      <Button component={Link} to="/" variant="contained">Back to dashboard</Button>
    </Stack>
  );
}