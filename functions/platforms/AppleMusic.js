const axios = require("axios");
const jwt = require("jsonwebtoken");

const { logPlatformStart, logPlatformFinish, logPlatformError } = require("../utils/logger");
const Platform = require("./PlatformInterface");
const { Track, Playlist, Album } = require("../models/Content");
const { 
  APPLE_MUSIC_TEAM_ID,
  APPLE_MUSIC_KEY_ID, 
  APPLE_MUSIC_PRIVATE_KEY
} = require("../params");
const { convertDateToInt } = require("../utils/convertDateToInt");

const LIMIT = 100;
const platform_string = "APPLE_MUSIC";
const tokenService = require("../services/tokenService");

class AppleMusic extends Platform {

  generateDeveloperToken() {
    try {
      const dToken = jwt.sign({}, APPLE_MUSIC_PRIVATE_KEY.value(), {
        algorithm: 'ES256',
        expiresIn: '180d',
        issuer: APPLE_MUSIC_TEAM_ID.value(),
        header: {
          alg: 'ES256',
          kid: APPLE_MUSIC_KEY_ID.value()
        }
      });
      return dToken;
    } catch (error) {
      logPlatformError("AppleMusic", "generateDeveloperToken", error);
      throw error;
    }
  }

  convertToTracks(tracksData) {
    return tracksData
      .filter(track => track.attributes?.isrc)
      .map(track => {
        return new Track(
          track.attributes.isrc,              // isrc (id)
          track.id,                           // pid
          "APPLE_MUSIC",                      // platform
          track.attributes.name,              // name
          track.attributes.artwork?.url?.replace('{w}x{h}', '640x640') || "", // albumArtUrl
          Array.isArray(track.attributes.artistName) 
            ? track.attributes.artistName 
            : track.attributes.artistName.split(', '), // artist
          track.attributes.albumName,         // albumName
          track.attributes.durationInMillis   // durationMs
        );
      });
  }

  async getLikedTracks(userToken) {
    try {
      logPlatformStart("AppleMusic", "getLikedTracks");

      const developerToken = await tokenService.getToken("jihwan", "APPLE_MUSIC").accessToken;

      let allTracks = [];
      let offset = 0;

      // 첫 요청으로 전체 개수 확인
      const initialResponse = await axios.get(
        'https://api.music.apple.com/v1/me/library/songs?limit=1',
        {
          headers: { 
            'Authorization': `Bearer ${developerToken}`,
            'Music-User-Token': userToken
          }
        }
      );

      const total = initialResponse.data.meta.total;

      // 전체 데이터 가져오기
      while (offset < total) {
        const response = await axios.get(
          `https://api.music.apple.com/v1/me/library/songs?limit=${LIMIT}&offset=${offset}`,
          {
            headers: { 
              'Authorization': `Bearer ${developerToken}`,
              'Music-User-Token': userToken
            }
          }
        );

        const tracks = this.convertToTracks(response.data.data);
        allTracks = allTracks.concat(tracks);
        
        offset += LIMIT;
      }

      const isrcs = allTracks.map(track => track.id);

      logPlatformFinish("AppleMusic", "getLikedTracks");
      return { isrcs, allTracks };
    } catch (error) {
      logPlatformError("AppleMusic", "getLikedTracks", error);
      throw error;
    }
  }

  async getPlaylistTracks(playlistId, userToken) {
    try {

      const developerToken = await tokenService.getToken("jihwan", "APPLE_MUSIC").accessToken;

      const response = await axios.get(
        `https://api.music.apple.com/v1/me/library/playlists/${playlistId}?include=tracks&limit=100`,
        {
          headers: { 
            'Authorization': `Bearer ${developerToken}`,
            'Music-User-Token': userToken
          }
        }
      );

      return this.convertToTracks(response.data.data[0].relationships.tracks.data);
    } catch (error) {
      logPlatformError("AppleMusic", `getPlaylistTracks for playlist ${playlistId}`, error);
      throw error;
    }
  }

