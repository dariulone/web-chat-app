import React, { createContext, useContext, useEffect, useState } from "react";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ user, children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messageQueue, setMessageQueue] = useState([]); // Очередь сообщений
  const [userStatuses, setUserStatuses] = useState({}); // Хранение статусов пользователей

  useEffect(() => {
    if (!user) return;

    let ws;
    let pingInterval;

    const connectWebSocket = () => {
      ws = new WebSocket(`ws://localhost:8000/ws/chat/${user.id}`);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setSocket(ws);

        // Запрос на получение списка контактов
        ws.send(JSON.stringify({ type: "contact_list_request" }));

        // Периодическая отправка пинга на сервер (например, каждые 30 секунд)
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping", user_id: user.id }));
          }
        }, 30000); // 30 секунд
      
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (!data.type) {
          console.warn("Received message without type:", data);
          return;
        }

        console.log("WebSocket message received:", data);

        // Добавляем новое сообщение в очередь
        setMessageQueue((prevQueue) => [...prevQueue, data]);
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed. Code: ${event.code}. Reconnecting...`);
        setIsConnected(false);

        // Переподключение через 5 секунд
        setTimeout(connectWebSocket, 5000);
        clearInterval(pingInterval);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (pingInterval) clearInterval(pingInterval); // Очистка интервала при размонтировании
    };
  }, [user]);

  // Обрабатываем очередь сообщений
  useEffect(() => {
    if (messageQueue.length > 0) {
      const message = messageQueue[0]; // Извлекаем первое сообщение из очереди

      // В зависимости от типа сообщения обрабатываем его
      switch (message.type) {
        // case "ping":



        case "status_update":
          handleStatusUpdate(message);
          break;
        
        case "profile_update":
          handleProfileUpdate(message);
          break;

        case "delete_message":
          handleDeleteMessage(message);
          break;

        case "read_status_update":
          handleReadStatusUpdate(message);
          break;

        case "contact_list":
          handleContactListUpdate(message.contacts);
          break;
          
        case "reply":
        case "image":
        case "message":
          handleNewMessage(message);
          break;

        case "history_response":
          handleHistoryResponse(message.messages);
          break;
        
        case "reaction_update": // Новый тип обработки
          handleReactionUpdate(message);
          break;

        default:
          console.warn("Unknown message type:", message.type);
      }

      // Удаляем обработанное сообщение из очереди
      setMessageQueue((prevQueue) => prevQueue.slice(1));
    }
  }, [messageQueue]); // Когда очередь обновляется, она будет обработана


  // Обработчик обновления профиля
  const handleProfileUpdate = (data) => {
    const { user_id, updated_data } = data;

    // Обновляем список чатов
    setChatList((prevChatList) =>
      prevChatList.map((chat) =>
        chat.id === parseInt(user_id)
          ? { ...chat, ...updated_data }
          : chat
      )
    );

    // Обновляем статус пользователя (например, имя, аватар)
    setUserStatuses((prevStatuses) => ({
      ...prevStatuses,
      [user_id]: {
        ...prevStatuses[user_id],
        ...updated_data,
      },
      }));
    };

  const handleDeleteMessage = (data) => {
    const { message_id } = data;
  
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.timestamp !== message_id)
    );
  
    setChatList((prevChatList) =>
      prevChatList.map((chat) => ({
        ...chat,
        unread:
          chat.unread > 0 && chat.id === data.chat_id ? chat.unread - 1 : chat.unread,
      }))
    );
  };

  const handleReadStatusUpdate = ({ chat_id, timestamps }) => {
    // Обновляем статус прочитанных сообщений
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        timestamps.includes(msg.timestamp) ? { ...msg, read: true } : msg
      )
    );

    // Обновляем список чатов
    setChatList((prevChatList) =>
      prevChatList.map((chat) =>
        chat.id === chat_id ? { ...chat, unread: 0 } : chat
      )
    );
  };

  const handleContactListUpdate = (contacts) => {
    setChatList(
      contacts.map((contact) => ({
        ...contact,
      }))
    );
  };
  

  const handleNewMessage = (data) => {
    setMessages((prevMessages) => [...prevMessages, data]);
    // Помечаем как прочитанное, если сообщение относится к активному чату
    if (
      parseInt(activeChatId) === parseInt(data.sender_id) // Входящее сообщение
    ) {
      setTimeout(() => {
        markMessagesAsRead(activeChatId);
      }, 500); // Задержка 500 миллисекунд
    } else {
    }
    let updatedMessage;

    if (data.type === "image") {
      updatedMessage = "Изображение"
    }

    if (data.type === "reply") {
      updatedMessage = `Ответ: ${data.message}`
    }
    if (data.type === "message") {
      updatedMessage = data.message
    }
    // Обновляем список чатов для второго пользователя: увеличиваем количество непрочитанных сообщений
    setChatList((prevChatList) =>
      prevChatList.map((chat) => {
        // Проверяем, если это чат с участником сообщения (sender_id или recipient_id)
        if (parseInt(chat.id) === parseInt(data.sender_id) || parseInt(chat.id) === parseInt(data.recipient_id)) {
          // Если текущий пользователь — это отправитель
          if (parseInt(data.sender_id) === parseInt(user.id)) {
            return {
              ...chat,
              msg: updatedMessage,
              time: data.timestamp, // Обновляем сообщение и время
            };
          }
    
          // Если текущий пользователь — это получатель
          if (parseInt(chat.id) === parseInt(data.sender_id)) {
            return {
              ...chat,
              msg: updatedMessage,
              time: data.timestamp, // Обновляем сообщение и время
              unread: chat.id !== activeChatId ? chat.unread + 1 : chat.unread, // Увеличиваем unread, если chat.id !== activeChatId
            };
          }
        }
    
        // Если чат не связан с сообщением, возвращаем его без изменений
        return chat;
      })
    );
  };

  const handleHistoryResponse = (messages) => {
    if (Array.isArray(messages)) {
      setMessages((prevMessages) => [...messages, ...prevMessages]);
    } else {
      console.warn("Invalid data format for history_response:", messages);
    }
  };

  const markMessagesAsRead = (chatId) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "mark_as_read",
          chat_id: chatId,
        })
      );

      //Обновляем локально chatList
      setChatList((prevChatList) =>
        prevChatList.map((chat) =>
          chat.id === chatId ? { ...chat, unread: 0 } : chat
        )
      );
    } else {
      console.error("WebSocket is not open. Cannot send 'mark_as_read'.");
    }
  };

  const handleReactionUpdate = (data) => {
    const { message_id, reaction, chat_id } = data;
  
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.timestamp === message_id) {
          const reactions = msg.reactions || {};
          return {
            ...msg,
            reactions: {
              ...reactions,
              [reaction]: (reactions[reaction] || 0) + 1,
            },
          };
        }
        return msg;
      })
    );

  };

  const handleStatusUpdate = (data) => {
    setUserStatuses((prev) => ({
      ...prev,
      [data.user_id]: {
        status: data.status,
        last_seen: data.last_seen,
      },
    }));
  };
  

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        chatList,
        setChatList,
        messages,
        setMessages,
        activeChatId,
        setActiveChatId,
        markMessagesAsRead,
        userStatuses,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
