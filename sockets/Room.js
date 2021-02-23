class Room {
  constructor(id, owner, textTitle, text, isSingle) {
    this.id = id;
    this.textTitle = textTitle;
    this.text = text;
    this.owner = owner;
    this.isSingle = isSingle;
    this.members = [owner];
  }

  addMember(member) {
    this.members.push(member);
  }
}

module.exports = Room;