const { onCall } = require("firebase-functions/v2/https");
const { https } = require("firebase-functions/v2");
const jwtDecode = require("jwt-decode"); 
const tokenService = require("../services/tokenService");
const Token = require("../models/Token");
const PlatformFactory = require("../platforms/PlatformFactory");
const AppleMusic = require("../platforms/AppleMusic");
const { logControllerStart, logControllerFinish, logControllerError } = require("../utils/logger");


// 토큰 생성 프로세스
const generateToken = onCall({ region: "asia-northeast3", secrets: ["SPOTIFY_CLIENT_SECRET"]},  async (request) => {
  try {
    logControllerStart("generateToken");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    // 클라이언트가 제공한 authCode 가져옴
    const authCode = request.data.authCode;
    if (!authCode) {
      throw new https.HttpsError("invalid-argument", "인증 코드가 제공되지 않았습니다.");
    }

    // 코드를 전달하여 토큰 가져옴
    const uid = auth.uid;
    const platform = request.data.platform;
    const platformInstance = PlatformFactory.getPlatform(platform);
    const token = await platformInstance.exchangeCodeForToken(uid, authCode);

    // 해당 토큰 저장
    await tokenService.saveToken(token);

    logControllerFinish("generateToken");
    return { success: true, message: "Token saved successfully." };
  } catch (error) {
    logControllerError("generateToken", error);
    throw error;
  }
});

// 토큰 검증 프로세스
const verifyToken = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("verifyToken");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    const platform = request.data.platform;
    const platformInstance = PlatformFactory.getPlatform(platform);
    const token = await tokenService.getToken(uid, platform);

    if (!token) {
      logControllerFinish("verifyToken");
      return { success: false, message: "Token doesn't exist" };
    }

    const accessToken = token.accessToken;
    const refreshToken = token.refreshToken;

    // 액세스 토큰 만료 시
    if (isTokenExpired(accessToken)) {
      // 리프레시 토큰으로 새로운 액세스 토큰 받아옴
      const newAccessToken = await platformInstance.refreshAccessToken(refreshToken);

      // 새로운 액세스 토큰이 없으면 유저가 인증부터 다시해야 함
      if (!newAccessToken) {
        logControllerFinish("verifyToken");
        return { success: true, message: "Token refresh failed" };
      }

      // 새로운 액세스 토큰을 db에 저장
      token.accessToken = newAccessToken;
      await tokenService.saveToken(token);

      logControllerFinish("verifyToken");
      return { success: true, message: "Access token refreshed successfully" };
    }

    logControllerFinish("verifyToken");
    return { success: true, message: "Access token is valid" };
  } catch (error) {
    logControllerError("verifyToken", error);
    throw error;
  }
});

const saveAppleUserToken = onCall({ region: "asia-northeast3" }, async (request) => {
  try{
    logControllerStart("saveAppleUserToken");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    const accessToken = request.data.userToken;
    const token = new Token(uid, "APPLE_MUSIC", accessToken, "");
    await tokenService.saveToken(token);

    logControllerFinish("saveAppleUserToken");
    return { success: true, message: "Usertoken is saved for apple music" };

  } catch (error){
    logControllerError("saveAppleUserToken", error);
    throw error;
  }
});

const generateAppleDevelopertToken = onCall({ region: "asia-northeast3" }, async (request) => {
  try{
    logControllerStart("generateAppleDevelopertToken");

    // 인증된 요청인지 확인
    const auth = request.auth;

    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = "jihwan"
    const AM = new AppleMusic();
    const accessToken = AM.generateDeveloperToken();
    const token = new Token(uid, "APPLE_MUSIC", accessToken, "");
    await tokenService.saveToken(token);

    logControllerFinish("generateAppleDevelopertToken");
    return { success: true, message: "DeveloperToken is saved for apple music" };

  } catch (error){
    logControllerError("generateAppleDevelopertToken", error);
    throw error;
  }
});

// 토큰 삭제 프로세스
const removeToken = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("removeToken");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    const platform = request.data.platform;
    await tokenService.deleteToken(uid, platform);

    logControllerFinish("removeToken");
    return { success: true, message: "Token removed successfully" };
  } catch (error) {
    logControllerError("removeToken", error);
    throw error;
  }
});

// 모든 토큰 삭제 프로세스
const removeAllTokens = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("removeAllTokens");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    await tokenService.deleteAllTokens(uid);

    logControllerFinish("removeAllTokens");
    return { success: true, message: "All tokens removed successfully" };
  } catch (error) {
    logControllerError("removeAllTokens", error);
    throw error;
  }
});

// 액세스 토큰 만료 확인 프로세스
function isTokenExpired(token) {
  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTime;
  } catch (error) {
    logger.error("Error: decoding token:", error);
    return true;
  }
}

module.exports = { 
  generateToken, 
  verifyToken, 
  removeToken, 
  removeAllTokens, 
  saveAppleUserToken,
  generateAppleDevelopertToken
};

