const GameSession = require('../models/gameSession');
const Keyboard = require('../models/keyboard');
const { getRoom, hasRoom, getRoomForClient,
    setRoom, getValidRooms,
    createRoom, joinToRoom, 
    updateRoom, setNewRoomOwner, 
    leaveRoom, deleteRoom } = require('./roomsUtils');

function connectSocket(httpServer) {
  const io = require('socket.io')(httpServer, {
    cors: {
      Origin: '*',
      Methods: ["GET, PUT, PATCH, POST, DELETE"],
    }
  });


  io.on('connection', socket => {
    console.log(socket.id);

    socket.on('get rooms', () => {
      socket.join('rooms waiters');
      socket.emit('send rooms', getValidRooms());
    });

    const updateSearchRooms = () => io.to('rooms waiters').emit('send rooms', getValidRooms());
    
    const updateMembersInWaitingRooms = () => {
      socket.rooms.forEach(roomId => {
        if(hasRoom(roomId)) io.to(roomId).emit('update room members', getRoomForClient(roomId));
      });
    }

    socket.on('create room', async data => {
      socket.leave('rooms waiters');

      const newRoom = await createRoom({...data, socketId: socket.id});

      socket.join(newRoom.id);
      socket.emit('confirm create room', newRoom.id);

      updateSearchRooms();
      updateMembersInWaitingRooms();
    });



    socket.on('join to room', async ({roomId, userId}) => {
      socket.leave('rooms waiters');

      const error = await joinToRoom({ roomId, userId, socketId: socket.id });
      if(error) 
        return socket.emit('reject join to room', error.message);
      
      const room = getRoom(roomId);
      socket.join(room.id);
      const keyboardLayout = await Keyboard.findOne({ language: room.textLang });
      socket.emit('confirm join to room', {roomId: room.id, text: room.text, keyboardLayout: keyboardLayout.layout});

      updateSearchRooms();
      updateMembersInWaitingRooms();
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
        return socket.emit('reject start game', 'Вы не владелец комнаты');

      const isSingle = userRoom.members.length === 1;
      startGame(userRoom, isSingle);
    });

    
    socket.on('start single game', async data => {
      console.log('start single game', data);

      const newRoom = await createRoom({...data, socketId: socket.id });

      socket.join(newRoom.id);
      socket.emit('confirm create room', newRoom.id);

      startGame(newRoom, true);
    });


    socket.on('update time', async ({ roomId,  userId, inputText }) => {
      console.log('update time', roomId, userId, inputText, socket.rooms);

      const res = await updateRoom({roomId, userId, inputText});
      if(res) {
        if(res.message === 'end') {
          const member = res.member;
          socket.emit('set end time', member.endTime - member.startTime); 
        }
        else if(res.message === 'cheating')
          socket.emit('kick user'); 
      }

      updateMembersInWaitingRooms();
    });


    socket.on('request members progress', roomId => {
      socket.to(roomId).emit('response members progress', getRoomForClient(roomId));
    });

  
    socket.on('leave room', ({userId, roomId}) => {
      const newOwner = leaveRoom({userId, roomId});
      if(newOwner) 
        io.to(newOwner.socket).emit('set room owner');

      
      updateSearchRooms();
      updateMembersInWaitingRooms();
    });



    socket.on('disconnecting', reason => {
      console.log('disconnecting', socket.rooms, socket.id);
      const userRooms = [...socket.rooms].filter(room => room !== socket.id);

      userRooms.forEach(userRoomId => {
        const room = getRoom(userRoomId);
        if(room) {
          const user = room.members.find(member => member.socket === socket.id);
          room.members = room.members.filter(member => member.socket !== socket.id);
          if(room.members.length === 0) deleteRoom(userRoomId);
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
      updateMembersInWaitingRooms();
    });
  });
}


module.exports = connectSocket