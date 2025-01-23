import { Box, Divider, IconButton, Link, Stack, Typography, Menu, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles'
import { DotsThreeVertical, DownloadSimple, Image, Check, CheckCircle } from 'phosphor-react';
import React from 'react';
import { format } from "date-fns";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { ReactionBarSelector } from '@charkour/react-reactions';
import { ReactionCounter } from '@charkour/react-reactions';

// Карта для настройки кастомных узлов реакций
const emojiMap = {
  satisfaction: (
    <div
      role="img"
      style={{
        boxShadow: 0,
      }}
    >
      👍
    </div>
  ),
  surprise: (
    <div
      role="img"
      style={{
        boxShadow: 0,
      }}
    >
      😮
    </div>
  ),
  sad: (
    <div
      role="img"
      style={{
        boxShadow: 0,
      }}
    >
      😢
    </div>
  ),
  love: (
    <div
      role="img"
      style={{
        boxShadow: 0,
      }}
    >
      ❤️
    </div>
  ),
  happy: (
    <div
      role="img"
      style={{
        boxShadow: 0,
      }}
    >
      😆
    </div>
  ),
  angry: (
    <div
      role="img"
      style={{
        boxShadow: 0,
      }}
    >
      😡
    </div>
  ),
};


const Message_options = [
    {
      title: "Reply",
    },
    {
      title: "Delete Message",
    },
  ];

const DocMsg = ({el,menu}) => {
    const theme = useTheme();
  return (
    <Stack direction='row' justifyContent={el.incoming ? 'start' : 'end'}>
        <Box p={1.5} sx={{
                backgroundColor: el.incoming ? theme.palette.background.default :
                    theme.palette.primary.main, borderRadius: 1.5, width: 'max-content'
            }}>
        <Stack spacing={2}>
            <Stack p={2} spacing={3} direction='row' alignItems='center' 
            sx={{backgroundColor:theme.palette.background.paper, borderRadius:1}}>
                <Image size={48}/>
                <Typography variant='caption'>
                    Abstract.png
                </Typography>
                <IconButton>
                    <DownloadSimple/>
                </IconButton>
            </Stack>
            <Typography variant='body2' sx={{color: el.incoming ? theme.palette.text : '#fff' }} >
                {el.message}
            </Typography>
        </Stack>
        </Box>
        {menu && <MessageOptions/>}
        
    </Stack>
  )
}

const LinkMsg = ({el,menu}) => {
    const theme = useTheme();
  return (
    <Stack direction='row' justifyContent={el.incoming ? 'start' : 'end'}>
        <Box p={1.5} sx={{
                backgroundColor: el.incoming ? theme.palette.background.default :
                    theme.palette.primary.main, borderRadius: 1.5, width: 'max-content'
            }}>
        <Stack spacing={2}>
            <Stack p={2} spacing={3} alignItems='start'
             sx={{backgroundColor:theme.palette.background.paper, borderRadius: 1}}>
                <img src={el.preview} alt={el.message} style={{maxHeight:210, borderRadius:'10px'}}/>
                <Stack spacing={2}>
                    <Typography variant='subtitle2'>Creating Chat App</Typography>
                    <Typography variant='subtitle2' sx={{color:theme.palette.primary.main}} 
                    component={Link} to="//https://www.youtube.com">www.youtube.com</Typography>
                </Stack>
                <Typography variant='body2' color={el.incoming ? theme.palette.text : '#fff'}>
                    {el.message}
                </Typography>
            </Stack>
        </Stack>
        </Box>
        {menu && <MessageOptions/>}
    </Stack>
  )
}

const ReplyMsg = ({el, menu, setReply}) => {
    const theme = useTheme();

    // Преобразование `el.reactions` в массив с кастомными узлами
  const reactions =
  el.reactions && typeof el.reactions === "object"
    ? Object.entries(el.reactions).map(([key, count]) => ({
        label: key,
        node: emojiMap[key]
      }))
    : [];

  return (
    <Stack direction="column">
    <Stack direction='row' justifyContent={el.incoming ? 'start' : 'end'}>
        <Box p={1} sx={{
                backgroundColor: el.incoming ? theme.palette.background.default :
                    theme.palette.primary.main, borderRadius: 1.5, width: 'max-content', minWidth: "125px"
            }}>
        <Stack spacing={1}>
          <Typography sx={{ fontSize: '11px', textAlign: "center" }} variant="caption" color={ el.incoming ? "text.secondary" : '#fff'}></Typography>
            <Stack p={1} direction='column' spacing={3} alignItems='center'
            sx={{backgroundColor:theme.palette.background.paper, borderRadius:1}}>
                <Typography variant='body2' color={theme.palette.text}>
                    {el.reply}
                </Typography>    
            </Stack>
            <Typography variant='body2' sx={{ marginLeft: "5px !important", marginRight: "5px !important", textAlign: el.incoming ? 'left' : 'right', }}color={ el.incoming ? theme.palette.text : '#fff'}>
              {el.message}
            </Typography>
        </Stack>
        {/* Реакции слева, под текстом */}
        {reactions.length > 0 && (
                    <Box
                      sx={{
                        marginTop: 0.5, // Отступ сверху
                        display: "flex",
                        justifyContent: "flex-start", // Реакции всегда слева
                        alignItems: "center", // Центрируем по вертикали
                        gap: 0.5, // Расстояние между реакциями
                        alignSelf: "flex-start", // Реакции прижаты к левому краю сообщения
                      }}
                    >
                      <ReactionCounter
                        reactions={reactions}
                        showReactsOnly={true}
                        //showTotalOnly={true}
                        bg="transparent"
                        style={{
                          fontSize: "18px",
                          display: "flex",
                          border: "2px",
                          gap: 2,
                          background: "white",
                          borderRadius: "15px",
                          padding: "2px",
                          justifyContent: "center", // Центрирование иконки реакции
                          alignItems: "center", // Центрирование внутри фона
                        }}
                      />
                    </Box>
                  )}
        </Box>
        {menu && <MessageOptions setReply={setReply} el={el} />}
        
    </Stack>
    {/* Статус сообщения */}
    <Stack
            direction="row"
            justifyContent={el.incoming ? "start" : "end"}
            alignItems="center"
            spacing={0.5}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: "11px",
                textTransform: "lowercase",
                textAlign: el.incoming ? "left" : "right",
                marginRight: el.incoming ? 0 : "4px",
              }}
            >
              {format(new Date(el.timestamp), "HH:mm")}
            </Typography>
            {!el.incoming &&
              (el.read ? (
                <Stack direction="row" spacing={-1} alignItems="center">
                  <Check size={12} color={theme.palette.primary.main} />
                  <Check size={12} color={theme.palette.primary.main} />
                </Stack>
              ) : (
                <Check size={12} color={theme.palette.text.secondary} />
              ))}
          </Stack>
    </Stack>
    
  )
}

