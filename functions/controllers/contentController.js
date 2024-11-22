const { onCall } = require("firebase-functions/v2/https");
const { https } = require("firebase-functions/v2");
const userContentDataService = require("../services/userContentDataService");
const trackService = require("../services/trackService");
const albumService = require("../services/albumService");
const playlistService = require("../services/playlistService");
const artistService = require("../services/artistService"); // 추가
const { logControllerStart, logControllerFinish, logControllerError } = require("../utils/logger");

const { addTracksToAlbum, addTracksToPlaylist } = require("../utils/addTracks");

const getLikedContent = onCall({ region: "asia-northeast3" }, async (request) => {
 try {
   logControllerStart("getSavedContent");

   const auth = request.auth;

   if (!auth) {
     throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
   }

   const uid = auth.uid;
   const platform= request.data.platform;
   const contentType = request.data.contentType;

   const contentData = await userContentDataService.getContentData(uid);
   
   if (!contentData) {
     return { success: false, data: null }
   }

   let content;
   switch (contentType) {
     case "TRACK":
       content = await trackService.getTracks(contentData.getLikedTracksByPlatform(platform));
       break;
     case "PLAYLIST":
       content = await playlistService.getPlaylists(contentData.getPlaylistsByPlatform(platform))
       .map(async (playlist) => addTracksToPlaylist(uid, playlist)); // to be fix
       break;
     case "ALBUM":
       content = await albumService.getAlbums(contentData.getAlbumsByPlatform(platform))
       .map(async (album) => addTracksToAlbum(uid, album)); // to be fix
       break;
     case "ARTIST":
       content = await artistService.getArtists(uid, contentData.getArtistsByPlatform(platform));
       break;
     default:
       throw new Error(`Unknown content type: ${type}`);
   }

   logControllerFinish("getSavedContent");
   return { success: true, data: content };
   
 } catch (error) {
   logControllerError("getSavedContent", error);
   throw error;
 }
});

const getContentCount = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("getContentCount");
    
    const auth = request.auth;
    
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }
    
    const uid = auth.uid;
    const platform = request.data.platform;
    const contentType = request.data.contentType;

    // ContentData 가져오기
    const contentData = await userContentDataService.getContentData(uid);
    if (!contentData) {
      return { success: true, data: 0 };
    }

    let count = 0;
    
    switch (contentType) {
      case "TRACK": {
        const trackIds = contentData.getLikedTracksByPlatform(platform);
        count = trackIds.length;
        break;
      }
      
      case "PLAYLIST": {
        const playlistIds = contentData.getPlaylistsByPlatform(platform);
        count = playlistIds.length;
        break;
      }
      
      case "ALBUM": {
        const albumIds = contentData.getAlbumsByPlatform(platform);
        count = albumIds.length;
        break;
      }
      
      case "ARTIST": {
        const artistIds = contentData.getArtistsByPlatform(platform);
        count = artistIds.length;
        break;
      }

      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }

    logControllerFinish("getContentCount");
    return { success: true, data: count };
    
  } catch (error) {
    logControllerError("getContentCount", error);
    throw error;
  }
});

module.exports = {
 getLikedContent,
 getContentCount
};