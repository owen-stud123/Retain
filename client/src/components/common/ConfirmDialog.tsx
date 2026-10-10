import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirming?: boolean;
}

export default function ConfirmDialog({ open, title, message, onCancel, onConfirm, confirming = false }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={confirming ? undefined : onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={confirming}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={confirming}>
          {confirming ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}