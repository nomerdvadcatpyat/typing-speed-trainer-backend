class RoomMember {
  constructor(id, socket) {
    this.id = id;
    this.socket = socket;
    this.inputText = '';

    this.startTime = null;
    this.lastUpdateTime = null;
    this.endTime = null;
  }
}

module.exports = RoomMember;