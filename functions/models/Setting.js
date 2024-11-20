// Settings model

class Setting {
  constructor(uid, isDarkMode = false, notificationEnabled = true, language = 'ko') {
    if (!uid) {
      throw new Error("UID is required");
    }
    this._uid = uid; // private
    this.isDarkMode = isDarkMode;
    this.notificationEnabled = notificationEnabled;
    this.language = language;
  }
  
    // "uid" getter
  get uid() {
    return this._uid;
  }
}

module.exports = Setting;