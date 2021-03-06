class RoomMember {
  constructor(id, socket, userName) {
    this.id = id;
    this.isRoomOwner = false;
    this.userName = userName;
    this.socket = socket;
    this.inputText = '';


    this.startTime = null;
    this.lastUpdateTime = null;
    this.endTime = null;

    this.isLeave = false;
    this.points;
    this.place;
    this.averageSpeed;
  }
}

module.exports = RoomMember;