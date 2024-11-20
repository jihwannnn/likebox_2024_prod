// Info model

class Info {
  constructor(uid, connectedPlatforms=[]) {
    if (!uid) {
      throw new Error("UID is required");
    }
    this._uid = uid; // private
    this.connectedPlatforms = connectedPlatforms;
  }
  
    // "uid" getter
  get uid() {
    return this._uid;
  }
}

module.exports = Info;