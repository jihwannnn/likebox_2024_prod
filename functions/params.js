const { defineSecret, defineString } = require("firebase-functions/params");

const SPOTIFY_CLIENT_ID = defineString("SPOTIFY_CLIENT_ID");
const SPOTIFY_CLIENT_SECRET = defineSecret("SPOTIFY_CLIENT_SECRET");
const FOR_CLIENT_REDIRECT_URI = defineString("CLIENT_REDIRECT_URI");
const FOR_SERVER_REDIRECT_URI = defineString("SERVER_REDIRECT_URI");


module.exports = { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, FOR_CLIENT_REDIRECT_URI, FOR_SERVER_REDIRECT_URI };