import { Box, Fab, IconButton, InputAdornment, Stack, TextField, Tooltip, Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from '@mui/material';
import React, { useState, useRef } from 'react';
import { styled, useTheme } from "@mui/material/styles";
import { LinkSimple, PaperPlaneRight, Smiley,Camera, File, Image, Sticker, User, X } from 'phosphor-react';
import Picker from '@emoji-mart/react'
import ContentEditable from "react-contenteditable";
import appleEmojisData from '@emoji-mart/data/sets/14/apple.json'
import { motion } from 'framer-motion'; // Импортируем framer-motion


const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

  const Actions = [
    {
        color:'#4da5fe',
        icon: <Image size={24}/>,
        y:102,
        title:'Изображения',
    },
  ];

  const ChatInput = ({
    input,
    setInput,
    openFileDialog,
    setOpenPicker,
    openAction,
    setOpenAction,
    handleSendMessage,
    contentEditableRef,
  }) => {
    

      // Обработчик изменения текста
    const handleChange = (evt) => {
      const newText = evt.target.value;

      // Проверяем, если в поле только <br>, то очищаем его
      if (newText === "<br>" || newText.replace(/<br>/g, '').trim() === "") {
        setInput(""); // Очищаем поле
      } else {
        setInput(newText); // Обновляем текст
      }
    };


    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { // Проверяем, что Enter был нажат без Shift
        e.preventDefault(); // Отключаем стандартное поведение (перенос строки)
        handleSendMessage(); // Вызываем функцию отправки сообщения
      }
    };

  
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "5px",
          width: "100%",
          backgroundColor: "rgba(145, 158, 171, 0.12)"
        }}
      >
        
        {/* Кнопки слева */}
        <Stack sx={{ width: "max-content" }}>
          <Stack
            sx={{
              position: "relative",
              display: openAction ? "inline-block" : "none",
            }}
          >
            {Actions.map((el) => (
              <Tooltip key={el.title} placement="right" title={el.title}>
                <Fab
                  sx={{
                    position: "absolute",
                    top: -el.y,
                    backgroundColor: el.color,
                  }}
                  onClick={el.title === "Изображения" ? openFileDialog : null}
                >
                  {el.icon}
                </Fab>
              </Tooltip>
            ))}
          </Stack>
          <InputAdornment position="start" sx={{ marginRight: "8px" }}>
            <IconButton sx={{
              color: "rgb(99, 115, 129)",
              borderRadius: "50%",
              "&:hover":
              {
                transition: "background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                backgroundColor: "rgb(223, 223, 223)",
              }
            }} onClick={() => setOpenAction((prev) => !prev)}>
              <LinkSimple/>
            </IconButton>
          </InputAdornment>
        </Stack>
  
        {/* Редактируемое поле */}
        <ContentEditable
        innerRef={contentEditableRef}   // Привязываем ссылку
        html={input}                    // Текущий HTML-контент
        disabled={false}                // Разрешаем редактирование
        onChange={handleChange}
        onKeyDown={handleKeyDown}         
        tagName='article'               // Указываем, что это будет тег 'article'
        style={{
          flex: 1,
          minHeight: "18px",
          outline: "none",
          overflow: "auto",
          resize: "none",
        }}
      />
       <style>
        {`
          article {
            font-size: 16px;
          }
          article .emoji {
            font-size: 24px;  // Увеличиваем размер эмодзи
          }
        `}
      </style>
  
        {/* Кнопки справа */}
        <InputAdornment position="end" sx={{ marginLeft: "8px" }}>
          <IconButton sx={{
              color: "rgb(99, 115, 129)",
              borderRadius: "50%",
              "&:hover":
              {
                transition: "background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                backgroundColor: "rgb(223, 223, 223)",
              }
            }}
          onClick={() => setOpenPicker((prev) => !prev)}>
            <Smiley />
          </IconButton>
        </InputAdornment>
      </Box>
    );
  };

