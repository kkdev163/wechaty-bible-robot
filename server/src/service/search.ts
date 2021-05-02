import { search, parseRes } from './esClient';
import { SMDJ_CATALOG, BOOK_CATALOG} from '../constants'
import { findChapterNumber } from '../util/smdjUtils';
import { fillWithZero } from '../util';
const path = require('path');

export interface BibleSearchResult {
  bookName: string,
  bookNameAbbr: string,
  chapterN: number,
  chapterS: string,
  section: string,
  sectionCn: string,
  content: string
}

interface SearchSmdjSchema {
  bookName: string,
  bookNameAbbr: string,
  chapterN: number,
  chapterS: string,
  type: string,
  content: string,
}

export interface SearchSmdjDto extends SearchSmdjSchema{
  nodeLink: SearchSmdjSchema []
}

export interface BiblePickDto {
  bookName: string,
  bookNameAbbr: string,
  chapterN: number,
  chapterS: string,
  sections: string[],
}

export async function biblePick(pickInfo: BiblePickDto): Promise<BibleSearchResult[]> {
  const sections = pickInfo.sections;
  const shouldCondition = sections.map((sectionCn, i)=> {
    // 第一个和最后一个需要完全匹配
    if (i === 0 || i === sections.length-1) {
      return {
        "match_phrase": { sectionCn }
      }
    }
    // 中间的只要部分匹配即可
    return { "match": { sectionCn }}
  })

  const result = await search({
    "query": {
      "bool": {
        "must": [
          { "term": { "bookNameAbbr": pickInfo.bookNameAbbr } },
          { "term": { "chapterN": pickInfo.chapterN }},
          { "bool": { "should": shouldCondition } }
        ]
      }
    },
    "size": 200
  })
  const data: BibleSearchResult[] = parseRes(result, {onlySource: true});
  data.sort((a, b)=> {
    const sectionA = /(\d+)(a|b)?/.exec(a.section);
    const sectionB = /(\d+)(a|b)?/.exec(b.section);

    if (sectionA[1] !== sectionB[1]) {
      return +sectionA[1] - +sectionB[1]
    }
    return sectionA[2].charCodeAt(0) - sectionB[2].charCodeAt(0)
  });
  return data;
}

export async function bibleSearch(content: string, limit: number = 10): Promise<BibleSearchResult[]> {
  const result = await search({
    "query": {
      "match": {
        "content": content
      }
    },
    "size": limit
  });
  const data: BibleSearchResult[]  = parseRes(result, { onlySource: true })

  function getBibleLink(d: BibleSearchResult) {
    const index = BOOK_CATALOG.findIndex(c => c[0] === d.bookName);
    return `/bible/jw/hf_${index}_${d.chapterN}.html`
  }
  return data.map(d => ({
    ...d,
    bookIndex: getBibleLink(d)
  }));
}

export async function smdjSearch(content: string, limit: number = 10): Promise<SearchSmdjDto[]> {
  const result = await search({
    "query": {
      "match": {
        "content": content
      }
    },
    "size": limit
  }, 'smdj');
  
  const data = parseRes(result, { onlySource: true });
  const links = await Promise.all(data.map(getNodeLink))

  const getLink = (d) => {
    return `smdj8/${fillWithZero(findChapterNumber([d.bookName, d.chapterN]), 4)}.html`
  }

  return data.map((d, i)=> (
    { ...d,
      nodeLink: links[i],
      link:  getLink(d)
    }));
}

async function getNodeLink(d: SearchSmdjDto): Promise<SearchSmdjSchema []> {
  const num = findChapterNumber([d.bookName, d.chapterN])
  const content = require(path.join(__dirname, '../util/smdj-es-doc', fillWithZero(num, 4) + '.json'))
  const currentIndex = content.findIndex(it => it.type === d.type && it.content === d.content);

  const links = [];
  let lastType = /\d/.test(d.type) ? +d.type : 999;
  for(let i = currentIndex - 1; i>=0; i--) {
    if (/\d/.test(content[i].type) && lastType > +content[i].type) {
      lastType = +content[i].type;
      if (lastType >0) { // 0级标题不放入
        links.unshift(content[i])
      }
    }
  }

  // 找到内容节点
  if (d.type !== 'c') {
      content.slice(currentIndex+1).some((it)=> {
        if (it.type === 'c') {
          links.push(it)
          return true;
        }
        if (/\d/.test(d.type) && +it.type < +d.type) {
          links.push(it);
        }
        return false;
      })
  } else {
    links.push(d);
  }

  return links;
}

smdjSearch('神就是爱');