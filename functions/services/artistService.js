const { getFirestore } = require("firebase-admin/firestore");
const { Artist } = require("../models/Content");
const {
  logServiceStart,
  logServiceFinish,
  logServiceError,
  logInfo
} = require("../utils/logger");

const db = getFirestore();
const COLLECTION_NAME = "Artists";
const SUB_COLLECTION_NAME = "User_artists";

async function saveArtist(uid, artist) {
  try {
    logServiceStart("saveArtist");
    
    await db
      .collection(COLLECTION_NAME)
      .doc(uid)
      .collection(SUB_COLLECTION_NAME)
      .doc(artist.id)
      .set(artist.toJSON(), { merge: false });
    
    logServiceFinish("saveArtist");
  } catch (error) {
    logServiceError("saveArtist", error);
    throw error;
  }
}

async function saveArtists(uid, artists) {
  try {
    logServiceStart("saveArtists");
    
    const batch = db.batch();
    const userArtistsRef = db
      .collection(COLLECTION_NAME)
      .doc(uid)
      .collection(SUB_COLLECTION_NAME);
    
    artists.forEach((artist) => {
      logInfo(artist.id);
      const docRef = userArtistsRef.doc(artist.id);
      batch.set(docRef, artist.toJSON(), { merge: false });
    });
    
    await batch.commit();
    
    logServiceFinish("saveArtists");
  } catch (error) {
    logServiceError("saveArtists", error);
    throw error;
  }
}

async function getArtist(uid, id) {
  try {
    logServiceStart("getArtist");
    
    const artistDoc = await db
      .collection(COLLECTION_NAME)
      .doc(uid)
      .collection(SUB_COLLECTION_NAME)
      .doc(id)
      .get();
    
    if (!artistDoc.exists) {
      logServiceFinish("getArtist");
      return null;
    }
    
    const data = artistDoc.data();
    const artist = new Artist(
      data.pid,
      data.platform,
      data.name,
      data.thumbnailUrl,
      data.genres,
      data.followerCount,
      data.externalUrl,
      data.popularity
    );
    
    logServiceFinish("getArtist");
    return artist;
  } catch (error) {
    logServiceError("getArtist", error);
    throw error;
  }
}

async function getArtists(uid, ids) {
  try {
    logServiceStart("getArtists");
    
    const artists = [];
    const userArtistsRef = db
      .collection(COLLECTION_NAME)
      .doc(uid)
      .collection(SUB_COLLECTION_NAME);
    
    const promises = ids.map(async (id) => {
      const doc = await userArtistsRef.doc(id).get();
      
      if (doc.exists) {
        const data = doc.data();
        artists.push(
          new Artist(
            data.pid,
            data.platform,
            data.name,
            data.thumbnailUrl,
            data.genres,
            data.followerCount,
            data.externalUrl,
            data.popularity
          )
        );
      }
    });
    
    await Promise.all(promises);
    
    logServiceFinish("getArtists");
    return artists;
  } catch (error) {
    logServiceError("getArtists", error);
    throw error;
  }
}

module.exports = {
  saveArtist,
  saveArtists,
  getArtist,
  getArtists
};