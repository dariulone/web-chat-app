import { Avatar, Box, Typography,IconButton, Divider,Stack, Menu, MenuItem } from '@mui/material'
import { CaretDown, MagnifyingGlass, Phone,VideoCamera } from 'phosphor-react'
import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import StyledBadge from '../StyledBadge';
import { useWebSocket } from "../../contexts/WebSocketContext";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { User } from "phosphor-react";
import { useUserProfileModal } from '../../contexts/UserProfileModalContext';
import { fetchUserById } from '../../server-side/userprofile';

const Header = ({ selectedChatId, selectedRecipient, status, lastSeen, recipientAvatar }) => {
  //const dispatch = useDispatch();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const { openModal } = useUserProfileModal();

  if (lastSeen !== "Неизвестно" && status === "offline") {
    try {
        lastSeen = formatDistanceToNow(parseISO(lastSeen), { addSuffix: true, locale: ru });
    
  } catch (error) {
        console.error("Error parsing", error)
  }
}

  const handleOpenUserProfile = async () => {
    try {
      const user = await fetchUserById(selectedChatId); // Получаем данные пользователя
      const userData = {
        username : user.username,
        profile_image : user.profile_image,
        status: status === 'online' ? 'В сети' : `${lastSeen || 'Неизвестно'}`,
      };
      openModal(userData); // Передаем данные в функцию открытия модального окна
    } catch (error) {
      console.error("Ошибка при получении данных пользователя:", error);
    }
  };
  // Открыть/закрыть dropdown
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  
    

  return (
    <Box p={2} sx={{ width:'100%', backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper, boxShadow:'0px 0px 2px rgba(0,0,0,0.25)'}}>
    <Stack alignItems={'center'} direction='row' justifyContent={'space-between'}
    sx={{width:'100%', height:'100%'}}>
        <Stack onClick={()=>{
            //dispatch(ToggleSidebar());
        }} direction={'row'} spacing={2}>
            <Box>
            {status === 'online' ? (
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
            >
              <Avatar 
            src={recipientAvatar || "/path/to/default_image.png"} 
            alt={selectedRecipient || "Unknown User"} 
            />
            </StyledBadge>
          ) : (
            <Avatar 
            src={recipientAvatar || "/path/to/default_image.png"} 
            alt={selectedRecipient || "Unknown User"} 
            />
          )}
                
            </Box>
            <Stack spacing={0.2}>
                <Typography variant="subtitle2">{selectedRecipient}</Typography>
                <Typography variant="caption" color="text.secondary">
                    {status === 'online' ? 'В сети' : `${lastSeen}`}
                </Typography>
            </Stack>
        </Stack>
        <Stack direction='row' alignItems='center' spacing={3}>
            <Divider orientation='vertical' flexItem/>
            <IconButton onClick={(e) => { e.stopPropagation(); handleOpenMenu(e); }}>
                <CaretDown/>
            </IconButton>

             {/* Dropdown меню */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          anchorOrigin={{vertical:'bottom', horizontal:'left'}}
          transformOrigin={{vertical:'top', horizontal:'left'}}
        >
        <Stack spacing={1} px={1}>
        {/* Профиль */}
        <MenuItem onClick={handleOpenUserProfile}>
            <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: 100 }}
            >
              <User size={16} />
            <span>Профиль</span>
            </Stack>
        </MenuItem>

        
        </Stack>
        </Menu>
        </Stack>
    </Stack>
</Box>
  )
}

export default Header