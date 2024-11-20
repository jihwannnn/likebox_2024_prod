// settingService.js
const { getFirestore } = require("firebase-admin/firestore");
const Setting = require("../models/Setting");
const { logServiceStart, logServiceFinish, logServiceError } = require("../utils/logger");

const db = getFirestore();
const COLLECTION_NAME = "Settings";

async function saveSetting(setting) {
  try {
    logServiceStart("saveSetting");

    const settingRef = db.collection(COLLECTION_NAME).doc(setting.uid);
    await settingRef.set(
      {
        isDarkMode: setting.isDarkMode,
        notificationEnabled: setting.notificationEnabled,
        language: setting.language,
      },
      { merge: false }
    );

    logServiceFinish("saveSetting");
  } catch (error) {
    logServiceError("saveSetting", error);
    throw error;
  }
}

async function getSetting(uid) {
  try {
    logServiceStart("getSetting");

    const settingDoc = await db.collection(COLLECTION_NAME).doc(uid).get();

    if (!settingDoc.exists) {
      logServiceFinish("getSetting");
      throw new Error("Setting not found");
    }

    const settingData = settingDoc.data();
    const setting = new Setting(
      uid, 
      settingData.isDarkMode, 
      settingData.notificationEnabled, 
      settingData.language
    );

    logServiceFinish("getSetting");
    return setting;
  } catch (error) {
    logServiceError("getSetting", error);
    throw error;
  }
}

module.exports = { 
  saveSetting, 
  getSetting 
};