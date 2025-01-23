import { Box, Stack } from '@mui/material'
import React from 'react';
import { DocMsg, LinkMsg, MediaMsg, ReplyMsg, TextMsg, TimeLine, MessageOptions } from './MsgTypes';



const Message = ({ menu, chatHistory, setReply, selectedChatId }) => {
  //console.log(chatHistory)
  if (!Array.isArray(chatHistory)) {
    return null; // Или можно показать сообщение об ошибке
  }
  

  return (
    <>
    <MessageOptions selectedChatId={selectedChatId}/>
    <Box p={3}>
      <Stack spacing={3}>
        {chatHistory.map((el, index) => {
          switch (el.type) {
            case 'divider':
              return <TimeLine key={index} el={el} />;
            case 'image':
              return <MediaMsg key={index} el={el} menu={menu} setReply={setReply}/>;
            case 'doc':
              return <DocMsg key={index} el={el} menu={menu} />;
            case 'link':
                return <LinkMsg key={index} el={el} menu={menu} />;
            case 'reply':
                return <ReplyMsg key={index} el={el} menu={menu} setReply={setReply} />;
            case 'message':
                return <TextMsg key={index} el={el} menu={menu} setReply={setReply} />;
            default:
              return null;
          }
        })}
      </Stack>
    </Box>
    </>
  );
};


export default Message;