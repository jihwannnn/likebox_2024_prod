const { onCall } = require("firebase-functions/v2/https");
const { https } = require("firebase-functions/v2");
const artistService = require("../services/artistService");
const userContentDataService = require("../services/userContentDataService");
const { logControllerStart, logControllerFinish, logControllerError, logInfo } = require("../utils/logger");

// 단일 아티스트 조회
const getArtist = onCall({ region: "asia-northeast3" }, async (request) => {
 try {
   logControllerStart("getArtist");

   // 인증된 요청인지 확인
   const auth = request.auth;
   if (!auth) {
     throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
   }

   const uid = auth.uid;
   const artistId = request.data.artistId;

   if (!artistId) {
     throw new https.HttpsError("invalid-argument", "아티스트 ID가 필요합니다.");
   }

   // 아티스트 조회
   const artist = await artistService.getArtist(uid, artistId);
   if (!artist) {
     throw new https.HttpsError("not-found", "아티스트를 찾을 수 없습니다.");
   }

   logControllerFinish("getArtist");

   return { success: true, data: artist };
 } catch (error) {
   logControllerError("getArtist", error);
   throw error;
 }
});

// 여러 아티스트 조회
const getArtists = onCall({ region: "asia-northeast3" }, async (request) => {
 try {
   logControllerStart("getArtists");

   // 인증된 요청인지 확인
   const auth = request.auth;
   if (!auth) {
     throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
   }

   const uid = auth.uid;
   const artistIds = request.data.artistIds;

   if (!artistIds) {
     throw new https.HttpsError("invalid-argument", "유효한 아티스트 ID 배열이 필요합니다.");
   }

   // 아티스트 목록 조회
   const artists = await artistService.getArtists(uid, artistIds);

   logControllerFinish("getArtists");

   return { success: true, data: artists };
 } catch (error) {
   logControllerError("getArtists", error);
   throw error;
 }
});

// 플랫폼별 아티스트 조회
const getPlatformsArtists = onCall({ region: "asia-northeast3" }, async (request) => {
 try {
   logControllerStart("getPlatformsArtists");

   // 인증된 요청인지 확인
   const auth = request.auth;
   if (!auth) {
     throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
   }

   const uid = auth.uid;
   const platforms = request.data.platforms;

   const contentData = await userContentDataService.getContentData(uid);
   const artistIds = new Set();

   platforms.forEach(platform => {
     let platformsArtists = contentData.getArtistsByPlatform(platform);
     platformsArtists.forEach(artistId => artistIds.add(artistId));
   });

   const artists = await artistService.getArtists(uid, Array.from(artistIds));

   logInfo("getPlatformsArtists", artists.length);

   logControllerFinish("getPlatformsArtists");
   return { success: true, data: artists };
 } catch (error) {
   logControllerError("getPlatformsArtists", error);
   throw error;
 }
});

module.exports = {
 getArtist,
 getArtists,
 getPlatformsArtists
};