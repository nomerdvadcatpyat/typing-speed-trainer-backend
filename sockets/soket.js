const GameSession = require('../models/gameSession');
const Keyboard = require('../models/keyboard');
const Language = require('../models/language');

const { getRoom, hasRoom, getRoomForClient, getWaitingRoomMembers, 
    setRoom, getValidRooms,
    createRoom, joinToRoom, 
    updateRoom, setNewRoomOwner, getWaitingRoomFullInfo, getGameRoom,
    leaveRoom, deleteRoom } = require('./roomsUtils');

function connectSocket(httpServer) {
  const io = require('socket.io')(httpServer, {
    cors: {
      Origin: '*',
      Methods: ["GET, PUT, PATCH, POST, DELETE"],
    }
  });


  io.on('connection', socket => {
    socket.on('get rooms', () => {
      socket.join('rooms waiters');
      socket.emit('send rooms', getValidRooms());
    });


    const updateSearchRooms = () => io.to('rooms waiters').emit('send rooms', getValidRooms());
    

    const updateGameAndWaitingRooms = async () => {
      for (let roomId of socket.rooms) {
        if(roomId === socket.id) continue;

        let roomForClient;
        const room = getRoom(roomId);
        if(room) {
          if(room && room.isRunning) {
            const gameRoom = getGameRoom(roomId);
            roomForClient = gameRoom;
          }
          else
            roomForClient = await getWaitingRoomMembers(roomId);

          io.to(roomId).emit('update room', roomForClient);
        }
      }
    }


    socket.on('create room', async data => {
      socket.leave('rooms waiters');
      const newRoom = await createRoom({...data, socketId: socket.id});
      const roomForClient = await getWaitingRoomFullInfo(newRoom.id);

      socket.join(newRoom.id);

      socket.emit('confirm create room', roomForClient);

      updateSearchRooms();
      await updateGameAndWaitingRooms();
    });



    socket.on('join to room', async ({roomId, userId}) => {
      socket.leave('rooms waiters');

      const error = await joinToRoom({ roomId, userId, socketId: socket.id });
      if(error) 
        return socket.emit('set room error', error);
      
      const room = getRoom(roomId);
      socket.join(room.id);

      const roomForClient = await getWaitingRoomFullInfo(room.id);
      socket.emit('confirm join to room', roomForClient);

      updateSearchRooms();
      await updateGameAndWaitingRooms();
    });




    const startGame = async (room, isSingle) => {
      const gameSession = await GameSession.findOne({ id: room.id });
      if(!gameSession) 
        GameSession.create({ id: room.id, textTitle: room.textTitle, length: room.text.length, isSingle: isSingle });

      io.to(room.id).emit('set prepare state');
      setTimeout(() => {
        io.to(room.id).emit('set typing state');
        room.members.forEach(member => member.startTime = new Date());
        room.isRunning = true;
      }, 5000);
    }


    socket.on('start game', async ({userId, roomId}) => {
      const userRoom = getRoom(roomId);
      const owner = userRoom.members.find(member => member.isRoomOwner);
      if(owner.id !== userId)
        return socket.emit('set room error', {
          title: 'Вы не владелец комнаты', 
          message: 'Вы были исключены потому, что изменили код страницы и попытались начать игру, не являясь владельцем комнаты'
        });

      const isSingle = userRoom.members.length === 1;
      startGame(userRoom, isSingle);
    });

    
    socket.on('start single game', async data => {
      socket.leave('rooms waiters');

      const newRoom = await createRoom({...data, socketId: socket.id});
      const roomForClient = await getWaitingRoomFullInfo(newRoom.id);

      socket.join(newRoom.id);
      socket.emit('confirm create room', roomForClient);

      startGame(newRoom, true);
    });



    socket.on('update time', async ({ roomId,  userId, inputText }) => {
      const res = await updateRoom({roomId, userId, inputText});
      if(res) {
        if(res.message === 'end') {
          const member = res.member;
          socket.emit('set end data', {endTime: (member.endTime - member.startTime) / 1000, 
            points: member.points, 
            place: member.place, 
            averageSpeed: Math.round(member.averageSpeed)
          }); 
        }
        else if(res.message === 'cheating') {
          socket.emit('set room error', { 
            title: 'Вы были исключены', 
            message: 'Возможно вы попытались вставить текст в поле для ввода или совершить какие-либо другие обманные действия.' 
          }); 
          return;
        }
      }

      await updateGameAndWaitingRooms();
    });



    socket.on('request members progress', async roomId => {
      socket.to(roomId).emit('response members progress', getGameRoom(roomId));
    });

  
    socket.on('leave room', async ({userId, roomId}) => {
      socket.leave(roomId);
      
      const newOwner = leaveRoom({userId, roomId});
      if(newOwner) 
        io.to(newOwner.socket).emit('set room owner');


      updateSearchRooms();
      await updateGameAndWaitingRooms();
    });


    socket.on('disconnecting', async reason => {
      const userRooms = [...socket.rooms].filter(room => room !== socket.id);

      userRooms.forEach(userRoomId => {
        const room = getRoom(userRoomId);
        if(room) {
          const user = room.members.find(member => member.socket === socket.id);
          if(room.isRunning) {
            room.members.forEach(member => {
              if(member.socket === user.socket) {
                member.isLeave = true;
              }
            })
          }
          else room.members = room.members.filter(member => member.socket !== socket.id);
          
          if(room.members.length === 0 || !room.members.find(member => !member.isLeave)) deleteRoom(userRoomId);
          else {
            if(user.isRoomOwner) {
              const newOwner = setNewRoomOwner(room);
              io.to(newOwner.socket).emit('set room owner');
            }
            setRoom({roomId: userRoomId, data: room});
          }
        }
      });

      updateSearchRooms();  
      await updateGameAndWaitingRooms();
    });
  });
}


module.exports = connectSocket