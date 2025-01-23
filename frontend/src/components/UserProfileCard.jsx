import React, { useState } from "react";
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Divider,
  ListItem,
} from "@mui/material";
import { styled } from "@mui/system";
import StyledBadge from './StyledBadge';

const StyledCard = styled(Card)(({ theme }) => ({
  width: 500,
  maxheight: 600,
  overflow: "auto",
  margin: "auto",
  transition: "0.3s",
  [theme.breakpoints.down("sm")]: {
    maxWidth: "100%"
  }
}));


const ActivityItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1, 0),
  "&:not(:last-child)": {
    borderBottom: `1px solid ${theme.palette.divider}`
  }
}));

const UserProfileCard = ({ user }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <StyledCard>
      <CardContent>
        <Box sx={{ position: "relative", display: "flex", justifyContent: "center" }}>
        {user.status === 'В сети' ? (
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
            >
              <Avatar sx={{width: "96px", height: "96px"}}
            src={user.profile_image || "/path/to/default_image.png"} 
            alt={user.username || "Unknown User"} 
            />
            </StyledBadge>
          ) : (
            <Avatar sx={{width: "96px", height: "96px"}}
            src={user.profile_image || "/path/to/default_image.png"} 
            alt={user.username || "Unknown User"} 
            />
          )}
        </Box>

        <Typography variant="h5" align="center" gutterBottom>
          {user.username}
        </Typography>
        <Typography variant="body2" fontSize="11px" align="center" color="textSecondary" gutterBottom>
          {user.status}
        </Typography>
        
        {user.bio && (
                    <><Divider sx={{ mb: 2 }} /><Box sx={{ marginTop: 2, paddingLeft: 1 }}>
            <Typography variant="body2" fontSize="11px" color="textSecondary" gutterBottom>
              Bio
            </Typography>
            <Typography variant="body1" paragraph>
              {user.bio}
            </Typography>
          </Box></>
                  )}
      </CardContent>
    </StyledCard>
  );
};

export default UserProfileCard;