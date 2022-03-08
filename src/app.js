const express = require('express');
const tencentcloud = require("tencentcloud-sdk-nodejs");
var parser = require('body-parser');
const search_engine = require('search-engine-nodejs').default;
const cors = require('cors');
const app = express();
const { numberToChinese } = require('./utils');

const NlpClient = tencentcloud.nlp.v20190408.Client;
const clientConfig = {
  credential: {
    secretId: "腾讯云secretId",
    secretKey: "腾讯云secretKey",
  },
  region: "ap-guangzhou",
  profile: {
    httpProfile: {
      endpoint: "nlp.tencentcloudapi.com",
    },
  },
};
const client = new NlpClient(clientConfig);

app.use(cors());
app.use(parser.json());

app.post("/api/getMessage", async (req, res) => {
  const params = {
    "Flag": 1,
    "Query": req?.body?.topic
  };
  client.ChatBot(params).then(
    (data) => {
      res.send({ data: data?.Reply });
    },
    (err) => {
      res.send({ data: null });
    }
  );
});

app.post("/api/getAnswer", async (req, res) => {
  const { question, options } = req?.body?.info;
  const optionMap = new Map();
  for (let i = 0; i < options.length; i++) {
    optionMap.set(options[i], 0);
  }
  const results = await search_engine.Baidu({ qs: { q: question } });
  console.log('问题:', question);
  (results || [])?.filter(e => e && e.description).map(e => {
    options.forEach(option => {
      console.log(e?.description);
      const array = e?.description.match(new RegExp(!isNaN(option) ? // 是数字转为中文数字
        numberToChinese(option) :
        option, 'g'));
      if (array && array.length > 0) {
        console.log(`${option}匹配了${array.length}次`);
        optionMap.set(option, optionMap.get(option) + array.length);
      } else {
        console.log(`${option}匹配了0次`);
      }
    });
    return e;
  });
  const answers = Array.from(optionMap).map(e => ({ option: e[0], value: e[1] }));
  const total = answers.reduce((pre, curr) => pre + curr.value, 0) || 1;
  const data = Array.from(optionMap).map(e => ({ option: e[0], rate: (e[1] * 100 / total).toFixed(2) })).sort((a, b) => +b.rate < +a.rate);
  res.send({ data });
});

app.listen(10086)