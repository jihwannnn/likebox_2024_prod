const { getFirestore } = require("firebase-admin/firestore");
const { Album } = require("../models/Content");
const { 
 logServiceStart, 
 logServiceFinish, 
 logServiceError 
} = require("../utils/logger");

const db = getFirestore();
const COLLECTION_NAME = "Albums";
const SUB_COLLECTION_NAME = "User_albums";

async function saveAlbums(uid, albums) {
  try {
    logServiceStart("saveAlbums");

    const batch = db.batch();
    const userAlbumsRef = db
      .collection(COLLECTION_NAME)
      .doc(uid)
      .collection(SUB_COLLECTION_NAME);

    albums.forEach(async (album) => {
      const docRef = userAlbumsRef.doc(album.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        batch.set(docRef, album.toJSON(), { merge: false });
      }
    });

    await batch.commit();

    logServiceFinish("saveAlbums");
  } catch (error) {
    logServiceError("saveAlbums", error);
    throw error;
  }
}

async function getAlbum(uid, upc) {
 try {
   logServiceStart("getAlbum");

   const albumDoc = await db
     .collection(COLLECTION_NAME)
     .doc(uid)
     .collection(SUB_COLLECTION_NAME)
     .doc(upc)
     .get();

   if (!albumDoc.exists) {
     logServiceFinish("getAlbum");
     return null;
   }

   const data = albumDoc.data();
   const album = new Album(
     upc,
     data.pid,
     data.platform,
     data.name,
     data.coverImageUrl,
     data.artists,
     data.tracks,
     data.releasedDate,
     data.trackCount
   );

   logServiceFinish("getAlbum");
   return album;
 } catch (error) {
   logServiceError("getAlbum", error);
   throw error;
 }
}

async function getAlbums(uid, upcs) {
 try {
   logServiceStart("getAlbums");

   const albums = [];
   const userAlbumsRef = db
     .collection(COLLECTION_NAME)
     .doc(uid)
     .collection(SUB_COLLECTION_NAME);

   const promises = upcs.map(async (upc) => {
     const doc = await userAlbumsRef.doc(upc).get();

     if (doc.exists) {
       const data = doc.data();
       albums.push(
         new Album(
           upc,
           data.pid,
           data.platform,
           data.name,
           data.coverImageUrl,
           data.artists,
           data.tracks,
           data.releasedDate,
           data.trackCount
         )
       );
     }
   });

   await Promise.all(promises);

   logServiceFinish("getAlbums");
   return albums;
 } catch (error) {
   logServiceError("getAlbums", error);
   throw error;
 }
}

module.exports = {
 saveAlbums,
 getAlbum,
 getAlbums
};