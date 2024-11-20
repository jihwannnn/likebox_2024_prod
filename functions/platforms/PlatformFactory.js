// PlatformFactory.js, 플랫폼 인스턴스 생성 클래스
const Spotify = require("./Spotify");
const AppleMusic = require("./AppleMusic");

class PlatformFactory {
  static getPlatform(platformId) {
    switch (platformId) {
      case "SPOTIFY":
        return new Spotify();
      case "APPLE_MUSIC":
        return new AppleMusic();
      default:
        throw new Error(`Unsupported platform: ${platformId}`);
    }
  }
}

module.exports = PlatformFactory;