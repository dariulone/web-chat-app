import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import MainPage from './components/MainPage';
import AuthPage from './components/AuthPage';
import AppTheme from '../shared-theme/AppTheme';
import CssBaseline from '@mui/material/CssBaseline';



const App = (props) => {
  const { isAuthenticated } = useContext(AuthContext);
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/main" replace /> : <Navigate to="/login" replace />} />
        {/* Главная страница */}
        <Route
          path="/main"
          element={
              <MainPage />
          }
        />
        
        {/* Страница логина/регистрации */}
        <Route path="/login" element={<AuthPage />} />

        {/* Перенаправление на /login, если маршрут не найден */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AppTheme>
  );
};

const Root = () => (
  <Router>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Router>
);

export default Root;
