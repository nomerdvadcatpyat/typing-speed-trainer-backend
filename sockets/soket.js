const RoomMember = require('./RoomMember');
const Room = require('./Room');
const GameSession = require('../models/gameSession');
const UserTime = require('../models/userTime');
const User = require('../models/user');
const Keyboard = require('../models/keyboard');
const { v4: uuidv4 } = require('uuid');

let rooms = new Map();

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
      const validRooms = [...rooms.values()].filter(room => !room.isSingle && !room.isRunning);
      socket.emit('send rooms', validRooms);
    });


    const updateSearchRooms = () => {
      const notSingleRooms = [...rooms.values()].filter(room => !room.isSingle && !room.isRunning);
      io.to('rooms waiters').emit('send rooms', notSingleRooms);
    }

    const updateMembersInWaitingRooms = () => {
      socket.rooms.forEach(roomId => {
        const room = rooms.get(roomId);
        if(room) io.to(room.id).emit('update room members', room.members);
      });
    }

    const createRoom = async (data) => {
      const ownerInDb = await User.findById(data.userId);
      const owner = new RoomMember(data.userId, socket.id, ownerInDb.email);
      owner.isRoomOwner = true;
      const roomId = uuidv4();
      const newRoom = new Room(roomId, owner, data.textTitle, data.textLang, data.text, data.usersCount, data.usersCount === 1);
      return newRoom;
    }

    socket.on('create room', async data => {

      console.log('create room', data);
      
      socket.leave('rooms waiters');

      const newRoom = await createRoom(data);
      rooms.set(newRoom.id, newRoom);

      socket.join(newRoom.id);
      socket.emit('confirm create room', newRoom.id);

      updateSearchRooms();
      updateMembersInWaitingRooms();
    });



    socket.on('join to room', async ({roomId, userId}) => {

      console.log('join to room', roomId, userId);

      socket.leave('rooms waiters');
      const userInDb = await User.findById(userId);

      const room = rooms.get(roomId);
      if(!room)
        return socket.emit('reject join to room', 'Такой комнаты не существует');
      if(room.isRunning)
        return socket.emit('reject join to room', 'Игра уже началась');
      if(room.members.find(member => member.id === userId))
        return socket.emit('reject join to room', 'Вы уже есть в этой комнате');
      room.members.push(new RoomMember(userId, socket.id, userInDb.email));
      rooms.set(room.id, room);
      socket.join(room.id);

      const keyboardLayout = await Keyboard.findOne({ language: room.textLang });

      socket.emit('confirm join to room', {roomId: room.id, text: room.text, keyboardLayout: keyboardLayout.layout});

      updateSearchRooms();
      updateMembersInWaitingRooms();
    });




    const startGame = async (room, isSingle) => {

      console.log('start game', isSingle);

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
      const userRoom = rooms.get(roomId);
      const owner = userRoom.members.find(member => member.isRoomOwner);
      if(owner.id !== userId) {
        return socket.emit('reject start game', 'Вы не владелец комнаты');
      }
      const isSingle = userRoom.members.length === 1;
      startGame(userRoom, isSingle);
    });


    
    socket.on('start single game', async data => {
      console.log('start single game', data);

      const newRoom = await createRoom(data);
      rooms.set(newRoom.id, newRoom);
      socket.join(newRoom.id);
      socket.emit('confirm create room', newRoom.id);

      startGame(newRoom, true);
    });



    const isCheating = (oldInputText, newInput) => newInput.length - oldInputText.length > 12.5 * 4;

    socket.on('update time', async ({ roomId,  userId, inputText }) => {
      console.log('update time', roomId, userId, inputText, socket.rooms);
      if(!rooms.get(roomId)) {
        console.log('no such room');
        return;
      }

      // тут 0 это будет айди самого чела или группы, неизвестно.
      const member = rooms
                    .get(roomId)
                    .members
                    .find(groupMember => groupMember.id === userId);

      member.lastUpdateTime = new Date();
      if(isCheating(member.inputText, inputText)) {
        // кик если человек вводит текст со скоростью выше чем 750 знаков в минуту
        // 750зн/м - мировой рекорд. Проверки на читерство лучше ничего не придумал.
        socket.emit('kick user'); 
        return;
      }

      member.inputText = inputText;

      if(inputText === rooms.get(roomId).text) {
        member.endTime = member.lastUpdateTime;
        console.log('set end time', member.endTime, member.startTime);
        socket.emit('set end time', member.endTime - member.startTime);   
        const gameSession = await GameSession.findOne({ id: roomId });
        const user = await User.findById(userId);
        UserTime.create({ gameSession, user, startTime: member.startTime, endTime: member.endTime });
      }
    });


    socket.on('request members progress', roomId => {
      const room = rooms.get(roomId);
      socket.to(roomId).emit('response members progress', room.members);
    });


    const setNewRoomOwner = (room) => room.members[0].isRoomOwner = true;
  
    socket.on('leave room', ({userId, roomId}) => {
      console.log('leave room before', userId, roomId, rooms);
      const userRoom = rooms.get(roomId);
      const user = userRoom.members.find(groupMember => groupMember.id === userId);
      userRoom.members = userRoom.members.filter(groupMember => groupMember.id !== userId);
      if(userRoom.members.length === 0) rooms.delete(roomId);
      else {
        if(user.isRoomOwner)
          setNewRoomOwner(userRoom);
        rooms.set(roomId, userRoom);
      }

      console.log('leave room after', rooms);

      updateSearchRooms();
      updateMembersInWaitingRooms();
    });



    socket.on('disconnecting', reason => {
      console.log('disconnecting', socket.rooms, socket.id);
      const userRooms = [...socket.rooms].filter(room => room !== socket.id);

      userRooms.forEach(userRoomId => {
        const room = rooms.get(userRoomId);
        if(room) {
          const user = room.members.find(member => member.socket === socket.id);
          room.members = room.members.filter(member => member.socket !== socket.id);
          if(room.members.length === 0) rooms.delete(userRoomId);
          else {
            if(user.isRoomOwner)
              setNewRoomOwner(room);
            rooms.set(userRoomId, room);
          }
        }
      });

      console.log('disconnecting rooms', rooms);

      updateSearchRooms();  
      updateMembersInWaitingRooms();
    });
  });
}


module.exports = connectSocket