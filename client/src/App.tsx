import { Route, Routes } from 'react-router-dom';
import Layout from './components/common/Layout';
import { RequireAdmin, RequireAuth } from './routes/ProtectedRoute';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';
import ExpenseDetailPage from './pages/ExpenseDetailPage';
import ExpensesPage from './pages/ExpensesPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import SignupPage from './pages/SignupPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;