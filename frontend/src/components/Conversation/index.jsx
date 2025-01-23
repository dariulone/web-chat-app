import {  Box, Stack, Typography, IconButton, Fade } from '@mui/material';
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useTheme } from "@mui/material/styles";
import { useWebSocket } from '../../contexts/WebSocketContext';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import { parseISO, isToday, isYesterday, format, startOfDay, setDefaultOptions } from 'date-fns';
import { ru } from 'date-fns/locale';

setDefaultOptions({locale: ru})

const Conversation = ({ selectedChatId, user, selectedRecipient, status, lastSeen, recipientAvatar }) => {
  const { messages, socket, isConnected, setMessages, userStatuses, chatList } = useWebSocket();
  const [filteredMessages, setFilteredMessages] = useState([]); // Состояние для сообщений выбранного чата
  const theme = useTheme();
  const messageContainer = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false); // Состояние для отображения кнопки
  const [isAtBottom, setIsAtBottom] = useState(true); // Состояние для отслеживания положения скролла
  const [isInitialScroll, setIsInitialScroll] = useState(true); // Новый флаг
  const [reply, setReply] = useState(null); // Состояние для хранения текста реплая
  const recipientData = userStatuses[selectedChatId] || chatList.find(contact => contact.id === selectedChatId) || { status: "offline", last_seen: "Неизвестно" };


  const scrollToBottom = () => {
    if (messageContainer.current) {
      messageContainer.current.scrollTop = messageContainer.current.scrollHeight;
    }
  };

  const transformMessages = (messages, userId) => {
    const transformedMessages = [];
  
    let isFirstMessage = true; // Для обработки первого сообщения
  
    messages.forEach((msg, index) => {
      const message = {
        type: msg.type,
        message: msg.type === 'image' ? msg.image : msg.message,
        incoming: parseInt(msg.sender_id) !== parseInt(userId),
        outgoing: parseInt(msg.sender_id) === parseInt(userId),
        timestamp: msg.timestamp,
        read: msg.read,
        reply: msg.reply || null, // Добавляем поле `reply`, если оно есть
        reactions: msg.reactions || {}, // Добавляем поле `reactions`, если оно существует
      };
  
      // Проверяем дату текущего сообщения
      const currTime = parseISO(msg.timestamp);
  
      // Если это первое сообщение и оно не в сегодня, добавляем разделитель с датой
      if (isFirstMessage) {
        const today = new Date();
        if (!isToday(currTime)) {
          transformedMessages.push({
            type: 'divider',
            text: format(currTime, 'dd MMMM'), // Форматируем дату
          });
        }
        isFirstMessage = false; // Для следующих сообщений
      }
  
      // Если это не первое сообщение, проверим разницу времени с предыдущим
      if (index > 0) {
        const prevMsg = messages[index - 1];
        const prevTime = parseISO(prevMsg.timestamp);
  
        // Если текущее сообщение на "Сегодня" и предыдущее нет, добавляем "Сегодня"
        if (isToday(currTime) && !isToday(prevTime)) {
          transformedMessages.push({
            type: 'divider',
            text: 'Сегодня',
          });
        } else if (startOfDay(currTime) > startOfDay(prevTime)) {
          transformedMessages.push({
            type: 'divider',
            text: format(currTime, 'dd MMMM'), // Форматируем дату
          });
        }
      }
  
      // Добавляем само сообщение
      transformedMessages.push(message);
    });
  
    return transformedMessages;
  };


  const handleScroll = () => {
    if (messageContainer.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageContainer.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // Пороговая область
      setIsAtBottom(isAtBottom);
      setShowScrollButton(!isAtBottom); // Показываем кнопку, если пользователь не внизу
    }
  };

  useEffect(() => {
    if (selectedChatId) {
      setIsInitialScroll(true); // Устанавливаем флаг для первого скролла
      if (socket) {
        setMessages([]); // Очищаем все сообщения при изменении выбранного чата
        // Запрашиваем историю чата при изменении выбранного чата
        socket.send(JSON.stringify({ type: 'history_request', recipient_id: selectedChatId }));
      }
    }
  }, [selectedChatId, socket, setMessages]);

  useLayoutEffect(() => {
    if (filteredMessages.length) {
      if (isInitialScroll) {
        setTimeout(() => {
          scrollToBottom();
        }, 50);
        setIsInitialScroll(false); // Сбрасываем флаг
      } else if (isAtBottom) {
          scrollToBottom();
      }
    }
  }, [filteredMessages, isAtBottom, isInitialScroll]);

  // Фильтруем сообщения для текущего selectedChatId
  useEffect(() => {
    if (selectedChatId) {
      const transformedMessages = transformMessages(messages, user.id); // Преобразуем сообщения
      setFilteredMessages(transformedMessages);

    }
  }, [selectedChatId, messages, user]);

  return (
    <>
    <Stack height={'100%'} maxHeight={'100vh'} width={'auto'}>
    {!selectedChatId ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <Typography variant="h6" color="text.secondary">
        Пожалуйста, выберите чат
      </Typography>
    </Box>
    ) : (
        <><Header selectedChatId={selectedChatId} recipientAvatar={recipientAvatar} selectedRecipient={selectedRecipient} status={recipientData.status} lastSeen={recipientData.last_seen} />
        <Box className='scrollbar'ref={messageContainer} width={"100%"} sx={{ flexGrow: 1, height: '100%', overflowY: 'scroll' }} onScroll={handleScroll} >
              <Message menu={true} chatHistory={filteredMessages} setReply={setReply} selectedChatId={selectedChatId} />
              <Fade in={showScrollButton}>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 96,
                    width: "28px",
                    height: "28px",
                    right: 16,
                    zIndex: 1000,
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    '&:hover': { backgroundColor: theme.palette.primary.dark },
                  }}
                  onClick={scrollToBottom} // Прокрутка вниз при нажатии
                >
                  <ArrowDownwardIcon sx={{ width: "18px", height: "18px" }}/>
                </IconButton>
              </Fade>
        </Box>
        <Footer socket={socket} isConnected={isConnected} selectedChatId={selectedChatId} reply={reply} setReply={setReply} /></>
    )}
    </Stack>
    </>
  )
}

export default Conversation;