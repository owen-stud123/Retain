import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Category, PaymentMethod } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetFilters, setFilter } from '../../store/filtersSlice';
import { useDebounce } from '../../hooks/useDebounce';

const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'other', label: 'Other' }
];

export default function ExpenseFilters({ categories }: { categories: Category[] }) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);
  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    if (debouncedSearch !== filters.search) dispatch(setFilter({ key: 'search', value: debouncedSearch }));
  }, [debouncedSearch, dispatch, filters.search]);

  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <TextField label="Search expenses" value={search} onChange={(event) => setSearch(event.target.value)} fullWidth />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="category-filter-label">Category</InputLabel>
          <Select labelId="category-filter-label" label="Category" value={filters.category} onChange={(event) => dispatch(setFilter({ key: 'category', value: event.target.value }))}>
            <MenuItem value="">All categories</MenuItem>
            {categories.map((category) => <MenuItem key={category._id} value={category._id}>{category.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="payment-filter-label">Payment method</InputLabel>
          <Select labelId="payment-filter-label" label="Payment method" value={filters.paymentMethod} onChange={(event) => dispatch(setFilter({ key: 'paymentMethod', value: event.target.value as PaymentMethod | '' }))}>
            <MenuItem value="">All methods</MenuItem>
            {paymentMethods.map((method) => <MenuItem key={method.value} value={method.value}>{method.label}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="From date" type="date" value={filters.startDate} onChange={(event) => dispatch(setFilter({ key: 'startDate', value: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="To date" type="date" value={filters.endDate} onChange={(event) => dispatch(setFilter({ key: 'endDate', value: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Min amount" type="number" value={filters.minAmount} onChange={(event) => dispatch(setFilter({ key: 'minAmount', value: event.target.value }))} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
        <TextField label="Max amount" type="number" value={filters.maxAmount} onChange={(event) => dispatch(setFilter({ key: 'maxAmount', value: event.target.value }))} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
        <FormControl fullWidth>
          <InputLabel id="sort-filter-label">Sort by</InputLabel>
          <Select labelId="sort-filter-label" label="Sort by" value={filters.sortBy} onChange={(event) => dispatch(setFilter({ key: 'sortBy', value: event.target.value as 'date' | 'amount' }))}>
            <MenuItem value="date">Date</MenuItem><MenuItem value="amount">Amount</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="order-filter-label">Order</InputLabel>
          <Select labelId="order-filter-label" label="Order" value={filters.order} onChange={(event) => dispatch(setFilter({ key: 'order', value: event.target.value as 'asc' | 'desc' }))}>
            <MenuItem value="desc">Descending</MenuItem><MenuItem value="asc">Ascending</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Button variant="outlined" onClick={() => { setSearch(''); dispatch(resetFilters()); }}>Clear filters</Button>
    </Stack>
  );
}