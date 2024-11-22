class PlatformSyncStatus{
  constructor(uid, platform="SPOTIFY", isConnedted = false, syncStatus = "IDLE"){
    if (!uid) {
      throw new Error("UID is required");
    }

    this._uid = uid; // private
    this.platform = platform
    this.isConnedted = isConnedted;
    this.syncStatus = syncStatus;
  }

    // "uid" getter
  get uid() {
    return this._uid;
  }
}