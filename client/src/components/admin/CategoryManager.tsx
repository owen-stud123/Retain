import { Add, Delete, Edit, Save } from '@mui/icons-material';
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../../api/categories';
import type { Category } from '../../types';
import ConfirmDialog from '../common/ConfirmDialog';
import Toast from '../common/Toast';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [deleting, setDeleting] = useState<Category | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load categories'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const category = await createCategory(newName.trim());
      setCategories((current) => [...current, category].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setToast('Category created.');
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create category');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editingId || !editingName.trim()) return;
    setSaving(true);
    try {
      const category = await updateCategory(editingId, editingName.trim());
      setCategories((current) => current.map((item) => item._id === category._id ? category : item).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
      setToast('Category updated.');
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update category');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const result = await deleteCategory(deleting._id);
      setCategories((current) => current.filter((item) => item._id !== deleting._id));
      setDeleting(null);
      setToast(result.reassignedExpenses ? `Category deleted. ${result.reassignedExpenses} expense(s) moved to Uncategorized.` : 'Category deleted.');
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete category');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Manage categories</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <TextField label="New category" value={newName} onChange={(event) => setNewName(event.target.value)} size="small" fullWidth />
          <Button variant="contained" startIcon={<Add />} onClick={() => void handleCreate()} disabled={saving || !newName.trim()}>
            Add
          </Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? <CircularProgress size={24} /> : (
          <List disablePadding>
            {categories.map((category) => (
              <ListItem key={category._id} divider secondaryAction={category.isDefault ? (
                <Typography variant="caption" color="text.secondary">System category</Typography>
              ) : editingId === category._id ? (
                <Stack direction="row" spacing={0.5}>
                  <IconButton aria-label="save category" onClick={() => void handleUpdate()} disabled={saving}><Save /></IconButton>
                  <IconButton aria-label="cancel editing" onClick={() => setEditingId(null)} disabled={saving}>×</IconButton>
                </Stack>
              ) : (
                <Stack direction="row" spacing={0.5}>
                  <IconButton aria-label={`edit ${category.name}`} onClick={() => { setEditingId(category._id); setEditingName(category.name); }}><Edit /></IconButton>
                  <IconButton aria-label={`delete ${category.name}`} color="error" onClick={() => setDeleting(category)}><Delete /></IconButton>
                </Stack>
              )}>
                {editingId === category._id ? (
                  <TextField value={editingName} onChange={(event) => setEditingName(event.target.value)} size="small" fullWidth autoFocus />
                ) : <ListItemText primary={category.name} />}
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete category?"
        message={`Expenses in ${deleting?.name || 'this category'} will be moved to Uncategorized.`}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        confirming={saving}
      />
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}