// tokenService.js
const { getFirestore } = require("firebase-admin/firestore");
const Token = require("../models/Token");
const { logServiceStart, logServiceFinish, logServiceError } = require("../utils/logger");

const db = getFirestore();
const COLLECTION_NAME = "Tokens";
const SUB_COLLECTION_NAME = "User_tokens";

async function saveToken(token) {
  try {
    logServiceStart("saveToken");

    const tokenRef = db
      .collection(COLLECTION_NAME)
      .doc(token.uid)
      .collection(SUB_COLLECTION_NAME)
      .doc(token.platform);

    await tokenRef.set(
      {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken
      },
      { merge: false }
    );

    logServiceFinish("saveToken");
  } catch (error) {
    logServiceError("saveToken", error);
    throw error;
  }
}

async function getToken(uid, platform) {
  try {
    logServiceStart("getToken");

    const tokenDoc = await db
      .collection(COLLECTION_NAME)
      .doc(uid)
      .collection(SUB_COLLECTION_NAME)
      .doc(platform)
      .get();

    if (!tokenDoc.exists) {
      logServiceFinish("getToken");
      return null;
    }

    const tokenData = tokenDoc.data();
    const token = new Token(uid, platform, tokenData.accessToken, tokenData.refreshToken);

    logServiceFinish("getToken");
    return token;
  } catch (error) {
    logServiceError("getToken", error);
    throw error;
  }
}

async function deleteToken(uid, platform) {
  try {
    logServiceStart("deleteToken");

    const tokenRef = db
      .collection(COLLECTION_NAME)
      .doc(uid)
      .collection(SUB_COLLECTION_NAME)
      .doc(platform);

    await tokenRef.delete();

    logServiceFinish("deleteToken");
  } catch (error) {
    logServiceError("deleteToken", error);
    throw error;
  }
}

async function deleteAllTokens(uid) {
  try {
    logServiceStart("deleteAllTokens");

    const tokensRef = db
      .collection(COLLECTION_NAME)
      .doc(uid)
      .collection(SUB_COLLECTION_NAME);

    const tokens = await tokensRef.get();
    
    const batch = db.batch();
    tokens.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    logServiceFinish("deleteAllTokens");
  } catch (error) {
    logServiceError("deleteAllTokens", error);
    throw error;
  }
}

module.exports = { 
  saveToken, 
  getToken, 
  deleteToken, 
  deleteAllTokens 
};