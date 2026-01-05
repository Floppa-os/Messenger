const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Статические файлы
app.use(express.static(path.join(__dirname, '../client')));

// Хранение сообщений
let messages = [];

io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.id);

  // Отправка истории сообщений новому клиенту
  socket.emit('load_messages', messages);

  // Получение сообщения
  socket.on('send_message', (data) => {
    messages.push(data);
    io.emit('new_message', data);
  });

  // Получение файла
  socket.on('send_file', (data) => {
    const filePath = path.join(__dirname, '../client/uploads', data.filename);
    fs.writeFile(filePath, data.file, (err) => {
      if (err) {
        console.error('Ошибка сохранения файла:', err);
        return;
      }
      const fileData = {
        type: 'file',
        filename: data.filename,
        url: `/uploads/${data.filename}`,
        timestamp: new Date().toISOString()
      };
      messages.push(fileData);
      io.emit('new_message', fileData);
    });
  });

  socket.on('disconnect', () => {
    console.log('Пользователь отключился:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Сервер запущен на http://localhost:3000');
});
