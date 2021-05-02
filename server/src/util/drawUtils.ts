import { BibleSearchResult, SearchSmdjDto, smdjSearch} from '../service/search';
import { getReadBible, getSearchParams } from '../actions/search';
import { ReadBibleFORMAT, Actions, ActionHelperDetail } from '../constants';
const { createCanvas, loadImage } = require('canvas')
import { FileBox } from 'file-box';
import { getDevLogger } from './devUtils';

const fs = require('fs');
const path = require('path');

async function getMockData() {
    const dataPath = path.join(__dirname, 'bibleData.json');
    try {
        const data = require(dataPath);
        console.log('get data from local')
        return data;
    } catch (error) {
        const bible = await getReadBible(ReadBibleFORMAT);
        fs.writeFileSync(path.join(__dirname, 'bibleData.json'), JSON.stringify(bible))
        return bible;
    }
}

export async function getBibleTextImage({ sectionRange, sections}) {
    const contents = sections.map(s => ({
        title: `${s.bookNameAbbr}${s.chapterN}:${s.sectionCn}`,
        content: s.content
    }));

    const dataUrl =  drawArticleImage({ title: sectionRange, contents });
    const file =  FileBox.fromDataURL(dataUrl, '读经.jpeg');
    return file;
}


interface DrawSmdjTextParams {
    title: string,
    contents: SearchSmdjDto[]
}

export async function getSmdjTextImage({ title, contents}: DrawSmdjTextParams) {
    const drawContents = contents.map(s => {
        const contentNode = s.nodeLink.pop();
        return {
            title: `《${s.bookName}生命读经》 第${s.chapterS}篇`,
            subTitle: s.nodeLink.map(l => l.content).join('_'),
            content: contentNode.content
        }
    });

    const dataUrl = drawArticleImage({ title, contents: drawContents });
    return FileBox.fromDataURL(dataUrl, '读经.jpeg');
}

export async function getHelperImg() {
    const drawContents = ActionHelperDetail.map(c => {
        const contentArray = c.split(':');
        return {
            title: contentArray[0],
            content: contentArray.slice(1).join(':')
        }
    })
    const dataUrl = drawArticleImage({ title: '读经助手使用帮助', contents: drawContents, size: 'small'});
    return FileBox.fromDataURL(dataUrl, '读经助手使用帮助.jpeg');
}



interface ArticleSection {
    title: string;
    subTitle?: string;
    content: string;
}

interface DrawArticleParams {
    title: string;
    contents: ArticleSection[],
    size?: 'large'| 'small'
}

export function drawArticleImage({ title, contents, size = 'large'}: DrawArticleParams): string {
    const dpi = process.env.DRAW_DPI ? +process.env.DRAW_DPI : 3;
    const maxWidth = dpi * 360;
    const canvas = createCanvas(maxWidth, dpi * 10000)
    const ctx = canvas.getContext('2d')
    
    const sizeMultiple = size === 'large' ? 1 : 0.8

    const padding =  dpi * 10 ;
    const headMarginTop = sizeMultiple * dpi * 18;

    const linkFontSize = sizeMultiple * dpi * 18;
    const linkFontColor = '#2040A0';

    const headFontSize = sizeMultiple * dpi * 18;
    const headFontColor = 'red';

    const contentFontSize = sizeMultiple * dpi * 22;
    const contentFontColor = 'black';

    const fontFamily = '"SimSun"'; //宋体

    const lineMargin = sizeMultiple * dpi * 10;
    var currentHeihgt = (dpi * 50) + lineMargin;
    
    drawContent();

    const canvas2 = createCanvas(maxWidth, currentHeihgt)
    const ctx2 = canvas2.getContext('2d')
    ctx2.fillStyle = '#E0E0E0'
    ctx2.fillRect(0, 0, maxWidth, currentHeihgt)
    ctx2.drawImage(canvas, 0, 0)

    const q = process.env.DRAW_QUALITY ? +process.env.DRAW_QUALITY : 0.3;
    const dataURL = canvas2.toDataURL('image/jpeg', q);
    return dataURL;

    function drawContent() {
        if (title) {
            ctx.font = `${linkFontSize}px ${fontFamily}`;
            ctx.fillStyle = linkFontColor;
            drawText(title)
        }
        currentHeihgt += headMarginTop;

        contents.forEach((section) => {
            ctx.font = `${headFontSize}px ${fontFamily}`;
            ctx.fillStyle = headFontColor;
            drawText(section.title)

            if (section.subTitle) {
                ctx.font = `${linkFontSize}px ${fontFamily}`;
                ctx.fillStyle = headFontColor;
                drawText(`${section.subTitle}`, 2)
            }

            ctx.font = `${contentFontSize}px ${fontFamily}`;
            ctx.fillStyle = contentFontColor;
            drawText(`${section.content}`, 4, 2 * lineMargin);
        })

        function drawText(text, emptyCharCount=0, sectionMargin = 0) {
            const emptyChar = new Array(emptyCharCount).fill(0).map(_ => ' ').join('');
            const lines = getLines(`${emptyChar}${text}`);
            // 前置 margin
            currentHeihgt += sectionMargin;
            
            lines.forEach(l => {
                ctx.fillText(l, padding, currentHeihgt)
                // 段落内 margin
                currentHeihgt += (contentFontSize + lineMargin)
            })
            // 后置 margin
            currentHeihgt += sectionMargin;
        }

        function getLines(str) {
            let content = str.split('');
            let lines = [];
            while (content.length > 0) {
                let currentLine = [];
                while (ctx.measureText(currentLine.join('')).width < maxWidth - 3 * padding && content.length) {
                    currentLine.push(content.shift())
                }
                lines.push(currentLine.join(''));
            }
            return lines;
        }
    }
}


async function testDrawSmdj(text) {
    const { searchText, limit } = getSearchParams(Actions.SearchSmdj, text);
    let logger = getDevLogger();
    const result = await smdjSearch(searchText, limit);
    logger('search');
    const file = await getSmdjTextImage({
        title: '生命读经搜索: ' + searchText,
        contents: result
    })
    logger('draw');
    logger('transorm data');
}

(async ()=>{
    //const mockData = await getMockData();
    //await drawBibleText(mockData)
    //await testDrawSmdj('生爱世人');
})()
