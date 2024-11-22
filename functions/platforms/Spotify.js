const axios = require("axios");
const querystring = require("querystring");
const { logPlatformStart, logPlatformFinish, logPlatformError } = require("../utils/logger");
const { logger } = require("firebase-functions/v2");
const Platform = require("./PlatformInterface");
const Token = require("../models/Token");
const { Track, Playlist, Album, Artist } = require("../models/Content");
const { 
  SPOTIFY_CLIENT_ID, 
  FOR_SERVER_REDIRECT_URI,
  FOR_CLIENT_REDIRECT_URI
} = require("../params");
const convertDateToInt = require("../utils/convertDateToInt");

const PLATFORM_STRING = "SPOTIFY";
const LikeBox = "LikeBox";

class Spotify extends Platform {
  // 인증 관련 메소드
  getAuthUrl() {
    const scopes = "user-library-read user-library-modify playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public";
    
    return `https://accounts.spotify.com/authorize?${querystring.stringify({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID.value(),
      scope: scopes,
      redirect_uri: FOR_CLIENT_REDIRECT_URI.value(),
    })}`;
  }


  async exchangeCodeForToken(uid, authCode) {
    try {
      logPlatformStart(PLATFORM_STRING, "exchangeCodeForToken");

      const clientRedirectUri = FOR_CLIENT_REDIRECT_URI.value();
      const serverRedirectUri = FOR_SERVER_REDIRECT_URI.value();
      
      logger.info("Debug URIs:", {
        clientRedirectUri,
        serverRedirectUri,
        authCode: authCode?.substring(0, 10) + "..." // 일부만 로깅
      });

      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        querystring.stringify({
          grant_type: "authorization_code",
          code: authCode,
          redirect_uri: clientRedirectUri,
          client_id: SPOTIFY_CLIENT_ID.value(),
          client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        }),
        {
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
          },
        }
      );

