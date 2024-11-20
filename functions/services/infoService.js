// infoService.js
const { getFirestore } = require("firebase-admin/firestore");
const Info = require("../models/Info");
const { logServiceStart, logServiceFinish, logServiceError } = require("../utils/logger");

const db = getFirestore();
const COLLECTION_NAME = "Infos";

async function saveInfo(info) {
  try {
    logServiceStart("saveInfo");

    const settingRef = db.collection(COLLECTION_NAME).doc(info.uid);
    await settingRef.set(
      {
        connectedPlatforms: info.connectedPlatforms,
      },
      { merge: false }
    );

    logServiceFinish("saveInfo");
  } catch (error) {
    logServiceError("saveInfo", error);
    throw error;
  }
}

async function getInfo(uid) {
  try {
    logServiceStart("getInfo");

    const infoDoc = await db.collection(COLLECTION_NAME).doc(uid).get();

    if (!infoDoc.exists) {
      logServiceFinish("getInfo");
      throw new Error("Info not found");
    }

    const infoData = infoDoc.data();
    const info = new Info(uid, infoData.connectedPlatforms);

    logServiceFinish("getInfo");
    return info;
  } catch (error) {
    logServiceError("getInfo", error);
    throw error;
  }
}

module.exports = { 
  saveInfo, 
  getInfo 
};