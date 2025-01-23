import React, { createContext, useState, useContext } from "react";
import { Modal, Fade, Backdrop, Box } from "@mui/material";
import SettingsProfileCard from "../components/SettingsProfileCard";
import { Settings } from "@mui/icons-material";

const SettingsProfileModalContext = createContext();

export const SettingsProfileModalProvider = ({ children }) => {
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
    <SettingsProfileModalContext.Provider value={{ openModal, closeModal }}>
      {children}

      {/* Модальное окно с SettingsProfileCard */}
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
            {user && <SettingsProfileCard user={user} closeModal={closeModal}/>}
          </Box>
        </Fade>
      </Modal>
    </SettingsProfileModalContext.Provider>
  );
};

// Хук для использования контекста
export const useSettingsProfileModal = () => {
  return useContext(SettingsProfileModalContext);
};
