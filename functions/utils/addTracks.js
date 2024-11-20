const trackService = require("../services/trackService");

// 클라이언트 repo 보조 함수
async function addTracksToPlaylist(uid, playlist){

  let tracks = await trackService.getTracks(uid, playlist.tracks);
  playlist.tracks = tracks

  return playlist;

}

// 클라이언트 repo 보조 함수
async function addTracksToAlbum(uid, album){

  let tracks = await trackService.getTracks(uid, album.tracks);
  album.tracks = tracks

  return album;

}

module.exports = {
  addTracksToPlaylist,
  addTracksToAlbum
}