// controllers/trackController.js
const { onCall } = require("firebase-functions/v2/https");
const { https } = require("firebase-functions/v2");
const trackService = require("../services/trackService");
const userContentDataService = require("../services/userContentDataService");
const { logControllerStart, logControllerFinish, logControllerError, logInfo } = require("../utils/logger");

// 트랙 목록 조회
const getTracks = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("getTracks");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    const trackIds = request.data.trackIds;

    if (!trackIds) {
      throw new https.HttpsError("invalid-argument", "유효한 ISRC 배열이 필요합니다.");
    }

    // 트랙 목록 조회
    const tracks = await trackService.getTracks(uid, trackIds);

    logControllerFinish("getTracks");

    return { success: true, data: tracks };
  } catch (error) {
    logControllerError("getTracks", error);
    throw error;
  }
});

const getPlatformsTracks = onCall({ region: "asia-northeast3" }, async (request) => {
  try{
    logControllerStart("getPlatformsTracks");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    const platforms = request.data.platforms;

    const contentData = await userContentDataService.getContentData(uid);
    const trackIds = new Set();

    platforms.forEach(platform => {
      let platformTracks = contentData.getLikedTracksByPlatform(platform);
      platformTracks.forEach(trackId => trackIds.add(trackId));
    });

    const tracks = await trackService.getTracks(uid, Array.from(trackIds));

    logInfo("getPlatformsTracks", tracks.length);


    logControllerFinish("getPlatformsTracks");
    return { success: true, data: tracks };
  } catch (error) {
    logControllerError("getPlatformsTracks", error);
    throw error;
  }
});


module.exports = {
  getTracks,
  getPlatformsTracks
};