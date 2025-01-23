import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../server-side/auth';
import { fetchUserProfile } from '../server-side/userprofile'
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext({});

const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const navigate = useNavigate();

    // Проверка токена на срок действия
  const checkTokenExpiration = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    try {
      const decodedToken = jwtDecode(token); // Расшифровываем токен
      const currentTime = Date.now() / 1000; // Текущее время в секундах
      if (decodedToken.exp < currentTime) {
        // Если токен истёк
        console.log("Token has expired");
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem("token"); // Удаляем токен из хранилища
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // Проверяем токен при монтировании компонента
  useEffect(() => {
    checkTokenExpiration();

    // Устанавливаем интервал проверки токена каждые 1 минуту
    const interval = setInterval(() => {
      checkTokenExpiration();
    }, 60000); // 1 минута = 60 000 мс

    // Очищаем интервал при размонтировании
    return () => clearInterval(interval);
  }, []);

    useEffect(() => {
        const initializeUser = async () => {
            if (token) {
                try {
                    const userProfile = await fetchUserProfile(token);
                    setUser(userProfile);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Failed to fetch user profile:', error);
                    logout(); // Если токен недействителен, разлогинить пользователя
                }
            }
        };
        initializeUser();
    }, [token]);

    const login = async (username, password) => {
        const response = await loginUser({ username, password });
        if (response?.access_token) {
            localStorage.setItem('token', response.access_token);
            setToken(response.access_token);
            const userProfile = await fetchUserProfile(response.access_token);
            setUser(userProfile);
            setIsAuthenticated(true);
        }
    };

    const updateUser = (updatedUser) => {
      setUser((prevUser) => ({
        ...prevUser,
        ...updatedUser,
      }));
    };

    const register = async (username, email, password) => {
        await registerUser({ username, email, password });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        navigate("/");
    };

    return (
        <AuthContext.Provider value={{ token, isAuthenticated, user, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthProvider, AuthContext };
