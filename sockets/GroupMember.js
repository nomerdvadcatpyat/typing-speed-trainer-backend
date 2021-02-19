class GroupMember {
  constructor(id) {
    this.id = id;
    this.inputText = '';

    this.startTime = new Date();
    this.lastUpdateTime = null;
    this.endTime = null;
  }
}

module.exports = GroupMember;