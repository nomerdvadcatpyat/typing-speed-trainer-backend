class RoomMember {
  constructor(id, socket, userName) {
    this.id = id;
    this.isRoomOwner = false;
    this.userName = userName;
    this.socket = socket;
    this.inputText = '';
    this.isLeave = false;

    this.startTime = null;
    this.lastUpdateTime = null;
    this.endTime = null;
  }
}

module.exports = RoomMember;