class Room {
  constructor(id, owner, text) {
    this.id = id;
    this.text = text;
    this.owner = owner;
    this.members = [owner];
  }

  addMember(member) {
    this.members.push(member);
  }
}

module.exports = Room;