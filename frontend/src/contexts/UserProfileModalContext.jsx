import React, { createContext, useState, useContext } from "react";
import { Modal, Fade, Backdrop, Box } from "@mui/material";
import UserProfileCard from "../components/UserProfileCard"; // Предполагается, что этот компонент существует

const UserProfileModalContext = createContext();

export const UserProfileModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  const openModal = (userData) => {
    setUser(userData);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setUser(null);
  };

  return (
    <UserProfileModalContext.Provider value={{ openModal, closeModal }}>
      {children}

      {/* Модальное окно с UserProfileCard */}
      <Modal
        open={open}
        onClose={closeModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: 24,
              borderRadius: 2,
            }}
          >
            {user && <UserProfileCard user={user} />}
          </Box>
        </Fade>
      </Modal>
    </UserProfileModalContext.Provider>
  );
};

// Хук для использования контекста
export const useUserProfileModal = () => {
  return useContext(UserProfileModalContext);
};
