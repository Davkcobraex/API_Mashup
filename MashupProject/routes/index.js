var express = require('express');
var router = express.Router();
const axios = require('axios');
const logger = require('morgan');
router.use(logger('tiny'));
const updateJsonToS3 = require("./update");

router.get('/', async (req, res) => {
  const counter = await updateJsonToS3();
  res.render('index', { counter });
});

const clientId = process.env.CLIENT;
const clientSecret = process.env.SECRET;
const tokenUrl = 'https://id.twitch.tv/oauth2/token';


async function getAccessToken() {
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const headers = {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,

  };

  try {
    const response = await axios.post(tokenUrl, headers);
    return response.data.access_token;
  } catch (error) {
    console.error('Error obtaining access token:', error);
    throw error;
  }
}

router.get("/search", async function (req, res) {
  
  const { query } = req.query;
  const counter = await updateJsonToS3();
  var gamesData;
  try {
    const accessToken = await getAccessToken();
    const apiUrl = 'https://api.igdb.com/v4/games/';
    const apiHeaders = {
      'Client-ID': clientId,
      'Authorization': `Bearer ${accessToken}`
    };
    const requestBody = `search "${query}"; fields name, similar_games;`  
    requestJson = await axios.post(apiUrl, requestBody, { headers: apiHeaders })
      .then((response) => {
        gamesData = response.data;
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  } catch (error) {
      console.error('Error making authenticated request:', error);
  } 
  console.log(gamesData)
  console.log(counter)
  res.render('index', { counter, gamesData });  
});


module.exports = router;