// SaveRef
class SaveRef {
  constructor(id, platforms = []) {
    if (!id) throw new Error("ID is required");
    this._id = id;
    this._savedPlatforms = new Set(platforms);
  }

  get id() {
    return this._id;
  }

  get platforms() {
    return Array.from(this._savedPlatforms);
  }

  addPlatform(platform) {
    if (!platform) throw new Error("Platform is required");
    this._savedPlatforms.add(platform);
  }

  removePlatform(platform) {
    if (!platform) throw new Error("Platform is required");
    this._savedPlatforms.delete(platform);
  }

  hasPlatform(platform) {
    if (!platform) throw new Error("Platform is required");
    return this._savedPlatforms.has(platform);
  }

  get isEmpty() {
    return this._savedPlatforms.size === 0;
  }
}

// TrackRef, PlaylistRef, AlbumRef는 SaveRef를 상속만 받음
class TrackRef extends SaveRef {}
class PlaylistRef extends SaveRef {}
class AlbumRef extends SaveRef {}
class ArtistRef extends SaveRef {}

// UserContentData.js
class UserContentData {
  constructor(uid) {
    if (!uid) throw new Error("UID is required");
    this._uid = uid;
    this._likedTracks = new Map();    // id -> TrackRef
    this._playlists = new Map();      // id -> PlaylistRef
    this._albums = new Map();         // id -> AlbumRef
    this._artists = new Map();        // id -> ArtistRef
  }

  get uid() {
    return this._uid;
  }

  get likedTracks() {
    return Array.from(this._likedTracks.keys());
  }

  get playlists() {
    return Array.from(this._playlists.keys());
  }

  get albums() {
    return Array.from(this._albums.keys());
  }

  get artists() {
    return Array.from(this._artists.keys());
  }

  // Track 관련 메서드
  saveLikedTrack(id, platform) {
    if (!id) throw new Error("Track ID is required");
    if (!platform) throw new Error("Platform is required");

    let trackRef = this._likedTracks.get(id);
    if (!trackRef) {
      trackRef = new TrackRef(id);
      this._likedTracks.set(id, trackRef);
    }
    trackRef.addPlatform(platform);
  }

  unsaveLikedTrack(id, platform) {
    if (!id) throw new Error("Track ID is required");
    if (!platform) throw new Error("Platform is required");

    const trackRef = this._likedTracks.get(id);
    if (trackRef) {
      trackRef.removePlatform(platform);
      if (trackRef.isEmpty) {
        this._likedTracks.delete(id);
      }
    }
  }

  // Playlist 관련 메서드
  savePlaylist(id, platform) {
    if (!id) throw new Error("Playlist ID is required");
    if (!platform) throw new Error("Platform is required");

    let playlistRef = this._playlists.get(id);
    if (!playlistRef) {
      playlistRef = new PlaylistRef(id);
      this._playlists.set(id, playlistRef);
    }
    playlistRef.addPlatform(platform);
  }

  unsavePlaylist(id, platform) {
    if (!id) throw new Error("Playlist ID is required");
    if (!platform) throw new Error("Platform is required");

    const playlistRef = this._playlists.get(id);
    if (playlistRef) {
      playlistRef.removePlatform(platform);
      if (playlistRef.isEmpty) {
        this._playlists.delete(id);
      }
    }
  }

  // Album 관련 메서드
  saveAlbum(id, platform) {
    if (!id) throw new Error("Album ID is required");
    if (!platform) throw new Error("Platform is required");

    let albumRef = this._albums.get(id);
    if (!albumRef) {
      albumRef = new AlbumRef(id);
      this._albums.set(id, albumRef);
    }
    albumRef.addPlatform(platform);
  }

  unsaveAlbum(id, platform) {
    if (!id) throw new Error("Album ID is required");
    if (!platform) throw new Error("Platform is required");

    const albumRef = this._albums.get(id);
    if (albumRef) {
      albumRef.removePlatform(platform);
      if (albumRef.isEmpty) {
        this._albums.delete(id);
      }
    }
  }

  // Artist 관련 메서드
  saveArtist(id, platform) {
    if (!id) throw new Error("Artist ID is required");
    if (!platform) throw new Error("Platform is required");

    let artistRef = this._artists.get(id);
    if (!artistRef) {
      artistRef = new ArtistRef(id);
      this._artists.set(id, artistRef);
    }
    artistRef.addPlatform(platform);
  }

  unsaveArtist(id, platform) {
    if (!id) throw new Error("Artist ID is required");
    if (!platform) throw new Error("Platform is required");

    const artistRef = this._artists.get(id);
    if (artistRef) {
      artistRef.removePlatform(platform);
      if (artistRef.isEmpty) {
        this._artists.delete(id);
      }
    }
  }

  // 조회 메서드
  getLikedTracksByPlatform(platform) {
    if (!platform) throw new Error("Platform is required");
    return Array.from(this._likedTracks.values())
      .filter(ref => ref.hasPlatform(platform))
      .map(ref => ref.id);
  }

  getPlaylistsByPlatform(platform) {
    if (!platform) throw new Error("Platform is required");
    return Array.from(this._playlists.values())
      .filter(ref => ref.hasPlatform(platform))
      .map(ref => ref.id);
  }

  getAlbumsByPlatform(platform) {
    if (!platform) throw new Error("Platform is required");
    return Array.from(this._albums.values())
      .filter(ref => ref.hasPlatform(platform))
      .map(ref => ref.id);
  }

  getArtistsByPlatform(platform) {
    if (!platform) throw new Error("Platform is required");
    return Array.from(this._artists.values())
      .filter(ref => ref.hasPlatform(platform))
      .map(ref => ref.id);
  }

  // 상태 확인 메서드
  isLikedTrackSaved(id, platform) {
    const ref = this._likedTracks.get(id);
    return ref ? ref.hasPlatform(platform) : false;
  }

  isPlaylistSaved(id, platform) {
    const ref = this._playlists.get(id);
    return ref ? ref.hasPlatform(platform) : false;
  }

  isAlbumSaved(id, platform) {
    const ref = this._albums.get(id);
    return ref ? ref.hasPlatform(platform) : false;
  }

  isArtistSaved(id, platform) {
    const ref = this._artists.get(id);
    return ref ? ref.hasPlatform(platform) : false;
  }

  // 데이터 변환
  toJSON() {
    return {
      uid: this._uid,
      likedTracks: Array.from(this._likedTracks.values()).map(ref => ({
        id: ref.id,
        platforms: ref.platforms
      })),
      playlists: Array.from(this._playlists.values()).map(ref => ({
        id: ref.id,
        platforms: ref.platforms
      })),
      albums: Array.from(this._albums.values()).map(ref => ({
        id: ref.id,
        platforms: ref.platforms
      })),
      artists: Array.from(this._artists.values()).map(ref => ({    // 추가
        id: ref.id,
        platforms: ref.platforms
      }))
    };
  }
}

module.exports = {
  SaveRef,
  TrackRef,
  PlaylistRef,
  AlbumRef,
  ArtistRef,
  UserContentData
};