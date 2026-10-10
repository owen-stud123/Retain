import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getExpenses, type ExpenseQuery } from '../api/expenses';
import type { Expense, ExpenseListResponse } from '../types';
import type { RootState } from './index';

interface ExpensesState extends ExpenseListResponse {
  loading: boolean;
  error: string | null;
}

const initialState: ExpensesState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  pages: 0,
  loading: false,
  error: null
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load expenses';
}

export const fetchExpenses = createAsyncThunk<ExpenseListResponse, void, { state: RootState }>(
  'expenses/fetch',
  async (_, thunkApi) => {
    const filters = thunkApi.getState().filters;
    const query: ExpenseQuery = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== '')
    );
    return getExpenses(query);
  }
);

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearExpenses: () => initialState,
    replaceExpense: (state, action: { payload: Expense }) => {
      state.items = state.items.map((item) => item._id === action.payload._id ? action.payload : item);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = getErrorMessage(action.error);
      });
  }
});

export const { clearExpenses, replaceExpense } = expensesSlice.actions;
export default expensesSlice.reducer;