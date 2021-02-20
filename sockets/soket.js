const RoomMember = require('./RoomMember');
const Room = require('./Room');

let rooms = []

function connectSocket(httpServer) {
  const io = require('socket.io')(httpServer, {
    cors: {
      Origin: '*',
      Methods: ["GET, PUT, PATCH, POST, DELETE"],
    }
  });


  io.on('connection', socket => {
    console.log(socket.id);

    socket.on('create room', (text) => {
      console.log('create room');
      const owner = new RoomMember(socket.id);
      const newRoom = new Room(socket.id, owner, text);
      rooms.push({id: socket.id, room: newRoom});

      console.log('connet room rooms', rooms);

      socket.emit('confirm join to room', socket.id);
    });

    // для многопользовательской потом добавить join room

    setTimeout(() => {
      socket.emit('set typing state');
    }, 5000);



    const isCheating = (oldInputText, newInput) => newInput.length - oldInputText.length > 12.5;

    socket.on('update time', ({ roomId, inputText }) => {
      console.log(roomId, inputText);
      if(!rooms.find(room => room.id === roomId)) {
        console.log('no such room');
        return;
      }

      const member = rooms.filter(room => room.id === roomId)[0]
                      .room
                      .members
                      .filter(groupMember => groupMember.id === socket.id)[0];

      member.lastUpdateTime = new Date();

      console.log(member);

      if(isCheating(member.inputText, inputText)) {
        // кик челика если он вводит текст со скоростью выше чем 750 знаков в минуту
        // 750зн/м - мировой рекорд. Проверки на читерство лучше ничего не придумал.
        socket.emit('kick user'); 
        return;
      }

      member.inputText = inputText;

      if(inputText === rooms.filter(room => room.id === roomId)[0].text) {
        console.log('end state');
        member.endTime = member.lastUpdateTime;
      }
    });



    socket.on('disconnect', reason => {
      console.log(reason, socket.id);
      // Это по-другому нужно делать. 
      rooms = rooms.filter(room => room.id !== socket.id); 
    });

  });
}


module.exports = connectSocket