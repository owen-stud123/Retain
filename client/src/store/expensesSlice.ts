import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getExpenses, type ExpenseQuery } from '../api/expenses';
import type { Expense, ExpenseListResponse } from '../types';
import type { RootState } from './index';

interface ExpensesState extends ExpenseListResponse {
  loading: boolean;
  error: string | null;
  // Id of the newest request. Responses from older requests (e.g. while the user is still
  // typing a search) are ignored so they can't overwrite newer results.
  latestRequestId: string | null;
}

const initialState: ExpensesState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  pages: 0,
  loading: false,
  error: null,
  latestRequestId: null
};


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
      .addCase(fetchExpenses.pending, (state, action) => {
        state.latestRequestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestRequestId) return;
        const { items, total, page, limit, pages } = action.payload;
        Object.assign(state, { items, total, page, limit, pages, loading: false });
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        if (action.meta.requestId !== state.latestRequestId) return;
        state.loading = false;
        // action.error is a plain serialized object, not an Error instance.
        state.error = action.error.message || 'Unable to load expenses';
      });
  }
});

export const { clearExpenses, replaceExpense } = expensesSlice.actions;
export default expensesSlice.reducer;