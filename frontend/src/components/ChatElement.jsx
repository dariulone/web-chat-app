import { Avatar, Badge, Box, Stack, Typography } from '@mui/material';
import {useTheme , styled} from '@mui/material/styles';
import StyledBadge from './StyledBadge';
import { format } from "date-fns";
import { useWebSocket } from '../contexts/WebSocketContext';

const ChatElement = ({id, username, profile_image, msg, time, status, unread, onClick}) => {
    const theme = useTheme();
    const { userStatuses, activeChatId } = useWebSocket();
    const statusvalue = userStatuses[id] ? userStatuses[id].status : status
    const isSelected = activeChatId === id; // Проверяем, является ли текущий чат выбранным

    return (
      <Box onClick={onClick} sx={{
        width: "100%",
        //borderRadius: 2,
        padding: 1,
        //backgroundColor: theme.palette.mode === 'light'? "#fff" : "theme.palette.background.default",
        cursor: "pointer",
        '&:hover': {
          backgroundColor: theme.palette.primary.main,
          color: "#fff"
        },
        backgroundColor: isSelected ? `${theme.palette.primary.main}` : "none", // Рамка для выбранного чата
        color: isSelected ? "#fff" : "none",
      }}
        p={1}>
        <Stack direction="row" alignItems='center' justifyContent='space-between'>
          <Stack direction='row' spacing={2}>
          {statusvalue === "online" ? (
            <StyledBadge 
              overlap="circular" 
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }} 
              variant="dot"
            >
              <Avatar 
              src={profile_image || "/path/to/default_image.png"} 
              alt={username || "Unknown User"} 
              />
            </StyledBadge>
          ) : (
            <Avatar 
            src={profile_image || "/path/to/default_image.png"} 
            alt={username || "Unknown User"} 
            />
          )}
            
            <Stack spacing={0.3}>
              <Typography variant='subtitle2'>
                {username}
              </Typography>
              <Typography variant='caption'>
                {msg}
              </Typography>
            </Stack>
            </Stack>
            <Stack spacing={2} alignItems='center'>
              <Typography  variant='caption'>
                {time ? format(new Date(time), "HH:mm") : ""}
              </Typography>
              <Badge sx={{
                margin: "10px !important"
              }} color='primary' badgeContent={unread}>
              </Badge>
            </Stack>
        </Stack>
      </Box>
    )
  };

  export default ChatElement;