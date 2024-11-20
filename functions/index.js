const admin = require("firebase-admin");

admin.initializeApp(); // Firebase Admin 초기화

const albumController = require("./controllers/albumController");
const artistController = require("./controllers/artistController");
const contentController = require("./controllers/contentController");
const generalController = require("./controllers/generalController");
const infoController = require("./controllers/infoController");
const playlistController = require("./controllers/playlistController");
const settingController = require("./controllers/settingController");
const synchController = require("./controllers/synchController");
const tokenController = require("./controllers/tokenController");
const trackController = require("./controllers/trackController");

const testController = require("./controllers/testController");



// General
exports.createDefault = generalController.createDefault;
exports.generateUrl = generalController.generateUrl;

// Info
exports.checkInfo = infoController.checkInfo;
exports.updateInfo = infoController.updateInfo;

// Setting
exports.checkSetting = settingController.checkSetting;
exports.updateSetting = settingController.updateSetting;

// Sync
exports.synchContent = synchController.synchContent;

// Token
exports.generateToken = tokenController.generateToken;
exports.verifyToken = tokenController.verifyToken;
exports.saveAppleUserToken = tokenController.saveAppleUserToken;
exports.generateAppleDevelopertToken = tokenController.generateAppleDevelopertToken;
exports.removeToken = tokenController.removeToken; 
exports.removeAllTokens = tokenController.removeAllTokens

// Content
exports.getLikedContent = contentController.getLikedContent

// Playlist
exports.getPlaylist = playlistController.getPlaylist;
exports.getPlaylists = playlistController.getPlaylists;
exports.getPlatformsPlaylists = playlistController.getPlatformsPlaylists;

// Track
exports.getTracks = trackController.getTracks;
exports.getPlatformsTracks = trackController.getPlatformsTracks


// Album
exports.getAlbum = albumController.getAlbum;
exports.getAlbums = albumController.getAlbums;
exports.getPlatformsAlbums = albumController.getPlatformsAlbums;

// Artist
exports.getArtist = artistController.getArtist;
exports.getArtists = artistController.getArtists;
exports.getPlatformsArtists = artistController.getPlatformsArtists


// Test
exports.testFunction1 = testController.testFunction1;
exports.saveDummies = testController.saveDummies;
exports.getDummies = testController.getDummies;