const Footer = ({ socket, isConnected, selectedChatId, reply, setReply }) => {
    const theme = useTheme();
    const [openPicker, setOpenPicker] = useState(false);
    const [input, setInput] = useState(""); // Состояние для текста сообщения
    const [imageFile, setImageFile] = useState(null); // Состояние для выбранного изображения
    const [openDialog, setOpenDialog] = useState(false); // Состояние для открытия диалога
    const [base64Image, setBase64Image] = useState(null); // Состояние для Base64 изображения
    const [openFullImage, setOpenFullImage] = useState(false); // Состояние для открытия изображения в полном размере
    const [openAction, setOpenAction] = useState(false); // State for toggling actions
    const contentEditableRef = useRef(null);  // Ссылка на элемент ContentEditable
    //console.log(contentEditableRef.current.innerText.length)

  // Функция для отправки сообщения
  const handleSendMessage = async () => {
    //console.log(socket, isConnected, input, selectedChatId)
    const input = contentEditableRef.current.innerHTML;
    if (socket && isConnected && input.trim().length > 0 && selectedChatId) {
        socket.send(
            JSON.stringify({
                type: reply ? "reply" : "message", // Указываем тип в зависимости от наличия реплая
                recipient_id: selectedChatId,
                message: input,
                reply: reply, // Добавляем текст реплая, если он есть
            })
        );
        setInput(""); // Очищаем поле ввода после отправки
        setReply(null); // Сбрасываем реплай после отправки
    }
};

  const handleSendImage = async () => {
    if (imageFile && socket && isConnected && selectedChatId) {
      try {
        socket.send(
          JSON.stringify({
            type: "image",
            recipient_id: selectedChatId,
            image: base64Image.split(',')[1], // Отправляем только строку Base64 (без префикса)
          })
        );
        setBase64Image(null); // Очищаем Base64 изображение после отправки
        setImageFile(null); // Очищаем изображение
        setOpenDialog(false); // Закрываем диалог
        setOpenAction(false)
      } catch (error) {
        console.error("Ошибка при конвертации изображения в Base64:", error);
      }
    }
  };

  // Обработчик для выбора изображения
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      getBase64(file).then((base64) => {
        setBase64Image(base64); // Конвертируем изображение в Base64
        setOpenDialog(true); // Открываем модальное окно для предпросмотра
      }).catch((error) => {
        console.error("Ошибка при чтении файла:", error);
      });
    } else {
      alert("Please select a valid image file.");
    }
  };

  // Открытие диалога при нажатии на кнопку "Photo/Video"
  const openFileDialog = () => {
    document.getElementById('image-upload').click();
  };

  // Функция для открытия изображения в полном размере
  const handleImageClick = () => {
    setOpenFullImage(true);
  };

  // Закрытие окна с полным изображением
  const handleCloseFullImage = () => {
    setOpenFullImage(false);
  };

  const handleEmoji = (emoji) => {
    // Вставляем emoji.native в тэг span для корректного отображения
    setInput((prevInput) => prevInput + emoji.native);  // Вставляем в строку
  };

  // Закрытие реплая
  const handleCloseReply = () => {
    setReply(null);  // Убираем реплай
  };
  

  return (
    <Box p={1} sx={{ padding: "16px", width:'100%', backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper, boxShadow:'0px 0px 2px rgba(0,0,0,0.25)'}}>
      <Stack direction='row' alignItems={'center'} spacing={0}>
          <Stack sx={{width:'100%'}}> 
              {/* Chat Input */}
              <Box sx={{ display: openPicker ? 'inline' : 'none' , zIndex:10, position:'fixed',bottom:81, right:100}}>
                  <Picker data={appleEmojisData} theme={theme.palette.mode} onEmojiSelect={handleEmoji}/>
              </Box>
              {reply && ( // Отображение текста реплая с кнопкой для его закрытия
                        <Box
                            sx={{
                                backgroundColor: theme.palette.background.paper,
                                padding: 1,
                                borderRadius: 1,
                                marginBottom: 1,
                                border: `1px solid ${theme.palette.divider}`,
                                display: 'flex',
                                justifyContent: 'space-between', // Располагаем элементы с краю
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                {reply}
                            </Typography>
                            <IconButton onClick={handleCloseReply}> 
                                <X size={16} />  {/* Крестик для закрытия реплая */}
                            </IconButton>
                        </Box>
                    )} 
              <ChatInput contentEditableRef={contentEditableRef} handleSendMessage={handleSendMessage} setOpenPicker={setOpenPicker} input={input} setInput={setInput} handleImageChange={handleImageChange} openFileDialog={openFileDialog} setOpenAction={setOpenAction} openAction={openAction}/>
          </Stack>
      
        <Box sx={{
          borderRadius: 1.5,
          visibility: input.length > 1 ? 'visible' : 'hidden'
          }}>
            <Stack sx={{height:'100%', width:'100%', alignItems:'center', justifyContent:'center'}}>
            <motion.div
              initial={{ opacity: 0, x: -100 }} // Изначальное состояние (невидимо и сдвинуто влево)
              animate={{ opacity: input.length > 1 ? 1 : 0, x: input.length > 1 ? 0 : -10 }} // Когда текст больше 1 символа — иконка видна и в исходной позиции
              transition={{ type: "spring", stiffness: 300 }} // Применяем плавную анимацию
              //whileHover={{ scale: 1.1 }} // Добавляем вращение при наведении
            >
                <IconButton sx={{width: "44px", height:"40px"}} onClick={handleSendMessage}>
                    <PaperPlaneRight fontSize="56px" color={theme.palette.primary.main}/>
                </IconButton>
            </motion.div>
            </Stack>
        </Box>

      </Stack>

      {/* Dialog для предпросмотра изображения */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Предпросмотр</DialogTitle>
        <DialogContent>
          {base64Image && (
            <img
              src={base64Image}
              alt="Preview"
              style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', cursor: 'pointer' }} 
              onClick={handleImageClick} // При клике открываем изображение в полном размере
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">Отмена</Button>
          <Button onClick={handleSendImage} color="secondary">Отправить</Button>
        </DialogActions>
      </Dialog>

     {/* Модальное окно с полным изображением */}
        {openFullImage && (
          <Dialog
            open={openFullImage}
            onClose={handleCloseFullImage}
            fullWidth // Окно будет растягиваться на всю ширину
            maxWidth
          >
            <DialogContent sx={{padding: 0}}>
              <img 
                src={base64Image} 
                alt="Full Size" 
                style={{
                  width: '100%', 
                  height: 'auto', 
                  objectFit: 'contain', // Масштабируем изображение в рамках окна, сохраняя пропорции
                  maxHeight: '100%', // Ограничаем изображение по высоте
                }} 
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseFullImage}>Закрыть</Button>
            </DialogActions>
          </Dialog>
        )}

      {/* Скрытый input для выбора изображения */}
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: "none" }}
        id="image-upload"
      />

    </Box>
  );
};

export default Footer;