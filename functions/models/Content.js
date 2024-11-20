// Content.js
class Content {
  constructor(id, pid, platform) {
    if (!id) {
      throw new Error("ID is required");
    }
    if (!pid) {
      throw new Error("PID is required");
    }
    if (!platform) {
      throw new Error("Platform is required");
    }
    
    this.id = id;
    this.pid = pid;
    this.platform = platform;
  }

  toJSON() {
    return {
      id: this.id,
      pid: this.pid,
      platform: this.platform
    };
  }
}

// Playlist class
class Playlist extends Content {
  constructor(pid, platform, name = "", description = "", coverImageUrl = "", tracks = [], owner = "", trackCount = 0) {
    const id = pid + platform;
    super(id, pid, platform);
    this.name = name;
    this.description = description;
    this.coverImageUrl = coverImageUrl;
    this.tracks = tracks;
    this.owner = owner;
    this.trackCount = trackCount;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      description: this.description,
      coverImageUrl: this.coverImageUrl,
      tracks: this.tracks,
      owner: this.owner,
      trackCount: this.trackCount
    };
  }

  toJSONWithTracks() {
    return {
      ...super.toJSON(),
      name: this.name,
      description: this.description,
      coverImageUrl: this.coverImageUrl,
      tracks: this.tracks.map(track => track.toJSON()),
      owner: this.owner,
      trackCount: this.trackCount
    };
  }
}

// Track class
class Track extends Content {
  constructor(isrc, pid, platform, name = "", albumArtUrl = "", artists = [], albumName = "", durationMs = 0) {
    super(isrc, pid, platform);
    this.name = name;
    this.albumArtUrl = albumArtUrl;
    this.artists = artists;
    this.albumName = albumName;
    this.durationMs = durationMs;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      albumArtUrl: this.albumArtUrl,
      artists: this.artists,
      albumName: this.albumName,
      durationMs: this.durationMs
    };
  }
}

// Album class
class Album extends Content {
  constructor(upc, pid, platform, name = "", coverImageUrl = "", artists = [], tracks = [], releasedDate = 0, trackCount = 0) {
    super(upc, pid, platform);
    this.name = name;
    this.coverImageUrl = coverImageUrl;
    this.artists = artists;
    this.tracks = tracks;
    this.releasedDate = releasedDate;
    this.trackCount = trackCount;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      coverImageUrl: this.coverImageUrl,
      artists: this.artists,
      tracks: this.tracks,
      releasedDate: this.releasedDate,
      trackCount: this.trackCount
    };
  }

  toJSONWithTracks() {
    return {
      ...super.toJSON(),
      name: this.name,
      coverImageUrl: this.coverImageUrl,
      artists: this.artists,
      tracks: this.tracks.map(track => track.toJSON()),
      releasedDate: this.releasedDate,
      trackCount: this.trackCount
    };
  }
}

// Artist class
class Artist extends Content {
  constructor(pid, platform, name = "", thumbnailUrl = "", genres = [], followerCount = 0, externalUrl = "", popularity = 0)
  {
    const id = pid + platform;

    super(id, pid, platform);

    this.name = name;
    this.thumbnailUrl = thumbnailUrl;
    this.genres = genres;
    this.followerCount = followerCount;
    this.externalUrl = externalUrl;
    this.popularity = popularity;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      thumbnailUrl: this.thumbnailUrl,
      genres: this.genres,
      followerCount: this.followerCount,
      externalUrl: this.externalUrl,
      popularity: this.popularity
    };
  }
}

module.exports = {
  Content,
  Playlist,
  Track,
  Album,
  Artist
};