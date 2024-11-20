const { onCall } = require("firebase-functions/v2/https");
const { https } = require("firebase-functions/v2");
const settingService = require("../services/settingService");
const Setting = require("../models/Setting");
const { logControllerStart, logControllerFinish, logControllerError } = require("../utils/logger");

// Settings 확인
const checkSetting = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("checkSetting");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;

    // db에서 setting 가져오기
    const setting = await settingService.getSetting(uid);

    logControllerFinish("checkSetting");

    return { success: true, data: setting };
  } catch (error) {
    logControllerError("checkSetting", error);
    throw error;
  }
});

// Settings 업데이트
const updateSetting = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("updateSetting");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    const settingData = request.data.setting;

    // Setting 객체 생성
    const setting = new Setting(uid, settingData.isDarkMode, settingData.notificationEnabled, settingData.language);

    // db에 설정 정보 저장
    await settingService.saveSetting(setting);

    logControllerFinish("updateSetting");

    return { success: true, message: "설정이 성공적으로 업데이트되었습니다." };
  } catch (error) {
    logControllerError("updateSetting", error);
    throw error;
  }
});

module.exports = { 
  checkSetting, 
  updateSetting 
};