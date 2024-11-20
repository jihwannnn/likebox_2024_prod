const { onCall } = require("firebase-functions/v2/https");
const { https } = require("firebase-functions/v2");
const infoService = require("../services/infoService");
const settingService = require("../services/settingService");
const userContentDataService = require("../services/userContentDataService");
const Info = require("../models/Info");
const Setting = require("../models/Setting");
const { UserContentData } = require("../models/UserContentData");
const PlatformFactory = require("../platforms/PlatformFactory");
const { logControllerStart, logControllerFinish, logControllerError } = require("../utils/logger");

// 초기 유저 생성시 db에 default 생성
const createDefault = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("createDefault");

    const auth = request.auth;

    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    // Info, Setting 객체 생성
    const uid = auth.uid;

    const info = new Info(uid);
    const setting = new Setting(uid);
    const contentData = new UserContentData(uid);

    // db에 기본 정보 저장
    await infoService.saveInfo(info);
    await settingService.saveSetting(setting);
    await userContentDataService.saveContentData(contentData);

    logControllerFinish("createDefault");

    return { success: true, message: "Default setting created successfully" };
  } catch (error) {
    logControllerError("createDefault", error);
    throw error;
  }
});

// 인증을 위한 URL 생성
const generateUrl = onCall({ region: "asia-northeast3" }, (request) => {
  try {
    logControllerStart("generateUrl");

    const platform = request.data.platform;
    const platformInstance = PlatformFactory.getPlatform(platform);
    const authUrl = platformInstance.getAuthUrl();

    logControllerFinish("generateUrl");

    return { success: true, data: authUrl };
  } catch (error) {
    logControllerError("generateUrl", error);
    throw error;
  }
});

module.exports = { createDefault, generateUrl };