import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography component={Link} to="/" variant="h6" sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}>
            Retain
          </Typography>
          <Button color="inherit" component={Link} to="/expenses">Expenses</Button>
          {user?.role === 'admin' && <Button color="inherit" component={Link} to="/admin">Admin</Button>}
          <Button color="inherit" onClick={handleLogout}>Sign out</Button>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}