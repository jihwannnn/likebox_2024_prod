// synchController.js
const { onCall } = require("firebase-functions/v2/https");
const { https } = require("firebase-functions/v2");
const tokenService = require("../services/tokenService");
const trackService = require("../services/trackService");
const playlistService = require("../services/playlistService");
const albumService = require("../services/albumService");
const artistService = require("../services/artistService");
const userContentDataService = require("../services/userContentDataService");
const PlatformFactory = require("../platforms/PlatformFactory");
const { logControllerStart, logControllerFinish, logControllerError } = require("../utils/logger");

const synchContent = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("synchContent");

    // 인증 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    // 데이터 초기화
    const uid = auth.uid;
    const contentType = request.data.contentType;
    const platform = request.data.platform;

    let contentData = await userContentDataService.getContentData(uid);

    // 플랫폼에서 데이터 가져옴
    const platformInstance = PlatformFactory.getPlatform(platform);
    const tokens = await tokenService.getToken(uid, platform);

    switch (contentType) {
      case "TRACK": {
        // 좋아요한 트랙 목록 가져오기
        const { trackIds, allTracks } = await platformInstance.getLikedTracks(tokens.accessToken);
        const savedContent = contentData.getLikedTracksByPlatform(platform);
        
        // 삭제된 트랙 처리
        savedContent.forEach(savedId => {
          if (!trackIds.includes(savedId)) {
            contentData.unsaveLikedTrack(savedId, platform);
          }
        });

        // 새로 추가된 트랙 처리
        trackIds.forEach(id => {
          contentData.saveLikedTrack(id, platform);
        });

        // db에 저장
        await trackService.saveTracks(uid, allTracks);
        break;
      }
      
      case "PLAYLIST": {
        // 플레이리스트 목록 가져오기
        const { allPlaylists, allTracks } = await platformInstance.getPlaylists(tokens.accessToken);
        const savedContent = contentData.getPlaylistsByPlatform(platform);
        const playlistIds = allPlaylists.map(playlist => playlist.id);
        
        // 삭제된 플레이리스트 처리
        savedContent.forEach(savedId => {
          if (!playlistIds.includes(savedId)) {
            contentData.unsavePlaylist(savedId, platform);
          }
        });

        // 새로 추가된 플레이리스트 처리
        playlistIds.forEach(id => {
          contentData.savePlaylist(id, platform);
        });

        // db에 저장
        await playlistService.savePlaylists(uid, allPlaylists);
        await trackService.saveTracks(uid, allTracks);
        break;
      }
      
      case "ALBUM": {
        // 앨범 목록 가져오기
        const { allAlbums, allTracks } = await platformInstance.getAlbums(tokens.accessToken);
        const savedContent = contentData.getAlbumsByPlatform(platform);
        const albumIds = allAlbums.map(album => album.id);
        
        // 삭제된 앨범 처리
        savedContent.forEach(savedId => {
          if (!albumIds.includes(savedId)) {
            contentData.unsaveAlbum(savedId, platform);
          }
        });

        // 새로 추가된 앨범 처리
        albumIds.forEach(id => {
          contentData.saveAlbum(id, platform);
        });

        // db에 저장
        await albumService.saveAlbums(uid, allAlbums);
        await trackService.saveTracks(uid, allTracks);
        break;
      }

      case "ARTIST": {
        // 팔로우한 아티스트 목록 가져오기
        const allArtists = await platformInstance.getArtists(tokens.accessToken);
        const savedContent = contentData.getArtistsByPlatform(platform);
        const artistIds = allArtists.map(artist => artist.id);
       
        // 언팔로우된 아티스트 처리 
        savedContent.forEach(savedId => {
          if (!artistIds.includes(savedId)) {
            contentData.unsaveArtist(savedId, platform);
          }
        });
       
        // 새로 팔로우한 아티스트 처리
        artistIds.forEach(id => {
          contentData.saveArtist(id, platform);  
        });
       
        // db에 저장
        await artistService.saveArtists(uid, allArtists);
        break;
       }
      
      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }

    await userContentDataService.saveContentData(contentData);
    
    logControllerFinish(`synchContent_${contentType}`);
    return { success: true, message: `Successfully saved ${contentType}` };
  } catch (error) {
    if (error.response?.status === 401) {
      logControllerError("synchContent", error);
      return { success: false, message: "Access token is expired or invalid." };
    }
    throw error;
  }
});



const exportContent = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    logControllerStart("exportContent");

    // 인증 확인
    const auth = request.auth;
    if (!auth) {
      throw new https.HttpsError("unauthenticated", "사용자가 인증되지 않았습니다.");
    }

    // 데이터 초기화
    const uid = auth.uid;
    const contentType = request.data.contentType;
    const platform = request.data.platform;

    // 컨텐츠 데이터와 토큰 가져오기
    let contentData = await userContentDataService.getContentData(uid);
    const tokens = await tokenService.getToken(uid, platform);
    const platformInstance = PlatformFactory.getPlatform(platform);

    switch (contentType) {
      case "TRACK": {
        // contentData에서 모든 트랙 ISRC 가져오기
        const trackIsrcs = contentData.likedTracks;
        
        // 트랙 데이터 가져오기
        const tracks = await trackService.getTracks(uid, trackIsrcs);
        
        // 대상 플랫폼으로 내보내기
        await platformInstance.exportTracks(tracks, tokens.accessToken);
        break;
      }

      case "PLAYLIST": {
        // contentData에서 모든 플레이리스트 ID 가져오기
        const playlistIds = contentData.playlists;
        
        // 플레이리스트 데이터 가져오기
        const playlists = await playlistService.getPlaylists(uid, playlistIds);
        
        // 대상 플랫폼으로 내보내기
        await platformInstance.exportPlaylists(playlists, tokens.accessToken);
        break;
      }

      case "ALBUM": {
        // contentData에서 모든 앨범 UPC 가져오기
        const albumUpcs = contentData.albums;
        
        // 앨범 데이터 가져오기
        const albums = await albumService.getAlbums(uid, albumUpcs);
        
        // 대상 플랫폼으로 내보내기
        await platformInstance.exportAlbums(albums, tokens.accessToken);
        break;
      }


      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }

    logControllerFinish(`exportContent_${contentType}`);
    return { 
      success: true, 
      message: `Successfully exported all ${contentType} to ${platform}` 
    };
    
  } catch (error) {
    if (error.response?.status === 401) {
      logControllerError("exportContent", error);
      return { success: false, message: "Access token is expired or invalid." };
    }
    throw error;
  }
});

module.exports = {
  synchContent,
  exportContent
};