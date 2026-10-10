import { Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
}

export default function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        {icon}
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>{value}</Typography>
        {detail && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{detail}</Typography>}
      </CardContent>
    </Card>
  );
}