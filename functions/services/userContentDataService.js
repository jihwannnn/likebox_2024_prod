const { getFirestore } = require("firebase-admin/firestore");
const { UserContentData } = require("../models/UserContentData");
const { logServiceStart, logServiceFinish, logServiceError } = require("../utils/logger");

const db = getFirestore();
const COLLECTION_NAME = "UserContentData";

async function saveContentData(contentData) {
  try {
    logServiceStart("saveContentData");
    
    await db.collection(COLLECTION_NAME)
      .doc(contentData.uid)
      .set(contentData.toJSON());
    
    logServiceFinish("saveContentData");
  } catch (error) {
    logServiceError("saveContentData", error);
    throw error;
  }
}

async function getContentData(uid) {
  try {
    logServiceStart("getContentData");
    
    const doc = await db.collection(COLLECTION_NAME).doc(uid).get();
    
    if (!doc.exists) {
      logServiceFinish("getContentData");
      return null;
    }
    
    const data = doc.data();
    const contentData = new UserContentData(uid);
    
    // Tracks 복원
    data.likedTracks.forEach(track => {
      track.platforms.forEach(platform => {
        contentData.saveLikedTrack(track.id, platform);
      });
    });
    
    // Playlists 복원
    data.playlists.forEach(playlist => {
      playlist.platforms.forEach(platform => {
        contentData.savePlaylist(playlist.id, platform);
      });
    });
    
    // Albums 복원
    data.albums.forEach(album => {
      album.platforms.forEach(platform => {
        contentData.saveAlbum(album.id, platform);
      });
    });

    // Artists 복원
    data.artists.forEach(artist => {
      artist.platforms.forEach(platform => {
        contentData.saveArtist(artist.id, platform);
      });
    });
    
    logServiceFinish("getContentData");
    return contentData;
  } catch (error) {
    logServiceError("getContentData", error);
    throw error;
  }
}

module.exports = {
  saveContentData,
  getContentData
};