  async getPlaylists(userToken) {
    try {
      logPlatformStart("AppleMusic", "getPlaylists");

      const developerToken = await tokenService.getToken("jihwan", "APPLE_MUSIC").accessToken;

      let allPlaylists = [];
      let allTracksSet = new Set();
      let offset = 0;

      // 첫 요청으로 전체 개수 확인
      const initialResponse = await axios.get(
        'https://api.music.apple.com/v1/me/library/playlists?limit=1',
        {
          headers: { 
            'Authorization': `Bearer ${developerToken}`,
            'Music-User-Token': userToken
          }
        }
      );

      const total = initialResponse.data.meta.total;

      // 전체 데이터 가져오기
      while (offset < total) {
        const response = await axios.get(
          `https://api.music.apple.com/v1/me/library/playlists?limit=${LIMIT}&offset=${offset}`,
          {
            headers: { 
              'Authorization': `Bearer ${developerToken}`,
              'Music-User-Token': userToken
            }
          }
        );

        // 각 플레이리스트에 대해 트랙 정보 가져오기
        for (const playlistData of response.data.data) {
          const tracks = await this.getPlaylistTracks(playlistData.id, userToken);
          const trackIsrcs = tracks.map(track => track.id);

          const playlist = new Playlist(
            playlistData.id,          // pid
            "APPLE_MUSIC",            // platform
            playlistData.attributes.name, // name
            playlistData.attributes.description?.standard || "", // description
            playlistData.attributes.artwork?.url?.replace('{w}x{h}', '640x640') || "", // coverImageUrl
            trackIsrcs,               // tracks
            playlistData.attributes.curatorName, // owner
            tracks.length            // trackCount
          );

          allPlaylists.push(playlist);
          tracks.forEach(track => allTracksSet.add(track));
        }

        offset += LIMIT;
      }

      const allTracks = Array.from(allTracksSet);

      logPlatformFinish("AppleMusic", "getPlaylists");
      return { allPlaylists, allTracks };
    } catch (error) {
      logPlatformError("AppleMusic", "getPlaylists", error);
      throw error;
    }
  }

  async getAlbumTracks(albumId, userToken) {
    try {

      const developerToken = await tokenService.getToken("jihwan", "APPLE_MUSIC").accessToken;

      const response = await axios.get(
        `https://api.music.apple.com/v1/me/library/albums/${albumId}?include=tracks&limit=100`,
        {
          headers: { 
            'Authorization': `Bearer ${developerToken}`,
            'Music-User-Token': userToken
          }
        }
      );

      return this.convertToTracks(response.data.data[0].relationships.tracks.data);
    } catch (error) {
      logPlatformError("AppleMusic", `getAlbumTracks for album ${albumId}`, error);
      throw error;
    }
  }

  async getAlbums(userToken) {
    try {
      logPlatformStart("AppleMusic", "getAlbums");

      const developerToken = await tokenService.getToken("jihwan", "APPLE_MUSIC").accessToken;

      let allAlbums = [];
      let allTracksSet = new Set();
      let offset = 0;

      // 첫 요청으로 전체 개수 확인
      const initialResponse = await axios.get(
        'https://api.music.apple.com/v1/me/library/albums?limit=1',
        {
          headers: { 
            'Authorization': `Bearer ${developerToken}`,
            'Music-User-Token': userToken
          }
        }
      );

      const total = initialResponse.data.meta.total;

      // 전체 데이터 가져오기
      while (offset < total) {
        const response = await axios.get(
          `https://api.music.apple.com/v1/me/library/albums?limit=${LIMIT}&offset=${offset}`,
          {
            headers: { 
              'Authorization': `Bearer ${developerToken}`,
              'Music-User-Token': userToken
            }
          }
        );

        for (const albumData of response.data.data) {
          if (albumData.attributes?.upc) {
            const tracks = await this.getAlbumTracks(albumData.id, userToken);
            const trackIsrcs = tracks.map(track => track.id);

            const album = new Album(
              albumData.attributes.upc,    // upc (id)
              albumData.id,                // pid
              "APPLE_MUSIC",               // platform
              albumData.attributes.name,   // name
              albumData.attributes.artwork?.url?.replace('{w}x{h}', '640x640') || "", // coverImageUrl
              Array.isArray(albumData.attributes.artistName) 
                ? albumData.attributes.artistName 
                : albumData.attributes.artistName.split(', '), // artists
              trackIsrcs,                  // tracks
              convertDateToInt(albumData.attributes.releaseDate), // releasedDate
              tracks.length // trackCount
            );

            allAlbums.push(album);
            tracks.forEach(track => allTracksSet.add(track));
          }
        }

        offset += LIMIT;
      }

      const allTracks = Array.from(allTracksSet);

      logPlatformFinish("AppleMusic", "getAlbums");
      return { allAlbums, allTracks };
    } catch (error) {
      logPlatformError("AppleMusic", "getAlbums", error);
      throw error;
    }
  }
}

module.exports = AppleMusic;