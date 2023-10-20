const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 9876; // 원하는 포트 번호로 변경

function formatDateFromNotion(notionDate) {
  const date = new Date(notionDate);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  return formattedDate;
}

// 검색 쿼리를 생성하는 함수
function generateSearchQuery(searchTerms) {
  if (!searchTerms) {
    return null; // 검색 조건이 없는 경우 null 반환
  }

  let filter;
  const searchConditions = searchTerms.split('||');

  if (searchConditions.length === 1) {
    // ||로 분리한 배열의 길이가 1이면, Task 검색
    filter = {
      filter: {
        property: 'Task',
        text: {
          contains: searchConditions[0],
        },
      },
    };
  } else if (searchConditions.length === 3) {
    // ||로 분리한 배열의 길이가 3이면, 멀티 검색 조건 사용
    const searchTerm = searchConditions[0];
    const searchType = searchConditions[1];
    const searchDate = searchConditions[2];

    if (searchType === 'task-id' && /^\d+$/.test(searchDate)) {
      // Task ID로 검색 (숫자 값)
      filter = {
        filter: {
          property: 'Task-id.unique_id.number',
          number: {
            equals: parseInt(searchTerm),
          },
        },
      };
    } else if (/^\d{6}$/.test(searchDate)) {
      // yymmdd 형태의 날짜로 검색
      const formattedDate = `20${searchDate.substr(0, 2)}-${searchDate.substr(2, 2)}-${searchDate.substr(4, 2)}`;
      filter = {
        filter: {
          property: 'created_time.start.on_or_after',
          date: {
            start: formattedDate,
          },
        },
      };
    } else {
      // 다른 검색 타입이 주어진 경우, Task 검색으로 처리
      filter = {
        filter: {
          property: 'Task',
          text: {
            contains: searchTerm,
          },
        },
      };
    }
  } else {
    // 이외의 경우, Task 검색으로 처리
    filter = {
      filter: {
        property: 'Task',
        text: {
          contains: searchTerms,
        },
      },
    };
  }
  return filter;
}

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Slack 커맨드 처리
app.post('/task_search', async (req, res) => {
  const searchQuery = req.body.text; // 슬랙 커맨드에서 입력 받은 검색 텍스트

  try {
    // Notion API를 호출하여 검색 수행
    const notionResponse = await searchInNotion(searchQuery);

    // Slack에 응답 보내기
    const slackResponse = {
      response_type: 'in_channel', // 'in_channel' 또는 'ephemeral' (비공개 응답) 설정 가능
      text: '검색 결과:',
      attachments: notionResponse, // 검색 결과를 attachments에 추가
    };
    res.json(slackResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send('오류가 발생했습니다.');
  }
});

app.post('/doc_search', async (req, res) => {
  const searchQuery = req.body.text; // 슬랙 커맨드에서 입력 받은 검색 텍스트

  try {
    // Notion API를 호출하여 검색 수행
    const notionResponse = await searchInNotionDoc(searchQuery);

    // Slack에 응답 보내기
    const slackResponse = {
      response_type: 'in_channel', // 'in_channel' 또는 'ephemeral' (비공개 응답) 설정 가능
      text: '검색 결과:',
      attachments: notionResponse, // 검색 결과를 attachments에 추가
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

  const generateSearchQuerys = generateSearchQuery(query);

  const requestBody = {
    filter: {
      property: 'Task',
      text: {
        contains: query,
      }
    },
  };

  try {
    const response = await axios.post(notionApiUrl, requestBody, { headers });
    const results = response.data.results;
    
    if (results.length > 0) {
      // 검색 결과 처리
      const formattedResults = results.map((item) => {
        const title = item.properties.Task.title[0].plain_text;
        const url = item.url; // Notion 문서의 URL
        const createdBy = item.properties['생성자'].created_by.name;
        const status = item.properties['상태'].status.name;
        const taskID = item.properties['Task-id'].unique_id.prefix + "-" + item.properties['Task-id'].unique_id.number;
        const createdTime = formatDateFromNotion(item.properties['생성 일시'].created_time);

        return {
          title: title,
          title_link: url,
          fields: [
            { title: '생성자', value: createdBy, short: true },
            { title: '상태', value: status, short: true },
            { title: 'Task ID', value: taskID, short: true },
            { title: '생성 일시', value: createdTime, short: true }
          ],
        };
      });
      
      return formattedResults;
    } else {
      return [{ text: '검색 결과 없음' }];
    }
  } catch (error) {
    throw error;
  }
}

async function searchInNotionDoc(query) {
  const NOTION_API_KEY = process.env.NOTION_API_KEY; // Notion API 토큰
  
  const notionApiUrl = `https://api.notion.com/v1/search`;
  const headers = {
    'Authorization': `Bearer ${NOTION_API_KEY}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2021-05-13', // Notion API 버전 설정
  };
  
  const searchParams = {
    query: query,
    filter: {
      value: 'page',
      property: 'object'
    },
    sort: {
      direction: 'ascending',
      timestamp: 'last_edited_time'
    }
  };

  try {
    const response = await axios.post(notionApiUrl, searchParams, { headers });
    const results = response.data.results;
    if (results.length > 0) {
      // 검색 결과 처리
      const formattedResults = results.map((item) => {
        let title;
        const createdTime = formatDateFromNotion(item.created_time);
        const url = item.url; // Notion 문서의 URL
        if(item.properties.Task != null) {
          if(item.properties.Task.title.length > 0) {
            // title = item.properties.Task.title[0].plain_text || null;
            // return {
            //   title: title,
            //   title_link: url,
            //   fields: [
            //     { title: '생성 일시', value: createdTime, short: true }
            //   ],
            // };
          }
        } else {
          if(item.properties.title.title.length > 0) {
            title = item.properties.title.title[0].plain_text || null;
            return {
              title: title,
              title_link: url,
              fields: [
                { title: '생성 일시', value: createdTime, short: true }
              ],
            };
          }
        }
      });
      
      
      return formattedResults;
    } else {
      return [{ text: '검색 결과 없음' }];
    }
  } catch (error) {
    throw error;
  }
}

app.listen(port, () => {
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
});