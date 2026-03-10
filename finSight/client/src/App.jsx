import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import BudgetsPage from './pages/BudgetsPage.jsx';
import GoalsPage from './pages/GoalsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/"
              element={
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <Layout>
                  <DashboardPage />
                </Layout>
              }
            />
            <Route
              path="/transactions"
              element={
                <Layout>
                  <TransactionsPage />
                </Layout>
              }
            />
            <Route
              path="/budgets"
              element={
                <Layout>
                  <BudgetsPage />
                </Layout>
              }
            />
            <Route
              path="/goals"
              element={
                <Layout>
                  <GoalsPage />
                </Layout>
              }
            />
            <Route
              path="/analytics"
              element={
                <Layout>
                  <AnalyticsPage />
                </Layout>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
