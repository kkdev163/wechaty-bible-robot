const { Client } = require('@elastic/elasticsearch');

const ip = process.env.server_ip || '127.0.0.1';
const esConfig = {
  node: [`http://${ip}:9200`],
  index: 'bible_hf',
  type: '_doc',
};

const esClient = new Client({ node: esConfig.node });

async function bulkInsert(datas) {
  const body = [];
  datas.forEach((doc) => {
    body.push({
      index: { _index: esConfig.index, _type: esConfig.type }
    });
    body.push(doc);
  });
  const result = await esClient.bulk({ body });
  return result;
}

async function search(body, index = esConfig.index) {
  return esClient.search({
    index,
    type: esConfig.type,
    body
  });
}

interface Option {
  onlySource?: boolean,
  pageSource?: boolean,
  onlyAgg?: boolean,
  aggKey?: string
}

function parseRes(res, options: Option = {}) {
  if (!res) {
    return null;
  }
  const { statusCode, body, headers } = res;
  if (statusCode !== 200) {
    throw new Error(`ES statusCode: ${statusCode}`);
  }
  // 是否只返回 source
  if (options.onlySource) {
    return body.hits && body.hits.hits.map(h => h._source);
  }
  // 返回带 page 信息的 source
  if (options.pageSource) {
    return {
      total: body.hits.total,
      records: body.hits.hits.map(h => ({
        ...h._source,
        id: h._id
      }))
    };
  }

  // 是否只返回 聚合结果
  if (options.onlyAgg) {
    // 如果提供了聚合的键，目前只兼容了 bucket 聚合
    if (options.aggKey && body.aggregations) {
      return body.aggregations[options.aggKey].buckets;
    }
    return body.aggregations || [];
  }
  return body;
}

export {
  bulkInsert,
  search,
  parseRes
}