import axios from "axios";
import express from 'express';
import cors from 'cors'
import {credentials} from "./config/credentials";


const app = express();

app.use(cors())

const api_key = credentials.apiKey

function getPlayerUUID(playerName: string) {
    return axios.get('https://na1.api.riotgames.com' + '/lol/summoner/v4/summoners/by-name/' + playerName + "?api_key=" + api_key)
        .then(response => {
            console.log("UUID Fetched")
            console.log(response.data)
            return response.data.puuid
        }).catch(err => err);
}

app.get('/past5Games/:playerName', async (req, res) => {
    const playerName = req.params.playerName
    const PUUID = await getPlayerUUID(playerName)
    const API_CALL = "https://americas.api.riotgames.com" + "/lol/match/v5/matches/by-puuid/" + PUUID + "/ids" + "?api_key=" + api_key

    const gameIDs = await axios.get(API_CALL)
        .then(response => response.data)
        .catch(err => err)
    console.log(gameIDs)

    let matchDataArray = []
    for (let i = 0; i < gameIDs.length - 15; i++) {
        const matchId = gameIDs[i];
        const matchData = await axios.get("https://americas.api.riotgames.com" + "/lol/match/v5/matches/" + matchId + "?api_key=" + api_key)
            .then(response => response.data)
            .catch(err => err)
        matchDataArray.push(matchData)
    }

    res.json(matchDataArray)
})

app.listen(4000, function () {
    console.log("Server started on localhost 4000")
}) // localhost:4000
