const { onCall } = require("firebase-functions/v2/https");
const { https } = require("firebase-functions/v2");
const { 
    logControllerStart, 
    logControllerFinish, 
    logControllerError,
    logTestStart,
    logTestFinish,
    logTestError, 
    logInfo
} = require("../utils/logger");
const { Track, Playlist, Album } = require("../models/Content");
const { addTracksToPlaylist, addTracksToAlbum } = require("../utils/addTracks");
const trackService = require("../services/trackService");
const playlistService = require("../services/playlistService");
const albumService = require("../services/albumService");

const uid1 = "1"

const testFunction1 = onCall({ region: "asia-northeast3" }, async (request) => {
    try {
        logControllerStart("testFunction1");

        const requestData = request.data;
        

        // 테스트 로깅
        logTestStart("testFunction", requestData);

        logTestFinish("testFunction", requestData);

        logControllerFinish("testFunction1");

        return {
            success: true,
            data: requestData
        };

    } catch (error) {
        logTestError("testFunction", error);
        logControllerError("testFunction", error);
        throw error;
    }
});

const saveDummies = onCall({ region: "asia-northeast3" }, async (request) => {
    try{
        
        const track1 = new Track("t1", "t1", "SPOTIFY");
        const track2 = new Track("t2", "t2", "SPOTIFY");
        const track3 = new Track("t3", "t3", "SPOTIFY");
        const track4 = new Track("t4", "t4", "APPLE_MUSIC");
        const track5 = new Track("t5", "t5", "APPLE_MUSIC");
        const track6 = new Track("t6", "t6", "APPLE_MUSIC");

        const playlist1 = new Playlist("p1", "SPOTIFY");
        logInfo(playlist1.id);
        playlist1.tracks = ["t1", "t2", "t3"];

        const playlist2 = new Playlist("p2", "APPLE_MUSIC");
        logInfo(playlist2.id);
        playlist2.tracks = ["t4", "t5", "t6"];

        const album1 = new Album("a1", "a1", "APPLE_MUSIC");
        album1.tracks = ["t4", "t5", "t6"];

        const album2 = new Album("a2", "a2", "SPOTIFY");
        album2.tracks = ["t1", "t2", "t3"]

        const tracks = [track1, track2, track3, track4, track5, track6];
        const playlists = [playlist1, playlist2];
        const albums = [album1, album2];

        await trackService.saveTracks(uid1, tracks);
        await playlistService.savePlaylists(uid1, playlists);
        await albumService.saveAlbums(uid1, albums);

        return { success: true };
    } catch (error) {
        throw error;
    }
});

const getDummies = onCall({ region: "asia-northeast3" }, async (request) => {
    try {
        const tracks = await trackService.getTracks(uid1, ["t1", "t2", "t3"]);
        const playlists = await playlistService.getPlaylists(uid1, ["p1SPOTIFY", "p2APPLE_MUSIC"]);
        const albums = await albumService.getAlbums(uid1, ["a1", "a2"]);
 
        // map으로 Promise 배열 생성 후 Promise.all로 처리해야 함
        const playlistsWithTracks = await Promise.all(
            playlists.map(async (playlist) => addTracksToPlaylist(uid1, playlist))
        );

        const albumsWithTracks = await Promise.all(
            albums.map(async (album) => addTracksToAlbum(uid1, album))
        );
 
        return {
            success: true,
            data: {
                tracks: tracks,
                playlists: playlistsWithTracks,
                albums: albumsWithTracks
            }
        };
    } catch(error) {
        throw error;
    }
 });

module.exports = {
    testFunction1,
    saveDummies,
    getDummies
};