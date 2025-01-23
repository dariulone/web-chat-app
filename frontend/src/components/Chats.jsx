import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Stack, Typography, InputBase, Divider, Avatar, useMediaQuery, Menu, MenuItem, CircularProgress, Popper, Paper, Fade, InputAdornment } from
  '@mui/material'
import { MagnifyingGlass, X } from 'phosphor-react';
import { useTheme } from '@mui/material/styles';
import ChatElement from './ChatElement';
import { useWebSocket } from '../contexts/WebSocketContext';
import { searchUserByUsername } from '../server-side/userprofile';
import { debounce } from 'lodash'; // Подключение debounce
import UserBar from './UserBar';


const Chats = ({ user, setSelectedChatId, setSelectedRecipient, setRecipientAvatar }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Проверка на мобильные устройства (например, ширина меньше 600px)
  const { chatList, setChatList, setActiveChatId, markMessagesAsRead } = useWebSocket();
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState({
    existing: [],
    new: [],
  });
  const [anchorEl, setAnchorEl] = useState(null);

  const chatsRef = useRef(null); // Реф для контейнера `Chats`
  
  const [showResults, setShowResults] = useState(false);

  const timeoutRef = useRef(null);

  const handleChatClick = (chatId, username, avatar) => {
    setSelectedChatId(chatId);  // Устанавливаем выбранный чат
    setSelectedRecipient(username)
    setActiveChatId(chatId); // Устанавливаем активный чат
    setRecipientAvatar(avatar)

    // Отмечаем сообщения как прочитанные
    markMessagesAsRead(chatId);
  };

  
  // Устанавливаем `anchorEl` при монтировании компонента
  useEffect(() => {
    if (chatsRef.current) {
      setAnchorEl(chatsRef.current);
    }
  }, []);

  // Функция для обработки изменения ввода в поисковом поле
  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
  };

  // Функция для дебаунсинга поиска с задержкой 10 секунд
  const debouncedSearch = debounce(async (query) => {
    setFilteredContacts([]);

    setLoading(true)

    if (query) {
      try {
        // Фильтруем контакты, которые уже есть в chatList и соответствуют запросу
        const existingContacts = chatList.filter((contact) =>
          contact.username.toLowerCase().includes(query.toLowerCase())
        );
  
        // Ищем пользователей в базе данных
        const result = await searchUserByUsername(query);
  
        // Исключаем контакты, которые уже есть в chatList
        const newContacts = result.filter(
          (newContact) =>
            !chatList.some((existingContact) => existingContact.username === newContact.username)
        );
  
        // Обновляем состояние
        setFilteredContacts({
          existing: existingContacts,
          new: newContacts,
        });
    } catch (error) {
      console.error('Error fetching search results:', error);
    }

    }
    setLoading(false);
  }, 3000); // Задержка 10 секунд

  useEffect(() => {
    if (searchInput) {
      setLoading(true)
      debouncedSearch(searchInput); // Запускаем дебаунс
    } else {
      setFilteredContacts([]);
      setLoading(false)
    }
    return () => {
      debouncedSearch.cancel(); // Отменяем дебаунс при размонтировании компонента
    };
  }, [searchInput]);

  // Добавление нового контакта
  const handleAddNewContact = (contact) => {
    if (!chatList.some((existingContact) => existingContact.username === contact.username)) {
      setChatList(prev => [...prev, { id: contact.id, username: contact.username, pinned: false }]);
    }
    setSearchInput('');
    setFilteredContacts([]);
    setAnchorEl(null);  // Закрываем шторку
  };

  const handleClosePopper = () => {
    setAnchorEl(null);
    setSearchInput('');
  };

  return (    
    <Box ref={chatsRef} sx={{
      position: "relative", 
      width: 400, // Когда чат закрыт, его ширина 0
      transition: 'width 0.3s', // Плавное изменение ширины
      backgroundColor: theme.palette.mode === 'light' ? "#F8FAFF" : theme.palette.background.paper,
      boxShadow: '0px 0px 2px rgba(0,0,0,0.25)', // При закрытом чате тень не отображается
      overflow: 'hidden' // Чтобы скрыть контент при закрытом чате
    }}>
      <Stack p={1} spacing={2} sx={{height:"100vh"}}>
        <Stack direction="row" alignItems='center' justifyContent='center'>
          <Typography align="center" variant='h4' sx={{color:"#676767"}}>
            Чаты
          </Typography>
          {/* <IconButton>
            <CircleDashed />
          </IconButton> */}
        </Stack>

        <Stack direction="column" alignItems='center' justifyContent='space-between'>
        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
        <InputBase
          placeholder="Поиск..."
          inputProps={{ "aria-label": "search" }}
          value={searchInput}
          onChange={handleSearchChange}
          onFocus={(e) => setAnchorEl(e.target)} // Устанавливаем anchorEl на поле ввода
          sx={{
            padding: 0.5,
            borderRadius: "16px",
            flexGrow: 1,
            pl: 1, // Отступ для текста после иконки
            //border: "1px solid #3e3e3e", // Пример стиля для границы
            // borderRadius: "8px",
            //backgroundColor: "#fff", // Цвет фона
          }}
          startAdornment={
            <InputAdornment position="start">
              <MagnifyingGlass color="#709CE6" size={16} />
            </InputAdornment>
          }
          endAdornment={
            loading && (
            <InputAdornment position="end">
              <CircularProgress size={16} />
            </InputAdornment>
            )
          }
        />
          <Popper
            open={Boolean(anchorEl) && searchInput.length > 0 && !loading}
            anchorEl={anchorEl}
            placement="bottom-start"
            transition
            disablePortal // Убираем рендер через портал
            modifiers={[
              {
                name: "preventOverflow",
                options: {
                  boundary: "window", // Предотвращаем выход за границы окна
                },
              },
              {
                name: "offset",
                options: {
                  offset: [0, 0], // Смещение Popper от родительского элемента
                },
              },
            ]}
            sx={{
              width: chatsRef.current ? `${chatsRef.current.offsetWidth}px` : "100%", // Фиксированная ширина
              zIndex: 10,
              transform: "translate(0px, 100px) !important",
            }}
          >
            {({ TransitionProps }) => (
              <Fade {...TransitionProps} timeout={350}>
            <Box
              sx={{
                maxHeight: 200, 
                width: '100%', 
                overflow: 'auto', 
                //backgroundColor: 'white', 
                border: '1px solid #ccc', 
                margin: 0,
                padding: 1,
                borderRadius: '16px',
                zIndex: 1000,
                paddingTop: '8px', // Добавим отступ сверху для крестика
              }}
            >
              {/* Кнопка "крестик" для закрытия Popper */}
            <IconButton 
              onClick={handleClosePopper} 
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1100,  // Кнопка закрытия всегда будет поверх содержимого Popper
                padding: '4px', // Добавляем немного отступа вокруг крестика
                width: "24px",
                height: "24px",
              }}
            >
              <X size={16} />
            </IconButton>

              {/* Секция "Ваши контакты" */}
              {filteredContacts?.existing?.length > 0 && (
                <>
                  <Typography sx={{ fontWeight: 600, marginBottom: 1, paddingLeft: 1 }}>
                    Ваши контакты
                  </Typography>
                  {filteredContacts.existing.map((contact) => (
                    <MenuItem
                      sx={{ padding: 2 }}
                      key={`existing-${contact.id}`} // Уникальный ключ
                      onClick={() => handleChatClick(contact.id, contact.username, contact.profile_image)}
                    >
                      <Avatar
                        src={contact.profile_image || "/path/to/default_image.png"}
                        alt={contact.username || "Unknown User"}
                        sx={{ width: 24, height: 24 }}
                      />
                      <Typography sx={{ ml: 2 }}>{contact.username}</Typography>
                    </MenuItem>
                  ))}
                  <Divider sx={{ my: 1 }} />
                </>
              )}

              {/* Секция "Новые контакты" */}
              {filteredContacts?.new?.length > 0 && (
                <>
                  <Typography sx={{ fontWeight: 600, marginBottom: 1, paddingLeft: 1 }}>
                    Новые контакты
                  </Typography>
                  {filteredContacts.new.map((contact) => (
                    <MenuItem
                      sx={{ padding: 2 }}
                      key={`new-${contact.id}`} // Уникальный ключ
                      onClick={() => handleAddNewContact(contact)}
                    >
                      <Avatar
                        src={contact.profile_image || "/path/to/default_image.png"}
                        alt={contact.username || "Unknown User"}
                        sx={{ width: 24, height: 24 }}
                      />
                      <Typography sx={{ ml: 2 }}>{contact.username}</Typography>
                    </MenuItem>
                  ))}
                </>
              )}

              {/* Если контактов нет */}
              {filteredContacts?.existing?.length === 0 &&
                filteredContacts?.new?.length === 0 && (
                  <MenuItem
                    sx={{
                      height: '40px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Typography>Нет результатов</Typography>
                  </MenuItem>
                )}
            </Box>
            </Fade>
            )}
          </Popper>
        </Stack>
        </Stack>


        <Divider />

        <Stack className='scrollbar' spacing={2} direction='column' sx={{flexGrow:1, overflowY:'auto', height:'100%'}}>

            {/* <Stack spacing={2.4}>
              <Typography variant='subtitle2' sx={{color:"#676767"}}>
                Закрепленные
              </Typography>
              {chatList.filter((el)=> el.pinned).map((el)=>{
                return <ChatElement
                key={el.id}
                {...el}
                onClick={() => handleChatClick(el.id, el.username)}
              />
              })}
              
            </Stack> */}
          
          <Stack spacing={2.4}>
            <Typography variant='subtitle2' sx={{color:"#676767"}}>
              Все чаты
            </Typography>
            {chatList.filter((el)=> !el.pinned).map((el)=>{
              return <ChatElement
              key={el.id}
              {...el}
              onClick={() => handleChatClick(el.id, el.username, el.profile_image)}
            />
            })}
            
          </Stack>
          
        </Stack>
        <UserBar user={user} />
      </Stack>
    </Box>
  )
}

export default Chats;