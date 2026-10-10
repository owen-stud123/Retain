import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PaymentMethod } from '../types';

export interface ExpenseFilters {
  search: string;
  category: string;
  paymentMethod: PaymentMethod | '';
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  sortBy: 'date' | 'amount';
  order: 'asc' | 'desc';
  page: number;
  limit: number;
}

const initialState: ExpenseFilters = {
  search: '',
  category: '',
  paymentMethod: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  sortBy: 'date',
  order: 'desc',
  page: 1,
  limit: 10
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilter: <K extends keyof ExpenseFilters>(
      state: ExpenseFilters,
      action: PayloadAction<{ key: K; value: ExpenseFilters[K] }>
    ) => {
      state[action.payload.key] = action.payload.value;
      if (action.payload.key !== 'page') state.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    resetFilters: () => initialState
  }
});

export const { setFilter, setPage, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;