import { bibleSearch, smdjSearch } from '../service/search';
import { res } from './utils';

export async function searchBible(ctx) {
    const text = ctx.request.query.text;
    const result = await bibleSearch(text);
    res(ctx, result);
}

export async function searchSmdj(ctx) {
    const text = ctx.request.query.text;
    const result = await smdjSearch(text);
    res(ctx, result);
}