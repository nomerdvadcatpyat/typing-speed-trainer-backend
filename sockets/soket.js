const RoomMember = require('./RoomMember');
const Room = require('./Room');
const GameSession = require('../models/gameSession');
const UserTime = require('../models/userTime');
const User = require('../models/user');
const { v4: uuidv4 } = require('uuid');

let rooms = [];

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
      const notSingleRooms = rooms.filter(roomObj => !roomObj.room.isSingle);
      console.log('send rooms', notSingleRooms);
      socket.emit('send rooms', notSingleRooms);
    });

    

    socket.on('create room', data => {
      socket.leave('rooms waiters');

      console.log('create room', data);
      const owner = new RoomMember(data.userId, socket.id);
      const roomId = uuidv4();
      const newRoom = new Room(roomId, owner, data.textTitle, data.text, data.usersCount === 1);
      rooms.push({id: roomId, room: newRoom});

      socket.join(roomId);
      socket.emit('confirm create room', roomId);

      const notSingleRooms = rooms.filter(roomObj => !roomObj.room.isSingle);
      socket.to('rooms waiters').emit('send rooms', notSingleRooms);
    });



    socket.on('join room', data => {
      socket.leave('rooms waiters');



    });



    // Вот это с фильтром переделать.
    const getRoom = () => rooms.filter(room => socket.rooms.has(room.id))[0].room;
    const getRoomMember = (room, id) => room.members.filter(member => member.id === id)[0];

    socket.on('start game', async userId => {
      const userRoom = getRoom();
      const isSingle = userRoom.members.length === 1; 

      const gameSession = await GameSession.findOne({ id: userRoom.id });
      if(!gameSession) 
        GameSession.create({ id: userRoom.id, textTitle: userRoom.textTitle, length: userRoom.text.length, isSingle: isSingle });
      
      setTimeout(() => {
        socket.emit('set typing state');
        const member = getRoomMember(userRoom, userId);
        if(member) member.startTime = new Date();
      }, 5000);
    });



    const isCheating = (oldInputText, newInput) => newInput.length - oldInputText.length > 12.5;

    socket.on('update time', async ({ roomId,  userId, inputText }) => {
      console.log('update time', roomId, userId, inputText, socket.rooms);
      if(!rooms.find(room => room.id === roomId)) {
        console.log('no such room');
        return;
      }

      // тут 0 это будет айди самого чела или группы, неизвестно.
      const member = rooms.filter(room => room.id === roomId)[0]
                      .room
                      .members
                      .filter(groupMember => groupMember.id === userId)[0];

      member.lastUpdateTime = new Date();
      if(isCheating(member.inputText, inputText)) {
        // кик если человек вводит текст со скоростью выше чем 750 знаков в минуту
        // 750зн/м - мировой рекорд. Проверки на читерство лучше ничего не придумал.
        socket.emit('kick user'); 
        return;
      }

      member.inputText = inputText; 

      if(inputText === rooms.filter(room => room.id === roomId)[0].room.text) {
        member.endTime = member.lastUpdateTime;
        console.log('set end time');
        socket.emit('set end time', member.endTime - member.startTime);
        const gameSession = await GameSession.findOne({ id: roomId });
        const user = await User.findById(userId);
        UserTime.create({ gameSession, user, startTime: member.startTime, endTime: member.endTime });
      }
    });



    socket.on('leave room', userId => {
      console.log('leave room before', userId, rooms);
      const userRoom = getRoom();
      userRoom.members = userRoom.members.filter(groupMember => groupMember.id !== userId);

      let isGroupDeleted = userRoom.members.length === 0;

      if(isGroupDeleted) rooms = rooms.filter(roomObj => roomObj.id !== userRoom.id);
      else rooms = ([...rooms, {id: userRoom.id, room: userRoom}]);

      console.log('leave room after', rooms);

      const notSingleRooms = rooms.filter(roomObj => !roomObj.room.isSingle);
      socket.to('rooms waiters').emit('send rooms', notSingleRooms);
    });



    socket.on('disconnecting', reason => {
      console.log('disconnecting', socket.rooms, socket.id);
      const userRooms = [...socket.rooms].filter(room => room !== socket.id);
      const roomsForDelete = [];
      const changedRooms = [];
      userRooms.forEach(userRoom => {
        const roomObj = rooms.filter(room => room.id === userRoom)[0];
        roomObj.room.members = roomObj.room.members.filter(member => member.socket !== socket.id);
        if(roomObj.room.members.length === 0) roomsForDelete.push(userRoom);
        changedRooms.push(roomObj);
      });
      rooms = rooms.filter(room => room.id !== userRooms);
      rooms = [...rooms, ...changedRooms];
      rooms = rooms.filter(room => !roomsForDelete.includes(room.id));

      const notSingleRooms = rooms.filter(roomObj => !roomObj.room.isSingle);
      socket.to('rooms waiters').emit('send rooms', notSingleRooms);
    });

    socket.on('disconnect', reason => {
      console.log('disconnect', socket.rooms, socket.id);
    });

  });
}


module.exports = connectSocket