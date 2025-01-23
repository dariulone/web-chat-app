import React, { useContext, useState } from 'react';
import Chats from './Chats'
import { useTheme } from "@mui/material/styles";
import { Box, Stack, useMediaQuery } from '@mui/material'
import Conversation from './Conversation'
import { WebSocketProvider } from '../contexts/WebSocketContext';
import { UserProfileModalProvider } from "../contexts/UserProfileModalContext";
import { AuthContext } from "../contexts/AuthContext";
import { SettingsProfileModalProvider } from '../contexts/SettingsProfileModalContext';


const MainPage = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [recipientAvatar, setRecipientAvatar] = useState(null);
  const [status, setStatus] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
    <WebSocketProvider user={user}>
      <UserProfileModalProvider>
        <Stack direction='row' sx={{ width: '100%' }}>
          <SettingsProfileModalProvider>
            <Chats user={user} setRecipientAvatar={setRecipientAvatar} setSelectedChatId={setSelectedChatId} setSelectedRecipient={setSelectedRecipient} setStatus={setStatus} setLastSeen={setLastSeen} />
          </SettingsProfileModalProvider>
          <Box sx={{ width: '100%',
            backgroundColor: theme.palette.mode === 'light' ? '#F0F4FA' : theme.palette.background.default }}>
            <Conversation recipientAvatar={recipientAvatar} selectedRecipient={selectedRecipient} selectedChatId={selectedChatId} user={user} status={status} lastSeen={lastSeen} />
          </Box>
        </Stack>
      </UserProfileModalProvider>
    </WebSocketProvider>
    </>
  );
};


export default MainPage;
