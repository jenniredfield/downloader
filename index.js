require('dotenv').config()
const { default: axios } = require('axios');
const fs = require('fs');
const path = require('path');
const songs = require('./helpers');
const ProgressBar = require('progress');

const QUERY_ENDPOINT = process.env.QUERY_ENDPOINT;
const DOWNLOAD_ENDPOINT = process.env.DOWNLOAD_ENDPOINT;

const user_agent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36 OPR/74.0.3911.203';

function queryList(query) {
    const url = QUERY_ENDPOINT.replace('[q]', query);
    return axios
        .get(url, { headers: { 'User-Agent': user_agent } })
        .then((res) => {
            return res.data.audios[''][0];
        })
        .catch((err) => {
            console.log(err.statusText);
            console.log('there was a problem with ', query);
            console.log('url', url);
        });
}

async function download(id, duration, songUrl, title, extra) {
    const url = `
    ${DOWNLOAD_ENDPOINT}/
    ${id}/${duration}/
    ${songUrl}/${encodeURIComponent(title)}.mp3?extra=${extra}`;

    const output = path.resolve(__dirname, './downloads/' + title + '.mp3');
    const writer = fs.createWriteStream(output);

    let response;

    try {
        response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            headers: { 'User-Agent': user_agent },
        });

        const totalLength = response.headers['content-length'];

        console.log('Starting download...');
        const progressBar = new ProgressBar('-> downloading [:bar] :percent :etas', {
            width: 40,
            complete: '=',
            incomplete: ' ',
            renderThrottle: 1,
            total: parseInt(totalLength),
        });

        response.data.on('data', (chunk) => progressBar.tick(chunk.length));
        response.data.pipe(writer);
    } catch (err) {
        console.log('error', err);
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', () => {
            console.log('error writing');
            reject();
        });
    });
}

async function getList(playlist) {
    try {
        const songOptions = [];
        for (let i = 0; i < playlist.length; i++) {
            const song = playlist[i];
            const query = `${song.artist} ${song.name}`;
            const result = await queryList(query);
            songOptions.push(result);
        }

        for (let i = 0; i < songOptions.length; i++) {
            const song = songOptions[i];
            if (!song) {
                continue;
            }
            const { id, duration, tit_art, url, extra } = song;
            await download(id, duration, url, tit_art, extra);
            console.log('song donwloaded');
        }
    } catch (err) {

    }
}

getList(songs);

// test function
async function getSongsOptions(songOptions) {
    for (let i = 0; i < songOptions.length; i++) {
        const song = songOptions[i];
        if (!song) {
            continue;
        }
        const { id, duration, tit_art, url, extra } = song;
        await download(id, duration, url, tit_art, extra);
        console.log('downloaded');
    }
}