const MediaMsg = ({el,menu, setReply}) => {
    const theme = useTheme();

    // Преобразование `el.reactions` в массив с кастомными узлами
  const reactions =
  el.reactions && typeof el.reactions === "object"
    ? Object.entries(el.reactions).map(([key, count]) => ({
        label: key,
        node: emojiMap[key]
      }))
    : [];

  return (
    <Stack direction="column">
      <Stack direction='row' justifyContent={el.incoming ? 'start' : 'end'}>
          <Box p={1.5} sx={{
                  backgroundColor: el.incoming ? theme.palette.background.default :
                      theme.palette.primary.main, borderRadius: 1.5, width: 'max-content'
              }}>
                  <Stack spacing={1}>
                      <img src={`data:image/png;base64,${el.message}`} alt={el.message} style={{maxHeight: 300 , borderRadius:'10px'}}/>
                  </Stack>
                  {/* Реакции слева, под текстом */}
                  {reactions.length > 0 && (
                    <Box
                      sx={{
                        marginTop: 0.5, // Отступ сверху
                        display: "flex",
                        justifyContent: "flex-start", // Реакции всегда слева
                        alignItems: "center", // Центрируем по вертикали
                        gap: 0.5, // Расстояние между реакциями
                        alignSelf: "flex-start", // Реакции прижаты к левому краю сообщения
                      }}
                    >
                      <ReactionCounter
                        reactions={reactions}
                        showReactsOnly={true}
                        //showTotalOnly={true}
                        bg="transparent"
                        style={{
                          fontSize: "18px",
                          display: "flex",
                          border: "2px",
                          gap: 2,
                          background: "white",
                          borderRadius: "15px",
                          padding: "2px",
                          justifyContent: "center", // Центрирование иконки реакции
                          alignItems: "center", // Центрирование внутри фона
                        }}
                      />
                    </Box>
                  )}
              </Box>
              {menu && <MessageOptions setReply={setReply} el={el} />}
        </Stack>
        <Stack
            direction="row"
            justifyContent={el.incoming ? "start" : "end"}
            alignItems="center"
            spacing={0.5}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: "11px",
                textTransform: "lowercase",
                textAlign: el.incoming ? "left" : "right",
                marginRight: el.incoming ? 0 : "4px",
              }}
            >
              {format(new Date(el.timestamp), "HH:mm")}
            </Typography>
            {!el.incoming &&
              (el.read ? (
                <Stack direction="row" spacing={-1} alignItems="center">
                  <Check size={12} color={theme.palette.primary.main} />
                  <Check size={12} color={theme.palette.primary.main} />
                </Stack>
              ) : (
                <Check size={12} color={theme.palette.text.secondary} />
              ))}
          </Stack>
    </Stack>
  )
}

