// controllers/playlistController.js
const { onCall } = require("firebase-functions/v2/https");
const { https } = require("firebase-functions/v2");
const playlistService = require("../services/playlistService");
const userContentDataService = require("../services/userContentDataService");

const { addTracksToPlaylist } = require("../utils/addTracks");
const { logControllerStart, logControllerFinish, logControllerError, logInfo } = require("../utils/logger");

// 단일 플레이리스트 조회
const getPlaylist = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("getPlaylist");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid; 
    const playlistId = request.data.playlistId;

    if (!playlistId) {
      throw new https.HttpsError("invalid-argument", "플레이리스트 ID가 필요합니다.");
    }

    // 플레이리스트 조회
    const playlist = await playlistService.getPlaylist(uid, playlistId);
    if (!playlist) {
      throw new https.HttpsError("not-found", "플레이리스트를 찾을 수 없습니다.");
    }

    // to be fix
    const playlistWithTracks = await addTracksToPlaylist(uid, playlist);

    logControllerFinish("getPlaylist");

    return { success: true, data: playlistWithTracks };
  } catch (error) {
    logControllerError("getPlaylist", error);
    throw error;
  }
});

// 여러 플레이리스트 조회
const getPlaylists = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("getPlaylists");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    const playlistIds = request.data.playlistIds;

    if (!playlistIds) {
      throw new https.HttpsError("invalid-argument", "유효한 플레이리스트 ID 배열이 필요합니다.");
    }

    // 플레이리스트 목록 조회
    const playlists = await playlistService.getPlaylists(uid, playlistIds);

    

    // to be fix
    const playlistsWithTracks = await Promise.all(
      playlists.map(async (playlist) => addTracksToPlaylist(uid, playlist))
    );

    logControllerFinish("getPlaylists");

    return { success: true, data: playlistsWithTracks };
  } catch (error) {
    logControllerError("getPlaylists", error);
    throw error;
  }
});

const getPlatformsPlaylists = onCall({ region: "asia-northeast3" }, async (request) => {
  try{
    logControllerStart("getPlatformsPlaylists");

    // 인증된 요청인지 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    const uid = auth.uid;
    const platforms = request.data.platforms;

    const contentData = await userContentDataService.getContentData(uid);
    const playlistIds = new Set();

    platforms.forEach(platform => {
      let platformsPlaylists = contentData.getPlaylistsByPlatform(platform);
      platformsPlaylists.forEach(playlistId => playlistIds.add(playlistId));
    });

    const playlists = await playlistService.getPlaylists(uid, Array.from(playlistIds));

    logInfo("getPlatformsPlaylists", playlists.length);

    // to be fix
    const playlistsWithTracks = await Promise.all(
      playlists.map(async (playlist) => addTracksToPlaylist(uid, playlist))
    );

    logControllerFinish("getPlatformsPlaylists");
    return { success: true, data: playlistsWithTracks };
  } catch (error){
    logControllerError("getPlatformsPlaylists", error);
    throw error;
  }
});


module.exports = {
  getPlaylist,
  getPlaylists,
  getPlatformsPlaylists
};