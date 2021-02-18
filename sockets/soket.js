const cors = require('../middlewares/cors')

function connectSocket(httpServer) {
  const io = require('socket.io')(httpServer, {
    cors: {
      Origin: '*',
      Methods: ["GET, PUT, PATCH, POST, DELETE"],
    }
  });

  io.on('connection', socket => {
    console.log(socket.date);
  });
}





module.exports = connectSocket