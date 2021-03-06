const { v4: uuidv4 } = require('uuid');
const UserTime = require('../models/userTime');
const User = require('../models/user');
const Text = require('../models/text');
const Language = require('../models/language');
const RoomMember = require('./RoomMember');
const Room = require('./Room');
const Keyboard = require('../models/keyboard');
const GameSession = require('../models/gameSession');

let rooms = new Map();

exports.getRoom = roomId => rooms.get(roomId);

exports.getGameRoom = roomId => rooms.get(roomId).members.map((member) => ({
  userName: member.userName,
  inputText: member.inputText,
  isRoomOwner: member.isRoomOwner,
  isLeave: member.isLeave
}));

exports.getWaitingRoomMembers = async roomId => {
  const room = rooms.get(roomId);

  const members = await Promise.all(
    room.members.map(member => new Promise((res, rej) => {
      User.findById(member.id)
          .then(user => res({
            userName: user.login,
            points: user.points,
            averageSpeed: Math.round(user.averageSpeed),
            gamesCount: user.gamesCount,
            isRoomOwner: member.isRoomOwner
          }))
          .catch(err => rej(err));
    }))
  );

  return members;
}


exports.getWaitingRoomFullInfo = async roomId => {
  const room = rooms.get(roomId);

  const members = await this.getWaitingRoomMembers(roomId);

  const language = await Language.findOne({ name: room.textLang });
  const keyboardLayout = await Keyboard.findOne({ language: language._id });

  const roomInfo = {
    roomId: room.id,
    textTitle: room.textTitle,
    text: room.text,
    language: room.textLang,
    maxMembersCount: room.maxMembers,
    keyboardLayout: keyboardLayout.layout
  }

  return ({
    roomInfo,
    members
  });
}


exports.hasRoom = roomId => rooms.has(roomId);

exports.setRoom = ({roomId, data}) => rooms.set(roomId, data); 

exports.deleteRoom = roomId => {
  rooms.delete(roomId);
}

exports.getValidRooms = () => [...rooms.values()].filter(room => !(room.isSingle ||
                                                                  room.isRunning || 
                                                                  room.members.length === +room.maxMembers));


exports.createRoom = async ({ textTitle, length, maxMembersCount, userId, socketId }) => {
  const ownerInDb = await User.findById(userId);
  const owner = new RoomMember(userId, socketId, ownerInDb.login);
  owner.isRoomOwner = true;
  const roomId = uuidv4();

  const data = await Text.findOne({ title: textTitle});
  const text = data.text.substr(0, +length).replace(/\s+/g, ' ');
  const textLang = await Language.findById(data.language);

  const newRoom = new Room(
    roomId,
    owner, 
    textTitle, 
    textLang.name, 
    text, 
    +maxMembersCount, 
    +maxMembersCount === 1
  );
  
  rooms.set(newRoom.id, newRoom);
  return newRoom;
}       


const getError = ({room, userId}) => {
  if(!room)
    return { 
      title: 'Такой комнаты не существует.',
      message: 'Вы попытались подключиться к комнате, которой не существует.'
    };
  else if(room.isRunning)
    return { 
      title: 'Игра уже началась.',
      message: 'Не удалось подключиться к комнате, потому что игра в ней уже началась.'
     };
  else if(room.members.find(member => member.id === userId))
    return { 
      title: 'Вы уже есть в этой комнате.',
      message: 'Вы попытались подключиться к комнате, в которой вы уже находитесь.' 
    };
  else if(room.members.length >= room.maxMembers) 
    return { 
      titile: 'В комнате максимальное количество игроков.',
      message: 'Вы попытались подключиться к комнате, в которой уже нет места.'
    };
}



exports.joinToRoom = async ({roomId, userId, socketId}) => {
  const userInDb = await User.findById(userId);

  const room = rooms.get(roomId);
  const error = getError({room, userId});
  if(error) 
    return error;

  room.members.push(new RoomMember(userId, socketId, userInDb.login));
  rooms.set(room.id, room);
}



exports.updateRoom = async ({roomId, userId, inputText}) => {
  const room = rooms.get(roomId);
  const member = room
                .members
                .find(groupMember => groupMember.id === userId);

  member.lastUpdateTime = new Date();

  if(isCheating(member.inputText, inputText))
    return { message: 'cheating' };

  member.inputText = inputText;

  if(member.inputText === room.text)
    return await setEndTime({member, room});
}



exports.setNewRoomOwner = room => {
  room.members[0].isRoomOwner = true;
  return room.members[0];
}


exports.leaveRoom = ({userId, roomId}) => {

  const userRoom = rooms.get(roomId);
  const user = userRoom.members.find(groupMember => groupMember.id === userId);
  if(userRoom.isRunning) {
    userRoom.members.forEach(member => {
      if(member.id === user.id) {
        member.isLeave = true;
      }
    })
  }
  else userRoom.members = userRoom.members.filter(groupMember => groupMember.id !== userId);

  if(userRoom.members.length === 0 || !userRoom.members.find(member => !member.isLeave)) rooms.delete(roomId);
  else {
    if(user.isRoomOwner)
      return this.setNewRoomOwner(userRoom);
    rooms.set(roomId, userRoom);
  }
}


async function setEndTime({member, room}) {
  member.endTime = member.lastUpdateTime;
  const gameSession = await GameSession.findOne({ id: room.id });
  const user = await User.findById(member.id);

  const {place, points} = getPlace(room, member);
  const timeDiff = member.endTime - member.startTime;
  const averageSpeedPerMinute = room.text.length / (timeDiff / (1000 * 60));

  member.place = place;
  member.points = points;
  member.averageSpeed = averageSpeedPerMinute;

  await UserTime.create({ 
    gameSession,
     user, 
     startTime: member.startTime, 
     endTime: member.endTime, 
     points: points, 
     place: place,
     averageSpeed: averageSpeedPerMinute 
    });

  await User.findByIdAndUpdate(user.id, { 
    points: user.points + points, 
    averageSpeed: (user.averageSpeed + averageSpeedPerMinute) / (user.gamesCount + 1),
    gamesCount: user.gamesCount + 1
  });

  return {message: 'end', member};
}



function isCheating(oldInputText, newInput) {
  return newInput.length - oldInputText.length > 12.5 * 4;
}



function getPlace(room, member) {
  if(room.isSingle) return {place: 1, points: 0}

  let place = 1;
  room.members.forEach(otherMember => {
    if(member === otherMember) 
      return;
    if(otherMember.endTime && otherMember.endTime < member.endTime)
      ++place 
  });

  switch(place) {
    case 1:
      return {place, points: 20};

    case 2:
      return {place, points: 15};

    case 3:
      return {place, points: 10};    
    
    default:
      return {place, points: 5};  
  }
}