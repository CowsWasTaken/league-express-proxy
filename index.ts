import axios from "axios";
import express from 'express';
import cors from 'cors'
import {credentials} from "./config/credentials";
import {PlatformHostValue} from "./constants/PlatformHostValue";
import {RegionalHostValue} from "./constants/RegionalHostValue";
import {SummonerDTO} from "./models/SummonerDTO";
import {MatchQueryParameter, objectToQueryString} from "./models/MatchQueryParameter";


const app = express();

app.use(cors())

const protocol = 'https'

const api_key = credentials.apiKey

const api_query = `api_key=${api_key}`


async function getPlayerPUUID(platformHost: PlatformHostValue, summonerName: string): Promise<SummonerDTO> {
    return axios.get(`${createBaseUrl(platformHost)}/lol/summoner/v4/summoners/by-name/${summonerName}?${api_query}`)
        .then(response => {
            console.log(`Fetched PUUID: ${response.data.puuid}`)
            return response.data as SummonerDTO
        }).catch(err => err);
}

function createBaseUrl(hostValue: PlatformHostValue | RegionalHostValue): string {
    return `${protocol}://${hostValue}`
}

async function getPlayerMatches(regionalHostValue: RegionalHostValue, puuid: string , matchQueryParameter: MatchQueryParameter) : Promise<any> {
    const queryString = objectToQueryString(matchQueryParameter)
    return axios.get(`${createBaseUrl(regionalHostValue)}/lol/match/v5/matches/by-puuid/${puuid}/ids?${api_query}`)
        .then(response => {
            console.log(`Fetched Player Matches for: ${puuid}`)
            return response.data
        }).catch(err => err);
}

async function getMatch(regionalHostValue: RegionalHostValue, matchId: string): Promise<any> {
    return axios.get(`${createBaseUrl(regionalHostValue)}/lol/match/v5/matches/${matchId}?${api_query}`)
        .then(response => {
            console.log(`Fetched Match: ${matchId} `)
            return response.data
        }).catch(err => err);
}


app.get('/:summonername', async (req, res) => {
    const summonerDTO = await getPlayerPUUID(PlatformHostValue.EUW1, req.params.summonername)
    res.json(summonerDTO)
})


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
