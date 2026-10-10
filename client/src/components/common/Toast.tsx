import { Alert, Snackbar } from '@mui/material';

interface ToastProps {
  message: string;
  severity?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export default function Toast({ message, severity = 'success', onClose }: ToastProps) {
  return (
    <Snackbar open={Boolean(message)} autoHideDuration={3500} onClose={onClose}>
      <Alert severity={severity} onClose={onClose} variant="filled">{message}</Alert>
    </Snackbar>
  );
}