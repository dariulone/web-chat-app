import React, { useState } from "react";
import { Box, Typography, Avatar, IconButton, Divider, Menu, MenuItem, Stack } from "@mui/material";
import { FiChevronUp } from "react-icons/fi";
import StyledBadge from './StyledBadge';
import { User, SignOut } from "phosphor-react";
import { useSettingsProfileModal } from "../contexts/SettingsProfileModalContext";


const UserBar = ({ user }) => {
  if (!user) {
    return;
  }
  const { openModal } = useSettingsProfileModal();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenSettings = () => {
    openModal(user);
  };

  // Открыть/закрыть dropdown
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleMenuClick = (action) => {
    console.log(`${action} clicked`);
    handleCloseMenu();
  };

  return (
    <>
      <Divider />
      <Box
        sx={{
          p: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      width="100%"
      sx={{
        padding: 1,
        cursor: "pointer",
      }}
      onClick={handleOpenSettings}
    >
      <StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        variant="dot"
      >
        <Avatar
          src={user.profile_image || "/path/to/default_image.png"}
          alt={user.username || "Unknown User"}
        />
      </StyledBadge>

      <Box sx={{ flex: 1 }}>
        {/* Имя пользователя или "Unknown User" */}
        <Typography variant="subtitle2">
          {user.username || "Unknown User"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          В сети
        </Typography>
      </Box>
    </Stack>

        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenMenu(e); }}>
          <FiChevronUp />
        </IconButton>

        {/* Dropdown меню */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          anchorOrigin={{vertical:'top', horizontal:'left'}}
          transformOrigin={{vertical:'bottom', horizontal:'left'}}
        >
        <Stack spacing={1} px={1}>
        {/* Профиль */}
        <MenuItem onClick={handleOpenSettings} >
            <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: 100 }}
            >
            <span>Профиль</span>
            <User size={16} />
            </Stack>
        </MenuItem>

        {/* Logout */}
        <MenuItem >
            <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: 100 }}
            >
            <span>Выйти</span>
            <SignOut size={16} />
            </Stack>
        </MenuItem>
        </Stack>
        </Menu>
      </Box>
    </>
  );
};

export default UserBar;
