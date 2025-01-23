import React, { useState, useContext } from "react";
import { styled } from "@mui/system";
import { Box, Card, Avatar, Typography, IconButton, List, ListItem, ListItemIcon, ListItemText, Divider, Slide, Modal, Paper, Grid, TextField, Button, Snackbar, Alert } from "@mui/material";
import { IoClose, IoLogOutOutline, IoPersonOutline, IoColorPaletteOutline, IoChevronForward } from "react-icons/io5";
import { updateUserProfile } from "../server-side/userprofile";
import { AuthContext } from "../contexts/AuthContext";


const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        resolve(reader.result); // Возвращаем строку Base64
      };

      reader.onerror = (error) => {
        reject(error); // В случае ошибки
      };
    });
  };

const StyledModal = styled(Modal)({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
});

const StyledCard = styled(Card)(({ theme }) => ({
  width: "300px",
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  transition: "box-shadow 0.3s ease-in-out",
  "&:hover": {
    boxShadow: theme.shadows[4],
  },
}));

const HeaderBox = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: "16px",
  position: "relative",
});

const StyledListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  marginBottom: "4px",
  cursor: "pointer",
}));

const SettingsProfileCard = ({ closeModal }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false); 
  const [slideIn, setSlideIn] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user.username || "",
    email: user.email || "",
    profile_image: user.profile_image || "",
  });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  

  const handleCloseModal = () => {
    setShowModal(false);
    setSlideIn(false);
  };

  const handleMyProfileClick = () => {
    setSlideIn(true); 
    setTimeout(() => setShowModal(true), 50);
  };

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  // Обработка загрузки файла
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64String = await getBase64(file); // Конвертация в Base64
        setEditForm({ ...editForm, profile_image: base64String }); // Сохранение в состояние
      } catch (error) {
        console.error("Ошибка загрузки изображения:", error);
      }
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault(); // Предотвращает перезагрузку страницы
    setErrors({});
    try {
      const updatedUser = await updateUserProfile(editForm);
      updateUser(updatedUser)
      setSnackbar({ open: true, message: "Профиль успешно обновлен!", severity: "success" });
      console.log("User updated successfully:", updatedUser);
      handleCloseModal();
    } catch (error) {
      const errorData = error.response?.data || { message: "Ошибка обновления профиля" };
      setSnackbar({ open: true, message: errorData.message, severity: "error" });
      setErrors(errorData.errors || {});
    }
  };

  return (
    <>
      <Slide direction={slideIn ? "left" : "right"} in={!showModal} mountOnEnter unmountOnExit>
        <StyledCard elevation={2}>
          <HeaderBox>
            <Box display="flex" alignItems="center" gap="16px">
              <Avatar
                src={user.profile_image || "/path/to/default_image.png"}
                alt={user.username || "Unknown User"}
                sx={{ width: 60, height: 60 }}
              />
              <Typography variant="h6">{user.username || "Unknown User"}</Typography>
            </Box>
            <IconButton aria-label="close" onClick={closeModal}>
              <IoClose size={20} />
            </IconButton>
          </HeaderBox>

          {user.bio && (
            <Box sx={{ marginTop: 2, paddingLeft: 1 }}>
              <Typography variant="body2" fontSize="11px" color="textSecondary" gutterBottom>
                Bio
              </Typography>
              <Typography variant="body1" paragraph>
                {user.bio}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          <List sx={{ p: 0 }}>
            <StyledListItem onClick={handleMyProfileClick} role="button" tabIndex={0}>
              <ListItemIcon sx={{ minWidth: "40px" }}>
                <IoPersonOutline size={20} />
              </ListItemIcon>
              <ListItemText primary="Мой профиль" />
              <IoChevronForward size={20} />
            </StyledListItem>

            <StyledListItem onClick={() => console.log("Theme clicked")} role="button" tabIndex={0}>
              <ListItemIcon sx={{ minWidth: "40px" }}>
                <IoColorPaletteOutline size={20} />
              </ListItemIcon>
              <ListItemText primary="Темы" />
              <IoChevronForward size={20} />
            </StyledListItem>

            <StyledListItem onClick={handleLogout} role="button" tabIndex={0}>
              <ListItemIcon sx={{ minWidth: "40px" }}>
                <IoLogOutOutline size={20} />
              </ListItemIcon>
              <ListItemText primary="Выйти" />
            </StyledListItem>
          </List>
        </StyledCard>
      </Slide>

      <StyledModal open={showModal} onClose={handleCloseModal}>
        <Paper sx={{ p: 2, width: 300, maxHeight: "90vh", overflow: "auto" }}>
          <Typography variant="h6" gutterBottom>
            Редактирование
          </Typography>
          <form onSubmit={handleSaveChanges}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ textAlign: "center", mb: 2 }}>
                  <input
                    accept="image/*"
                    type="file"
                    id="profile-image-upload"
                    hidden
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="profile-image-upload">
                    <Avatar
                      src={editForm.profile_image || "/path/to/default_image.png"}
                      sx={{ width: "80px", height: "80px", margin: "0 auto", cursor: "pointer" }}
                    />
                  </label>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Имя пользователя"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button fullWidth color="primary" variant="contained" type="submit">
                  Сохранить
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </StyledModal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SettingsProfileCard;