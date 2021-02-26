class Room {
  constructor(id, owner, textTitle, textLang, text, maxMembers, isSingle) {
    this.id = id;
    this.textTitle = textTitle;
    this.textLang = textLang;
    this.text = text;
    this.maxMembers = maxMembers;
    this.isSingle = isSingle;
    this.members = [owner];

    this.isRunning = false;
  }

  addMember(member) {
    this.members.push(member);
  }
}

module.exports = Room;