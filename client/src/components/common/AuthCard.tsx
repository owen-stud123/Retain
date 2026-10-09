import { Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export default function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card sx={{ width: '100%', maxWidth: 440, mx: 'auto', mt: 8 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>{title}</Typography>
        {children}
      </CardContent>
    </Card>
  );
}