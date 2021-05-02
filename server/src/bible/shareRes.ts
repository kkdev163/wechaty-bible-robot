import { UrlLink, Contact, Room} from 'wechaty';
import axios from 'axios';
import { formatChapter } from './plan';
import { get7cthDailyPageLink, get7cthSummaryPageLink } from './_7cth';
import { BOOK_CATALOG, ShareImg, Action_Receiver, Actions, SMDJ_CATALOG } from '../constants';
import { getWeekDay, getSongMsg, findChapterNumber, fillWithZero, searchSmdjDaily} from '../util';
import { CxPlanDTO, SmdjDaily } from '../interface';
var nzhcn = require("nzh/cn"); //直接使用简体中文
const moment = require('moment');

export function getConfigLink(room: Room |Contact, talker: Contact) {
    return new UrlLink({
        title: '读经助手设置',
        thumbnailUrl: ShareImg,
        url: `http://47.99.66.164/?roomId=${room.id}`,
        description: '读经提示、晨兴推送设置'
    })
}

export function getHomeLink() {
    return new UrlLink({
        title: '书报',
        thumbnailUrl: ShareImg,
        url: 'http://bibletruth01.oss-cn-hangzhou.aliyuncs.com/index.html',
        description: '书报'
    })
}

export function get7cthDaily(params?: CxPlanDTO) {
    const dayInWeek = getWeekDay() + 1;
    if (dayInWeek === 7) {
        return get7cthSummary();
    }
    return new UrlLink({
        title: '今日晨兴',
        thumbnailUrl: ShareImg,
        ...get7cthDailyPageLink(params)
    })
}

export function get7cthSummary(params?: CxPlanDTO) {
    return new UrlLink({
        title: '本周纲目',
        thumbnailUrl: ShareImg,
        ...get7cthSummaryPageLink(params),
    })
}

export function getBiblePlanLink(bookChapter, day?: any) {
    const { todayStart } = bookChapter;
    const dayFormat = moment(day).format('YYYY-MM-DD')

    return new UrlLink({
        title: `读经 ${dayFormat}`,
        thumbnailUrl: ShareImg,
        url: `https://bibletruth01.oss-cn-hangzhou.aliyuncs.com/bible/jw/hf_${todayStart[0] + 1}_${todayStart[1]}.html`,
        description: `进度: ${formatChapter(bookChapter)}`
    })
}

export function getBibleLink(bookIndex, startChapter) {
    return new UrlLink({
        title: `${BOOK_CATALOG[bookIndex][0]}`,
        thumbnailUrl: ShareImg,
        url: `https://bibletruth01.oss-cn-hangzhou.aliyuncs.com/bible/jw/hf_${bookIndex + 1}_${startChapter}.html`,
        description: `${BOOK_CATALOG[bookIndex][0]} ${startChapter} 章`
    })
}

export async function getSongShareLink(searchMsg) {
    const msg = getSongMsg(searchMsg);
    if (!msg) {
        return new UrlLink({
            title: '大本诗歌',
            thumbnailUrl: ShareImg,
            url: 'http://poetry.bibletruth01.cn/',
            description: '大本诗歌'
        })
    }
    return axios
        .get(`https://wxapi.bibletruth01.cn/wx/msg?msg=${msg}&IsSearch=true`, {

        })
        .then(res => {
            const data = res.data;
            const content = data.data;
            return new UrlLink({
                title: content.title,
                thumbnailUrl: ShareImg,
                url: content.url,
                description: content.digest
            })
        })
}

export async function getLeeArticle(){
    const res = await axios.get('https://xiumi.us/api/shows/by/untag?show_type&team_id=273517&limit=20&page=0', {
        headers: { Cookie: process.env.XiuMiCookie }
    });
    const data = res.data.data;
    const m = moment().format('YYYY年M月D日');
    const todayArticle = data.find(d => d.title.includes(m));
    return new UrlLink({
        title: 'Lee文集追求-' + m,
        url: todayArticle.show_url,
        thumbnailUrl: ShareImg,
        description: todayArticle.title.replace(/.+】/, '')
    })
}


const smdjPrefix = 'https://bibletruth01.oss-cn-hangzhou.aliyuncs.com/smdj8/'
const partableSmdjPrefix =  'http://bibletruth01.kkdev163.com/smdj/'
export function getSmdj(params: SmdjDaily) {
    const partInfo = params.part ? (params.part === 1 ? '-上半' : '-下半') : ''
    const prefix = partableSmdjPrefix;
    const url = prefix + params.chpaterId + '.html' + (params.part ? ('#part' + params.part) : '');
    const dayFormat = moment().format('YYYY-MM-DD')
    return new UrlLink({
        title: `生命读经 ${dayFormat}`,
        url,
        thumbnailUrl: ShareImg,
        description: `${params.bookName} 第${params.chapter}篇 ${partInfo}`
    })
}

export function getSmdjLink(text) {
    const searchText = text
        .replace(`@${Action_Receiver}`, '')
        .replace(Actions.Smdj, '')
        .trim()
    
    const smdjDaily = searchSmdjDaily(searchText);

    if (!smdjDaily) {
        return new UrlLink({
            title: `生命读经目录`,
            url: `${partableSmdjPrefix}/index.html`,
            thumbnailUrl: ShareImg,
        })
    } else {
        const { part, chpaterId, bookName, chapter} = smdjDaily;
        const partInfo = part ? (part === 1 ? '-上半' : '-下半') : ''
        const prefix = partableSmdjPrefix;
        const url = prefix + chpaterId + '.html' + (part ? ('#part' + part) : '');
        return new UrlLink({
            title: `《${bookName}生命读经》`,
            url,
            thumbnailUrl: ShareImg,
            description: `第${chapter}篇 ${partInfo}`
        })
    }   
}
