const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

// Notion Integration Token
const integrationToken = process.env.NOTION_API_KEY;

// Search keyword
const searchKeyword = 'ssh';

// Notion API Endpoint
const searchEndpoint = 'https://api.notion.com/v1/search';

// Set up request headers
const headers = {
  'Authorization': `Bearer ${integrationToken}`,
  'Notion-Version': '2021-05-13',
};

// Set up search parameters
const searchParams = {
  query: searchKeyword,
};

// Send a search request to the Notion API
axios.post(searchEndpoint, searchParams, { headers })
  .then((response) => {
    if (response.status === 200) {
      const results = response.data.results;
      results.forEach((result) => {
        console.log(result);
        console.log(result.properties.title.title[0].plain_text);
      });
    } else {
      console.error(`Search failed. Status code: ${response.status}`);
    }
  })
  .catch((error) => {
    console.error('An error occurred:', error);
  });
