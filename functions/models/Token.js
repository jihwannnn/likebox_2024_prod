// Tokens model

class Token {
  constructor(uid, platform, accessToken = "", refreshToken = "") {
    if (!uid) {
      throw new Error("UID is required.");
    }
    if (!platform) {
      throw new Error("Platform is required.");
    }
    this._uid = uid; // private
    this._platform = platform; // private
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  // "uid" getter
  get uid() {
    return this._uid;
  }

  // "platform" getter
  get platform() {
    return this._platform;
  }
}

module.exports = Token;
