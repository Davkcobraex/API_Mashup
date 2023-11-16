var express = require('express');
var router = express.Router({ mergeParams: true });
const axios = require('axios');
const logger = require('morgan');
router.use(logger('tiny'));
var app = express();
const updateJsonToS3 = require("./update");


const clientId = process.env.CLIENT;
const clientSecret = process.env.SECRET;
const tokenUrl = 'https://id.twitch.tv/oauth2/token';

const youtubeAPI = process.env.YT;

// Function to obtain an OAuth2 access token
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

router.get("/:id", async function (req, res) {
  var counter = await updateJsonToS3();
  const gameData = {
    gameTitle: [],
    gameDesc: [],
    cheapestPrice: [],
    cheapestDealID: [],
    storeName: [],
    storeIcon: [],
    otherStoresID: [],
    otherName: [], 
    otherPrice: [],
    otherIcons: [],
    otherDealID: [],
    ratings: [],
    youtubeID: [],
    youtubeTitle: []
  };

  var gamesID = [];
  const accessToken = await getAccessToken();
  const apiUrl = 'https://api.igdb.com/v4/games/';
  const apiHeaders = {
    'Client-ID': clientId,
    'Authorization': `Bearer ${accessToken}`
  };
  try {
    console.log(req.params.id);
    const requestBody = `where id = ${req.params.id}; fields similar_games;`  
    await axios.post(apiUrl, requestBody, { headers: apiHeaders })
      .then((response) => {
        gamesData = response.data;
        response.data.forEach((item) => {
          if (item.similar_games) {
            item.similar_games.forEach((id) => {
              gamesID.push(id)
              
            })
          }
        });        
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  } catch (error) {
      console.error('Error making authenticated request:', error);
  }
  
  for (var i = 0; i < 4; i++) {
    const requestBody = `where id = ${gamesID[i]}; fields name, summary;`;  
    await axios.post(apiUrl, requestBody, { headers: apiHeaders })
    .then((response) => {
      response.data.forEach((item) => {
        if (item.name) {
          console.log(item.name);
          gameData.gameTitle.push(item.name);
          gameData.gameDesc.push(item.summary);
        }
      });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  };
  
  var gameID = [];
  var cheapestStoreID = [];
  var SteamID = [];
  
  for (var i = 0; i < gameData.gameTitle.length; i++) {
    const response = await axios.get(`https://www.cheapshark.com/api/1.0/games?title=${gameData.gameTitle[i]}`);
    if (response.data == '') {
      console.log("API data for this is nonexistent");
      gameData.gameTitle.splice(i, 1);
      gameData.gameDesc.splice(i, 1);
      i = i - 1;
    }
    else {
      gameID.push(response.data[0].gameID);
      gameData.cheapestPrice.push('$' + response.data[0].cheapest + "USD ");
      gameData.cheapestDealID.push(response.data[0].cheapestDealID);
      SteamID.push(response.data[0].steamAppID);
    }
  };

  const others = await axios.get(`https://www.cheapshark.com/api/1.0/games?ids=${gameID.join(",")}`);
  for (var i = 0; i < gameData.gameTitle.length; i++) {
      console.log(others.data[gameID[i].toString()].deals.length)
      if (others.data[gameID[i].toString()].deals.length > 1) {
        gameData.otherStoresID.push(others.data[gameID[i].toString()].deals[1].storeID);
        console.log(others.data[gameID[i].toString()].deals[1].storeID);
        gameData.otherPrice.push('$' + others.data[gameID[i].toString()].deals[1].price + "USD ");
        gameData.otherDealID.push(others.data[gameID[i].toString()].deals[1].dealID)
        gameData.otherName.push(null);
      }
      else{
        gameData.otherName.push(null);
        gameData.otherPrice.push(null);
        gameData.otherStoresID.push(null);
        gameData.otherDealID.push(null);
      }
  }

  for (var i = 0; i < gameData.gameTitle.length; i++) {
    const response = await axios.get(`https://www.cheapshark.com/api/1.0/deals?id=${gameData.cheapestDealID[i]}`)
    cheapestStoreID.push(response.data.gameInfo.storeID);
    
    if (response.data.gameInfo.metacriticScore == 0) {
      gameData.ratings.push("Hasn't been reviewed by Metacritcs yet!");
    }
    else {
      gameData.ratings.push(`Metacritc: ${response.data.gameInfo.metacriticScore}`);
    }
  }

  const response1 = await axios.get(`https://www.cheapshark.com/api/1.0/stores`);
  for (let i = 0; i < response1.data.length; i++) {
    const object = response1.data[i];
    for (let b = 0; b < cheapestStoreID.length; b++) {
      if (cheapestStoreID[b] == object.storeID) {
        gameData.storeName[b] = `At Store: ${object.storeName}`;
        gameData.storeIcon[b] = "https://www.cheapshark.com" + object.images.logo;
        continue;
      }
      if (gameData.otherStoresID[b] == object.storeID) {
        gameData.otherName[b] = `At Store: ${object.storeName}`;
        gameData.otherIcons[b] = "https://www.cheapshark.com" + object.images.logo;
      }
    }
 
  }
    
  

  for (var i = 0; i < gameData.gameTitle.length; i++) {
    const youtube = await axios.get(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${gameData.gameTitle[i] + " Game"}%20Review&relevanceLanguage=en&key=${youtubeAPI}`)
    gameData.youtubeTitle.push(youtube.data.items[0].snippet.title);
    gameData.youtubeID.push(youtube.data.items[0].id.videoId);
    // gameData.youtubeTitle.push('Oshi no Ko - "IDOL" | ENGLISH Ver | AmaLee');
    // gameData.youtubeID.push("iN0-dRNsmRM");
  
  }
  
  console.log(gameData.otherName);
  console.log(gameData.otherPrice);
  
  const combinedData = gameData.gameTitle.map((title, index) => ({
    gameTitle: title,
    gameDesc: gameData.gameDesc[index],
    cheapestPrice: gameData.cheapestPrice[index],
    cheapestDealID: gameData.cheapestDealID[index],
    ratings: gameData.ratings[index],
    storeName: gameData.storeName[index],
    storeIcon: gameData.storeIcon[index],
    otherName: gameData.otherName[index],
    otherIcons: gameData.otherIcons[index],
    otherPrice: gameData.otherPrice[index],
    otherDealID: gameData.otherDealID[index],
    youtubeID: gameData.youtubeID[index],
    youtubeTitle: gameData.youtubeTitle[index]

  }));    

  res.render('gameList', { counter, gameData: combinedData });  
}); 


module.exports = router;  