      return new Token(uid, "SPOTIFY", response.data.access_token, response.data.refresh_token);
      
    } catch (error) {
      if (error.response?.data) {
        logger.error("Spotify API Error Details:", {
          error: error.response.data.error,
          description: error.response.data.error_description,
          usedRedirectUri: FOR_CLIENT_REDIRECT_URI.value(),
          registeredUris: [
            "com.example.likebox://callback",
            "https://asia-northeast3-likebox-2024-test.cloudfunctions.net/generateToken"
          ]
        });
      }
      throw error;
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      logPlatformStart(PLATFORM_STRING, "refreshAccessToken");

      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        querystring.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: SPOTIFY_CLIENT_ID.value(),
          client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      logPlatformFinish(PLATFORM_STRING, "refreshAccessToken");
      return response.data.access_token;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error === "invalid_grant") {
        logPlatformFinish(PLATFORM_STRING, "refreshAccessToken");
        logger.info("Info: Refresh token is invalid or has been revoked.");
        return null;
      }
      throw error;
    }
  }

  // 데이터 변환 메소드
  convertToArtist(artistData) {
    return new Artist(
      artistData.id,                      // pid
      PLATFORM_STRING,                    // platform
      artistData.name,                    // name
      artistData.images[0]?.url ?? "",    // thumbnailUrl
      artistData.genres,                  // genres
      artistData.followers.total,         // followerCount
      artistData.external_urls.spotify,   // externalUrl
      artistData.popularity              // popularity
    );
  }

  convertToTrack(trackData) {
    const track = trackData.track || trackData;
    if (!track.external_ids?.isrc) return null;
    
    return new Track(
      track.external_ids.isrc,    // isrc (id)
      track.id,                   // pid
      PLATFORM_STRING,            // platform
      track.name,                 // name
      track.album.images[0]?.url ?? "", // albumArtUrl
      track.artists.map(artist => artist.name), // artist
      track.album.name,          // albumName
      track.duration_ms          // durationMs
    );
  }

  convertToTracks(tracksData) {
    return tracksData
      .map(track => this.convertToTrack(track))
      .filter(track => track !== null);
  }

  convertToPlaylist(playlistData, trackIsrcs) {
    return new Playlist(
      playlistData.id,           // pid
      PLATFORM_STRING,           // platform
      playlistData.name,         // name
      playlistData.description || "", // description
      playlistData.images[0]?.url ?? "", // coverImageUrl
      trackIsrcs,               // tracks
      playlistData.owner.id,    // owner
      playlistData.tracks.total // trackCount
    );
  }

  convertToAlbum(albumData, trackIsrcs) {
    if (!albumData.external_ids?.upc) return null;
    
    return new Album(
      albumData.external_ids.upc,  // upc (id)
      albumData.id,                // pid
      PLATFORM_STRING,             // platform
      albumData.name,              // name
      albumData.images[0]?.url ?? "", // coverImageUrl
      albumData.artists.map(artist => artist.name), // artists
      trackIsrcs,                  // tracks
      convertDateToInt(albumData.release_date), // releasedDate
      albumData.tracks.total       // trackCount
    );
  }

  async getArtists(accessToken) {
    try {
      logPlatformStart(PLATFORM_STRING, "getFollowedArtists");

      let allArtists = [];
      let after = null;
      const limit = 50;

      do {
        const response = await axios.get(
          `https://api.spotify.com/v1/me/following?type=artist&limit=${limit}${after ? `&after=${after}` : ''}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );

        logPlatformStart(PLATFORM_STRING, "getFollowedArtists");

        const artists = response.data.artists.items.map(artistData => 
          this.convertToArtist(artistData)
        );
        allArtists = allArtists.concat(artists);

        after = response.data.artists.cursors.after;
      } while (after);

      logPlatformFinish(PLATFORM_STRING, "getFollowedArtists");
      return allArtists;
    } catch (error) {
      logPlatformError(PLATFORM_STRING, "getFollowedArtists", error);
      throw error;
    }
  }

  // Track 관련 메소드
  async getLikedTracks(accessToken) {
    try {
      logPlatformStart(PLATFORM_STRING, "getLikedTracks");

      let allTracks = [];
      let hasMoreTracks = true;
      const limit = 50;
      let offset = 0;

      while (hasMoreTracks) {
        const response = await axios.get(
          `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );

        const tracks = this.convertToTracks(response.data.items);
        allTracks = allTracks.concat(tracks);

        hasMoreTracks = response.data.next !== null;
        offset += hasMoreTracks ? limit : 0;
      }


      const trackIds = allTracks.map(track => track.id);

      logPlatformFinish(PLATFORM_STRING, "getLikedTracks");
      return { trackIds, allTracks };
    } catch (error) {
      logPlatformError(PLATFORM_STRING, "getLikedTracks", error);
      throw error;
    }
  }

  // Playlist 관련 메소드
  async getPlaylistTracks(playlistId, accessToken) {
    try {
      logPlatformStart(PLATFORM_STRING, `getPlaylistTracks for playlist: ${playlistId}`);

      let allTracks = [];
      let hasMoreTracks = true;
      const limit = 50;
      let offset = 0;

      while (hasMoreTracks) {
        const response = await axios.get(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );

        const tracks = this.convertToTracks(response.data.items);
        allTracks = allTracks.concat(tracks);

        hasMoreTracks = response.data.next !== null;
        offset += hasMoreTracks ? limit : 0;
      }

      logPlatformFinish(PLATFORM_STRING, `getPlaylistTracks for playlist: ${playlistId}`);
      return allTracks;
    } catch (error) {
      logPlatformError(PLATFORM_STRING, `getPlaylistTracks for playlist ${playlistId}`, error);
      throw error;
    }
  }

  async getPlaylists(accessToken) {
    try {
      logPlatformStart(PLATFORM_STRING, "getPlaylists");
      
      const allPlaylists = [];
      const allTracksSet = new Set();
      const limit = 50;
      let offset = 0;
      
      let hasMorePlaylists = true;
      while (hasMorePlaylists) {
        const response = await axios.get(
          `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
  
        for (const data of response.data.items) {
          const tracks = await this.getPlaylistTracks(data.id, accessToken);
          const trackIsrcs = tracks.map(track => track.id);
  
          const playlist = this.convertToPlaylist(data, trackIsrcs);
          allPlaylists.push(playlist);
          tracks.forEach(track => allTracksSet.add(track));
        }
  
        hasMorePlaylists = response.data.next !== null;
        offset += hasMorePlaylists ? limit : 0;
      }
  
      const allTracks = Array.from(allTracksSet);
      logPlatformFinish(PLATFORM_STRING, "getPlaylists");
      return { allPlaylists, allTracks };
      
    } catch (error) {
      logPlatformError(PLATFORM_STRING, "getPlaylists", error);
      throw error;
    }
  }

  // Album 관련 메소드
  async getAlbumTracks(albumId, accessToken) {
    try {
      logPlatformStart(PLATFORM_STRING, "getAlbumTracks");

      let allTracks = [];
      let hasMoreTracks = true;
      const limit = 50;
      let offset = 0;

      while (hasMoreTracks) {
        const response = await axios.get(
          `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=${limit}&offset=${offset}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );

        const trackResponses = await Promise.all(
          response.data.items.map(track =>
            axios.get(`https://api.spotify.com/v1/tracks/${track.id}`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            }).catch(error => {
              logPlatformError(PLATFORM_STRING, `getAlbumTracks for track ${track.id}`, error);
              return null;
            })
          )
        );

        const trackDatas = trackResponses
          .filter(response => response !== null)
          .map(response => ({ track: response.data }));

        const tracks = this.convertToTracks(trackDatas);
        allTracks = allTracks.concat(tracks);

        hasMoreTracks = response.data.next !== null;
        offset += hasMoreTracks ? limit : 0;
      }

      logPlatformFinish(PLATFORM_STRING, "getAlbumTracks");
      return allTracks;
    } catch (error) {
      logPlatformError(PLATFORM_STRING, "getAlbumTracks", error);
      throw error;
    }
  }

  async getAlbums(accessToken) {
    try {
      logPlatformStart(PLATFORM_STRING, "getAlbums");

      let allAlbums = [];
      let allTracksSet = new Set();
      let hasMoreAlbums = true;
      const limit = 50;
      let offset = 0;

      while (hasMoreAlbums) {
        const response = await axios.get(
          `https://api.spotify.com/v1/me/albums?limit=${limit}&offset=${offset}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );

        for (const data of response.data.items) {
          const albumData = data.album;
          const tracks = await this.getAlbumTracks(albumData.id, accessToken);
          const trackIsrcs = tracks.map(track => track.id);

          const album = this.convertToAlbum(albumData, trackIsrcs);
          if (album) {
            allAlbums.push(album);
            tracks.forEach(track => allTracksSet.add(track));
          }
        }

        hasMoreAlbums = response.data.next !== null;
        offset += hasMoreAlbums ? limit : 0;
      }

      const allTracks = Array.from(allTracksSet);

      logPlatformFinish(PLATFORM_STRING, "getAlbums");
      return { allAlbums, allTracks };
    } catch (error) {
      logPlatformError(PLATFORM_STRING, "getAlbums", error);
      throw error;
    }
  }


  // for exports

  async searchTracksByIsrc(isrcs, accessToken) {
    try {
      logPlatformStart(PLATFORM_STRING, "searchTracksByIsrc");
      
      const spotifyIdsSet = new Set();
      
      for (const isrc of isrcs) {
        try {
          const response = await axios.get(
            `https://api.spotify.com/v1/search?q=isrc:${isrc}&type=track&limit=1`,
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
  
          if (response.data.tracks.items.length > 0) {
            const spotifyTrack = response.data.tracks.items[0];
            spotifyIdsSet.add(spotifyTrack.id);
          }
        } catch (error) {
          logger.error(`Error searching track with ISRC ${isrc}:`, error);
        }
      }
  
      logPlatformFinish(PLATFORM_STRING, "searchTracksByIsrc");
      return Array.from(spotifyIdsSet);
    } catch (error) {
      logPlatformError(PLATFORM_STRING, "searchTracksByIsrc", error);
      throw error;
    }
  }
  
  async searchAlbumsByUpc(upcs, accessToken) {
    try {
      logPlatformStart(PLATFORM_STRING, "searchAlbumsByUpc");
      
      const spotifyIdsSet = new Set();
      
      for (const upc of upcs) {
        try {
          const response = await axios.get(
            `https://api.spotify.com/v1/search?q=upc:${upc}&type=album&limit=1`,
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
  
          if (response.data.albums.items.length > 0) {
            const spotifyAlbum = response.data.albums.items[0];
            spotifyIdsSet.add(spotifyAlbum.id);
          }
        } catch (error) {
          logger.error(`Error searching album with UPC ${upc}:`, error);
        }
      }
  
      logPlatformFinish(PLATFORM_STRING, "searchAlbumsByUpc");
      return Array.from(spotifyIdsSet);
    } catch (error) {
      logPlatformError(PLATFORM_STRING, "searchAlbumsByUpc", error);
      throw error;
    }
  }
  
  async exportTracks(tracks, accessToken) {
    try {
      logPlatformStart(PLATFORM_STRING, "saveTracksToLibrary");
      
      const isrcs = tracks.map(track => track.id);
      
      const trackIds = await this.searchTracksByIsrc(isrcs, accessToken);
  
      const chunkSize = 50;
      for (let i = 0; i < trackIds.length; i += chunkSize) {
        const chunk = trackIds.slice(i, i + chunkSize);
        try {
          await axios.put(
            'https://api.spotify.com/v1/me/tracks',
            { ids: chunk },
            {
              headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          logger.error(`Error saving tracks chunk ${i/chunkSize + 1}:`, error);
          if (error.response?.status === 429) {
            const retryAfter = parseInt(error.response.headers['retry-after']) || 1;
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            i -= chunkSize;
          }
        }
      }
  
      logPlatformFinish(PLATFORM_STRING, "saveTracksToLibrary");
    } catch (error) {
      logPlatformError(PLATFORM_STRING, "saveTracksToLibrary", error);
      throw error;
    }
  }
  
  async exportAlbums(albums, accessToken) {
    try {
      logPlatformStart(PLATFORM_STRING, "saveAlbumsToLibrary");
  
      const upcs = albums.map(album => album.id);
      
      const albumIds = await this.searchAlbumsByUpc(upcs, accessToken);
  

      const chunkSize = 50;
      for (let i = 0; i < albumIds.length; i += chunkSize) {
        const chunk = albumIds.slice(i, i + chunkSize);
        try {
          await axios.put(
            'https://api.spotify.com/v1/me/albums',
            { ids: chunk },
            {
              headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          logger.error(`Error saving albums chunk ${i/chunkSize + 1}:`, error);
          if (error.response?.status === 429) { 
            const retryAfter = parseInt(error.response.headers['retry-after']) || 1;
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            i -= chunkSize;
          }
        }
      }
  
      logPlatformFinish(PLATFORM_STRING, "saveAlbumsToLibrary");
    } catch (error) {
      logPlatformError(PLATFORM_STRING, "saveAlbumsToLibrary", error);
      throw error;
    }
  }

  async exportPlaylists(playlists, accessToken) {
    try {
      logPlatformStart(PLATFORM_STRING, "createPlaylists");
  
      for (const playlist of playlists) {
        try {

          const createResponse = await axios.post(
            'https://api.spotify.com/v1/me/playlists',
            {
              name: playlist.name + LikeBox,
              description: playlist.description || '',
              public: false
            },
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const newPlaylistId = createResponse.data.id;
          const trackIsrcs = playlist.tracks;
          const spotifyTrackIds = await this.searchTracksByIsrc(trackIsrcs, accessToken);

          if (spotifyTrackIds.length > 0) {

            const chunkSize = 100;
            for (let i = 0; i < spotifyTrackIds.length; i += chunkSize) {
              const chunk = spotifyTrackIds.slice(i, i + chunkSize);
              
              try {
                await axios.post(
                  `https://api.spotify.com/v1/playlists/${newPlaylistId}/tracks`,
                  {
                    uris: chunk.map(id => `spotify:track:${id}`)
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                // API 속도 제한 고려
                await new Promise(resolve => setTimeout(resolve, 100));
                
              } catch (error) {
                logger.error(`Error adding tracks to playlist ${playlist.name}:`, error);
                if (error.response?.status === 429) {
                  const retryAfter = parseInt(error.response.headers['retry-after']) || 1;
                  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                  i -= chunkSize;
                }
              }
            }
          }
          
          // 각 플레이리스트 처리 사이에 약간의 지연
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          logger.error(`Error creating playlist ${playlist.name}:`, error);
        }
      }
  
      logPlatformFinish(PLATFORM_STRING, "createPlaylists");
    } catch (error) {
      logPlatformError(PLATFORM_STRING, "createPlaylists", error);
      throw error;
    }
  }
}

module.exports = Spotify;