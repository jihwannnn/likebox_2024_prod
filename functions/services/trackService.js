const { getFirestore } = require("firebase-admin/firestore");
const { Track } = require("../models/Content");
const { 
  logServiceStart, 
  logServiceFinish, 
  logServiceError 
} = require("../utils/logger");

const db = getFirestore();
const COLLECTION_NAME = "Tracks";
const SUB_COLLECTION_NAME = "User_tracks";
const BATCH_SIZE = 20;  // Firestore 배치 작업 제한

async function saveTracks(uid, tracks) {
  try {
    logServiceStart("saveTracks");

    // tracks 배열을 BATCH_SIZE 크기로 나누기
    for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const batchTracks = tracks.slice(i, i + BATCH_SIZE);
      const userTracksRef = db
        .collection(COLLECTION_NAME)
        .doc(uid)
        .collection(SUB_COLLECTION_NAME);

      for (const track of batchTracks) {
        const docRef = userTracksRef.doc(track.id);
        const doc = await docRef.get();
          
        if (!doc.exists) {
          batch.set(docRef, track.toJSON(), { merge: false });
        }
      }

      await Promise.all(promises);
      await batch.commit();
    }

    logServiceFinish("saveTracks");
  } catch (error) {
    logServiceError("saveTracks", error);
    throw error;
  }
}

async function getTracks(uid, isrcs) {
  try {
    logServiceStart("getTracks");

    const tracks = [];
    const userTracksRef = db
      .collection(COLLECTION_NAME)
      .doc(uid)
      .collection(SUB_COLLECTION_NAME);

    // isrcs 배열을 BATCH_SIZE 크기로 나누기
    for (let i = 0; i < isrcs.length; i += BATCH_SIZE) {
      const batchIsrcs = isrcs.slice(i, i + BATCH_SIZE);
      const promises = batchIsrcs.map(async (isrc) => {
        const doc = await userTracksRef.doc(isrc).get();
        
        if (doc.exists) {
          const data = doc.data();
          tracks.push(
            new Track(
              isrc,
              data.pid,
              data.platform,
              data.name,
              data.albumArtUrl,
              data.artists,
              data.albumName,
              data.durationMs
            )
          );
        }
      });

      await Promise.all(promises);
    }

    logServiceFinish("getTracks");
    return tracks;
  } catch (error) {
    logServiceError("getTracks", error);
    throw error;
  }
}

module.exports = {
  saveTracks,
  getTracks
};