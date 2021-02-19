const GroupMember = require('./GroupMember');


const rooms = {}

function connectSocket(httpServer) {
  const io = require('socket.io')(httpServer, {
    cors: {
      Origin: '*',
      Methods: ["GET, PUT, PATCH, POST, DELETE"],
    }
  });

  io.on('connection', socket => {
    console.log(socket.id);

    socket.on('create room', () => {
      rooms[socket.id] = [new GroupMember(socket.id)];
      socket.emit('confirm join to room', socket.id);
    });

    // для многопользовательской потом добавить join room

    setTimeout(() => {
      socket.emit('set typing state');
    }, 5000);

    socket.on('update time', ({ roomId, inputText, endState }) => {
      const member = rooms[roomId].filter(groupMember => groupMember.id === socket.id)[0];

      member.lastUpdateTime = new Date();
      member.inputText = inputText;
    });

    socket.on('disconnect', reason => {
      console.log(reason, socket.id);
    });
  });
}


module.exports = connectSocket