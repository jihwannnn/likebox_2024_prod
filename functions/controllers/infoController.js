const { onCall } = require("firebase-functions/v2/https");
const { https } = require("firebase-functions/v2");
const infoService = require("../services/infoService");
const Info = require("../models/Info");
const { logControllerStart, logControllerFinish, logControllerError } = require("../utils/logger");

// Info 확인
const checkInfo = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("checkInfo");

    // 인증된 요청인지 확인
    const auth = request.auth;

    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;

    // // db에서 info 가져오기
    // const info = await infoService.getInfo(uid);

    logControllerFinish("checkInfo");

    return { success: true, data: ["SPOTIFY"] };
  } catch (error) {
    logControllerError("checkInfo", error);
    throw error;
  }
});

// Info 업데이트
const updateInfo = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("updateInfo");

    // 인증된 요청인지 확인
    const auth = request.auth;

    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    const infoData = request.data.info;

    // Info 객체 생성
    const info = new Info(uid, infoData.connectedPlatforms);

    // db에 정보 저장
    await infoService.saveInfo(uid, info);

    logControllerFinish("updateInfo");

    return { success: true, message: "정보 업데이트 완료." };
  } catch (error) {
    logControllerError("updateInfo", error);
    throw error;
  }
});

module.exports = { checkInfo, updateInfo };