const TextMsg = ({el,menu, setReply }) => {

  const theme = useTheme();

  

  // Преобразование `el.reactions` в массив с кастомными узлами
  const reactions =
    el.reactions && typeof el.reactions === "object"
      ? Object.entries(el.reactions).map(([key, count]) => ({
          label: key,
          node: emojiMap[key]
        }))
      : [];


      return (
        <Stack direction="column">
          <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
            <Box
              p={1.5}
              sx={{
                backgroundColor: el.incoming
                  ? theme.palette.background.default
                  : theme.palette.primary.main,
                borderRadius: 1.5,
                width: "max-content",
              }}
            >
              {/* Текст сообщения */}
              <Typography
                dangerouslySetInnerHTML={{ __html: el.message }}
                variant="body2"
                color={el.incoming ? theme.palette.text : "#fff"}
              />
      
              {/* Реакции слева, под текстом */}
              {reactions.length > 0 && (
                <Box
                  sx={{
                    marginTop: 0.5, // Отступ сверху
                    display: "flex",
                    justifyContent: "flex-start", // Реакции всегда слева
                    alignItems: "center", // Центрируем по вертикали
                    gap: 0.5, // Расстояние между реакциями
                    alignSelf: "flex-start", // Реакции прижаты к левому краю сообщения
                  }}
                >
                  <ReactionCounter
                    reactions={reactions}
                    showReactsOnly={true}
                    //showTotalOnly={true}
                    bg="transparent"
                    style={{
                      fontSize: "18px",
                      display: "flex",
                      border: "2px",
                      gap: 2,
                      background: "white",
                      borderRadius: "15px",
                      padding: "2px",
                      justifyContent: "center", // Центрирование иконки реакции
                      alignItems: "center", // Центрирование внутри фона
                    }}
                  />
                </Box>
              )}
            </Box>
            {menu && <MessageOptions setReply={setReply} el={el} />}
          </Stack>
      
          {/* Статус сообщения */}
          <Stack
            direction="row"
            justifyContent={el.incoming ? "start" : "end"}
            alignItems="center"
            spacing={0.5}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: "11px",
                textTransform: "lowercase",
                textAlign: el.incoming ? "left" : "right",
                marginRight: el.incoming ? 0 : "4px",
              }}
            >
              {format(new Date(el.timestamp), "HH:mm")}
            </Typography>
            {!el.incoming &&
              (el.read ? (
                <Stack direction="row" spacing={-1} alignItems="center">
                  <Check size={12} color={theme.palette.primary.main} />
                  <Check size={12} color={theme.palette.primary.main} />
                </Stack>
              ) : (
                <Check size={12} color={theme.palette.text.secondary} />
              ))}
          </Stack>
        </Stack>
      );
}

const TimeLine = ({ el }) => {
    const theme = useTheme();
    return <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Divider width='46%' />
        <Typography variant='caption' sx={{ color: theme.palette.text }}>
            {el.text}
        </Typography>
        <Divider width='46%' />
    </Stack>
}

const MessageOptions = ( {setReply, el} ) => {
  const { socket, activeChatId } = useWebSocket(); // Извлекаем socket из контекста
  const [anchorPosition, setAnchorPosition] = React.useState(null); // Позиция меню

  // Убедимся, что сообщение существует, и оно не пустое
  if (!el || !el.message) {
    return null; // Если сообщение пустое, не показываем меню
  }

  const handleReaction = (reaction) => {
    // Отправляем реакцию на сервер
    console.log(el)
    socket.send(
        JSON.stringify({
            type: "reaction",
            message_id: el.timestamp,
            chat_id: activeChatId,
            reaction,
        })
    );
    setAnchorPosition(null); // Закрываем меню
};

   // Обработчик для правой и левой кнопки мыши
  const handleMenuOpen = (event) => {
    event.preventDefault(); // Отменяем стандартное поведение браузера (особенно для правой кнопки)
    setAnchorPosition({
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
  };

  const handleClose = () => {
    setAnchorPosition(null); // Закрываем меню, сбрасывая позицию
  };

  const handleReply = () => {
    const messageToReply = el.type === "image" ? "Изображение" : el.message;
    setReply(messageToReply); // Устанавливаем текст сообщения как реплай
    handleClose(); // Закрываем меню
  };

  const handleDelete = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "delete_message",
          message_id: el.timestamp,
          chat_id: activeChatId, // ID чата
        })
      );
      handleClose();
    }
  };

  return (
    <>
    <Box
        onClick={handleMenuOpen} // Открытие меню левой кнопкой
        onContextMenu={handleMenuOpen} // Открытие меню правой кнопкой
        sx={{ display: "inline-block" }}
      >
        <DotsThreeVertical size={20} />
      </Box>

      <Menu
        open={!!anchorPosition}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          anchorPosition
            ? { top: anchorPosition.mouseY, left: anchorPosition.mouseX }
            : undefined
        }
      >
      <Stack spacing={2} px={1}>
      <ReactionBarSelector
                    iconSize={24}
                    onSelect={(reaction) => handleReaction(reaction)}
                    style={{
                        marginTop: '20px', // Отступ от остальных пунктов меню
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        padding: '4px',
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
                    }}
                />
        {Message_options.map((el)=>(
            <><MenuItem
            key={el.title}
            onClick={el.title === "Reply"
              ? handleReply
              : el.title === "Delete Message"
                ? handleDelete
                : handleClose}
          >
            {el.title}
          </MenuItem></>
        ))}
      </Stack>
      </Menu>
    </>
  )
}


// should not be default export, because we need to export multiple things
export { TimeLine, TextMsg, MediaMsg, ReplyMsg, LinkMsg, DocMsg, MessageOptions }