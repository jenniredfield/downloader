const playlist = require('./list');

const extractArtistAndSong = (playlist) => {
    return playlist.map((p) => {
        return {
            artist: p.track.album.artists[0].name,
            name: p.track.name,
        };
    });
};

const songs = extractArtistAndSong(playlist);

module.exports = songs;
