const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 3000; // 원하는 포트 번호로 변경

app.use(bodyParser.urlencoded({ extended: true }));

// Slack 커맨드 처리
app.post('/', async (req, res) => {
  const searchQuery = req.body.text; // 슬랙 커맨드에서 입력 받은 검색 텍스트

  try {
    // Notion API를 호출하여 검색 수행
    const notionResponse = await searchInNotion(searchQuery);

    // Slack에 응답 보내기
    const slackResponse = {
      response_type: 'in_channel', // 'in_channel' 또는 'ephemeral' (비공개 응답) 설정 가능
      text: '검색 결과: ' + notionResponse,
    };
    res.json(slackResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send('오류가 발생했습니다.');
  }
});

// Notion API와 통신하여 검색 수행
async function searchInNotion(query) {
  const NOTION_API_KEY = process.env.NOTION_API_KEY; // Notion API 토큰
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID; // 검색하려는 Notion 데이터베이스 ID

  const notionApiUrl = `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`;
  const headers = {
    'Authorization': `Bearer ${NOTION_API_KEY}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2021-05-13', // Notion API 버전 설정
  };

  const requestBody = {
    filter: {
      property: 'title',
      text: {
        contains: query,
      }
    },
  };
  console.log(requestBody)

  try {
    const response = await axios.post(notionApiUrl, requestBody, { headers });
    const results = response.data.results;
    console.log(JSON.stringify(results))
    if (results.length > 0) {
      // 검색 결과 처리
      const formattedResults = results.map((item) => {
        const title = item.properties.Title.rich_text[0].plain_text;
        const url = item.url; // Notion 문서의 URL
      
        return `<${url}|${title}>`; // 링크된 문서 제목 생성
      });
      
      const response = formattedResults.join(', ');
      // return results.map((item) => item.properties.Title.rich_text[0].plain_text).join(', ');
      return response;
    } else {
      return '검색 결과 없음';
    }
  } catch (error) {
    throw error;
  }
}

app.listen(port, () => {
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
});