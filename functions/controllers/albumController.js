// controllers/albumController.js
const { onCall } = require("firebase-functions/v2/https");
const { https } = require("firebase-functions/v2");
const albumService = require("../services/albumService");
const userContentDataService = require("../services/userContentDataService");
const { logControllerStart, logControllerFinish, logControllerError, logInfo } = require("../utils/logger");

const { addTracksToAlbum } = require("../utils/addTracks");

// 단일 앨범 조회
const getAlbum = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("getAlbum");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    const albumId = request.data.albumId;

    if (!albumId) {
      throw new https.HttpsError("invalid-argument", "앨범 UPC가 필요합니다.");
    }

    // 앨범 조회
    const album = await albumService.getAlbum(uid, albumId);
    if (!album) {
      throw new https.HttpsError("not-found", "앨범을 찾을 수 없습니다.");
    }

    // to be fix
    const albumwithTracks = await addTracksToAlbum(uid, album)

    logControllerFinish("getAlbum");

    return { success: true, data: albumwithTracks };
  } catch (error) {
    logControllerError("getAlbum", error);
    throw error;
  }
});

// 여러 앨범 조회
const getAlbums = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("getAlbums");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    const albumIds = request.data.albumIds;

    if (!albumIds) {
      throw new https.HttpsError("invalid-argument", "유효한 UPC 배열이 필요합니다.");
    }

    // 앨범 목록 조회
    const albums = await albumService.getAlbums(uid, albumIds);

    logInfo("getPlatformsAlbums", albums.length);

    // to be fix
    const albumsWithTracks = await Promise.all(
      albums.map(async (album) => addTracksToAlbum(uid, album))
    );

    logControllerFinish("getAlbums");

    return { success: true, data: albumsWithTracks };
  } catch (error) {
    logControllerError("getAlbums", error);
    throw error;
  }
});

const getPlatformsAlbums = onCall({ region: "asia-northeast3" }, async (request) => {
  try{
    logControllerStart("getPlatformsAlbums");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    const platforms = request.data.platforms;

    const contentData = await userContentDataService.getContentData(uid);
    const albumIds = new Set();

    platforms.forEach(platform => {
      let platformsAlbums = contentData.getAlbumsByPlatform(platform);
      platformsAlbums.forEach(albumId => albumIds.add(albumId));
    });

    const albums = await albumService.getAlbums(uid, Array.from(albumIds));

    // to be fix
    const albumsWithTracks = await Promise.all(
      await albums.map(async (album) => addTracksToAlbum(uid, album))
    );

    logControllerFinish("getPlatformsAlbums");
    return { success: true, data: albumsWithTracks };
  } catch (error) {
    logControllerError("getPlatformsAlbums", error);
    throw error;
  }
});

module.exports = {
  getAlbum,
  getAlbums,
  getPlatformsAlbums
};