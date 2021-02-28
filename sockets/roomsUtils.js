const { v4: uuidv4 } = require('uuid');
const UserTime = require('../models/userTime');
const User = require('../models/user');
const RoomMember = require('./RoomMember');
const Room = require('./Room');
const GameSession = require('../models/gameSession');

let rooms = new Map();

exports.getRoom = roomId => rooms.get(roomId);

exports.getRoomForClient = roomId => rooms.get(roomId).members.map((member) => ({
  userName: member.userName,
  inputText: member.inputText,
  isRoomOwner: member.isRoomOwner
}));

exports.hasRoom = roomId => rooms.has(roomId);

exports.setRoom = ({roomId, data}) => rooms.set(roomId, data); 

exports.deleteRoom = roomId => rooms.delete(roomId);

exports.getValidRooms = () => [...rooms.values()].filter(room => !(room.isSingle ||
                                                                  room.isRunning || 
                                                                  room.members.length === +room.maxMembers));


exports.createRoom = async data => {
  const ownerInDb = await User.findById(data.userId);
  const owner = new RoomMember(data.userId, data.socketId, ownerInDb.login);
  owner.isRoomOwner = true;
  const roomId = uuidv4();
  const newRoom = new Room(roomId, owner, data.textTitle, data.textLang, data.text, data.usersCount, data.usersCount === 1);
  rooms.set(newRoom.id, newRoom);
  return newRoom;
}       


const getError = ({room, userId}) => {
  if(!room)
    return { message: 'Такой комнаты не существует' };
  else if(room.isRunning)
    return { message: 'Игра уже началась' };
  else if(room.members.find(member => member.id === userId))
    return { message: 'Вы уже есть в этой комнате' };
  else if(room.members.length >= room.maxMembers) 
    return { message: 'В комнате максимальное количество игроков' };
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
  if(!room) {
    console.log('no such room');
    return;
  }
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
  console.log('leave room before', userId, roomId, rooms);

  const userRoom = rooms.get(roomId);
  const user = userRoom.members.find(groupMember => groupMember.id === userId);
  userRoom.members = userRoom.members.filter(groupMember => groupMember.id !== userId);
  if(userRoom.members.length === 0) rooms.delete(roomId);
  else {
    if(user.isRoomOwner)
      return setNewRoomOwner(userRoom);
    rooms.set(roomId, userRoom);
  }

  console.log('leave room after', rooms);
}


async function setEndTime({member, room}) {
  member.endTime = member.lastUpdateTime;
  const gameSession = await GameSession.findOne({ id: room.id });
  const user = await User.findById(member.id);
  UserTime.create({ gameSession, user, startTime: member.startTime, endTime: member.endTime });

  const points = getPoints(room, member);
  await User.findByIdAndUpdate(user.id, { points: user.points + points });

  return {message: 'end', member};
}

function isCheating(oldInputText, newInput) {
  newInput.length - oldInputText.length > 12.5 * 4;
}

function getPoints(room, member) {
 let place = 1;
 room.members.forEach(otherMember => {
   if(member === otherMember) 
     return;
   if(otherMember.endTime && otherMember.endTime < member.endTime)
     ++place 
 });

 switch(place) {
   case 1:
     return 20;

   case 2:
     return 15;

   case 3:
     return 10;
   
   default:
     return 5;  
 }
}