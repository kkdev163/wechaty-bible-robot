const assert = require('assert');

const SongMatchRegMap = {
    'qin': /青年诗歌/,
    'xin': /新歌/,
    'er': /儿童/,
    'B': /补充本|小本|补诗歌/,
    'D': /大本|诗歌/
}

export function containSongText(text) {
    return Object.values(SongMatchRegMap).some(reg => reg.test(text));
}

export function getSongMsg(searchMsg) {
    const match = /(\d+)/.exec(searchMsg);
    if (!match) { return ''}

    const type = Object.keys(SongMatchRegMap).find(k => {
        let reg  = SongMatchRegMap[k];
        return reg.test(searchMsg);
    })
    return `${type}${match[1]}`
}

function test() {
    assert(getSongMsg('补充本 25 ') === 'B25', '解析补充本失败')
    assert(getSongMsg('小本诗歌 25 首') === 'B25', '解析补充本失败')
    assert(getSongMsg('小本 25 首') === 'B25', '解析补充本失败')
    assert(getSongMsg('补诗歌 25 首') === 'B25', '解析补充本失败')

    assert(getSongMsg('大本 25 首') === 'D25', '解析大本失败')
    assert(getSongMsg('大本诗歌 25 首') === 'D25', '解析大本失败')
    assert(getSongMsg('诗歌 25 首') === 'D25', '解析大本失败')

    assert(getSongMsg('儿童诗歌 25 首') === 'er25', '解析儿童失败')
    assert(getSongMsg('儿童 25 首') === 'er25', '解析儿童失败')

    assert(getSongMsg('青年诗歌 25 首') === 'qin25', '解析青年诗歌失败')
    
    assert(getSongMsg('新歌 25 首') === 'xin25', '解析新歌失败')
    assert(getSongMsg('新歌颂咏 25 首') === 'xin25', '解析新歌失败')
}

test();