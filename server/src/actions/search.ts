import { Contact, Room } from "wechaty";
import { bibleSearch, smdjSearch, biblePick, BibleSearchResult} from '../service/search';
import { Action_Receiver, Actions, BOOK_CATALOG, ReadBibleFORMAT} from "../constants"
import { getReadGroups } from '../util/bibleUtils';
import { getBibleTextImage, getSmdjTextImage} from '../util/drawUtils';
import { getDevLogger } from '../util/devUtils';

// 读经
export async function sayReadBible(room: Room | Contact, text) {
  const result = await getReadBible(text);
  if (result.sections.length > 0) {
    await room.say('正在查询 请稍候');
    const file = await getBibleTextImage(result);
    return room.say(file)
  } else {
    await room.say(`格式错误，请输入 ${ReadBibleFORMAT}`)
  }
}

// 获取查经内容
export async function getReadBible(text) {
  const [range, readGroups] = getReadGroups(text) ;
  const searchResult = await Promise.all(readGroups.map(biblePick));
  
  const sections = searchResult.reduce((acc, sects) => {
    return [...acc, ...sects]
  }, []);

  return {
    sectionRange: '读经: ' + range,
    sections: sections
  };
}

export async function saySearchBible(room: Room | Contact, text) {  
  const { searchText, limit } = getSearchParams(Actions.SearchBible, text);
  if (!searchText) {
    await room.say(`格式错误，请输入 @${Action_Receiver} ${Actions.SearchBible} 神就是爱 5条`)
  }
  await room.say('正在查询 请稍候');
  // 未命中进行搜索
  let logger = getDevLogger();
  const result = await bibleSearch(searchText, limit);
  logger('search');
  const file = await getBibleTextImage({
    sectionRange: '查经: ' + searchText,
    sections: result
  });
  logger('draw');
  await room.say(file)
  logger('transorm data');
}

export async function saySearchSmdj(room: Room | Contact, text) {
  const { searchText, limit } = getSearchParams(Actions.SearchSmdj, text);

  if (!searchText) {
    await room.say(`格式错误，请输入 @${Action_Receiver} ${Actions.SearchSmdj}  5条`)
  }
  await room.say('正在查询 请稍候');
  let logger = getDevLogger();
  const result = await smdjSearch(searchText, limit);
  logger('search');
  const file = await getSmdjTextImage({
    title: '查生命读经: ' + searchText,
    contents: result
  })
  logger('draw');
  await room.say(file)
  logger('transorm data');

}

export function getSearchParams(action, text) {
  const matchLimit = /(\d+)\s*条/.exec(text);
  let limit = 5;
  
  if (matchLimit) {
    limit = Math.min(+matchLimit[1], 50)
  }

  const searchText = text
    .replace(`@${Action_Receiver}`, '')
    .replace(action, '')
    .replace(/(\d+)\s*条/, '')
    .trim()

  return { searchText, limit };
}