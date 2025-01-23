import React, { useState, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/system";
import { motion, AnimatePresence } from "framer-motion";
import { BsChatFill } from "react-icons/bs";
import { AuthContext } from '../contexts/AuthContext.jsx';

const StyledCard = styled(Card)(({ theme }) => ({
  background: "rgba(255, 255, 255, 0.9)",
  backdropFilter: "blur(10px)",
  borderRadius: "16px",
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
  padding: "2rem",
  maxWidth: "400px",
  width: "100%",
}));

const Background = styled(Box)({
  background: "linear-gradient(135deg, #00B2FF 0%, #006AFF 100%)",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
});

const SocialButton = styled(IconButton)({
  margin: "0 8px",
  backgroundColor: "#fff",
  "&:hover": {
    backgroundColor: "#f5f5f5",
  },
});

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  let navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const { login, register } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match!");
      }

      if (isLogin) {
        // Логин пользователя
        await login(formData.username, formData.password);
        navigate('/main')
      } else {
        // Регистрация нового пользователя
        await register(formData.username, formData.email, formData.password);
        await login(formData.username, formData.password);
        navigate('/main')
      }

      setSuccess(true); // Успешное завершение
    } catch (err) {
      setError(err.message); // Отображение ошибки
    } finally {
      setLoading(false); // Окончание загрузки
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Background>
      <Container maxWidth="sm">
        <AnimatePresence>
          {!success ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <StyledCard>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <BsChatFill size={40} color="#006AFF" />
                    <Typography variant="h4" component="h1" sx={{ mt: 2 }}>
                      {isLogin ? "Привет" : "Регистрация"}
                    </Typography>
                  </Box>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit}>
                    
                      <TextField
                        fullWidth
                        label="Имя пользователя"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        margin="normal"
                        required
                      />
                    
                    {!isLogin && (
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      margin="normal"
                      required
                    />
                  )}
                    <TextField
                      fullWidth
                      label="Пароль"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      margin="normal"
                      required
                    />

                    {!isLogin && (
                      <TextField
                        fullWidth
                        label="Подтвердите пароль"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        margin="normal"
                        required
                      />
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      type="submit"
                      disabled={loading}
                      sx={{
                        mt: 3,
                        mb: 2,
                        background: "linear-gradient(45deg, #006AFF 30%, #00B2FF 90%)",
                        color: "white",
                        "&:hover": {
                          background: "linear-gradient(45deg, #005AE0 30%, #00A0E0 90%)",
                        },
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        isLogin ? "Войти" : "Зарегистрироваться"
                      )}
                    </Button>

                    <Box sx={{ textAlign: "center", mt: 2 }}>
                      <Button
                        onClick={() => setIsLogin(!isLogin)}
                        sx={{ textTransform: "none" }}
                      >
                        {isLogin
                          ? "Нет аккаунта? Зарегистрируйтесь"
                          : "Уже есть аккаунт? Войдите"}
                      </Button>
                    </Box>
                  </form>
                </CardContent>
              </StyledCard>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
            >
              <StyledCard>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 1,
                        ease: "easeInOut",
                      }}
                    >
                      <BsChatFill size={60} color="#006AFF" />
                    </motion.div>
                    <Typography variant="h4" sx={{ mt: 3, mb: 2 }}>
                      {isLogin ? "Login Successful!" : "Registration Complete!"}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {isLogin
                        ? "Welcome back to your account"
                        : "Your account has been created successfully"}
                    </Typography>
                    <Button
                      variant="contained"
                      sx={{
                        mt: 3,
                        background: "linear-gradient(45deg, #006AFF 30%, #00B2FF 90%)",
                      }}
                      onClick={() => {
                        setSuccess(false);
                        setFormData({
                          name: "",
                          email: "",
                          password: "",
                          confirmPassword: "",
                        });
                      }}
                    >
                      Продолжить
                    </Button>
                  </Box>
                </CardContent>
              </StyledCard>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </Background>
  );
};

export default AuthPage;