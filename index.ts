import axios from "axios";
import express from 'express';
import cors from 'cors'
import {credentials} from "./config/credentials";
import {PlatformHostValue} from "./constants/PlatformHostValue";
import {RegionalHostValue} from "./constants/RegionalHostValue";
import {SummonerDTO} from "./models/DTOs/SummonerDTO";
import {MatchQueryParameter, objectToQueryString} from "./models/MatchQueryParameter";
import {DataStoreService} from "./services/DataStoreService";
import {Mapper} from "./models/Mapper";


const app = express();

app.use(cors())

const protocol = 'https'

const api_key = credentials.apiKey

const api_query = `api_key=${api_key}`

const dataService = new DataStoreService()


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


async function getPlayerMatches(regionalHostValue: RegionalHostValue, puuid: string, matchQueryParameter: MatchQueryParameter): Promise<string[]> {
    const queryString = objectToQueryString(matchQueryParameter)
    let API_CALL = `${createBaseUrl(regionalHostValue)}/lol/match/v5/matches/by-puuid/${puuid}/ids?${api_query}`
    if (queryString.length > 0) {
        API_CALL = `${API_CALL}&${queryString}`
    }
    return axios.get(API_CALL)
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

app.get('/matches/:summonername', async (req, res) => {
    // const body = req.body as MatchQueryParameter
    const body: MatchQueryParameter = {count: 100}
    const summonerDTO = await getPlayerPUUID(PlatformHostValue.EUW1, req.params.summonername)
    const matchIds: string[] = await getPlayerMatches(RegionalHostValue.EUROPE, summonerDTO.puuid, body)
    res.json(matchIds)

    await saveMatches(matchIds)
})

async function saveMatches(matchIds: string[]) {
    let arr: Promise<any>[] = []

    for (let i = 0; i < matchIds.length; i++) {
        const matchDTO = await getMatch(RegionalHostValue.EUROPE, matchIds[i])
        const matchEntity = Mapper.matchDTOToEntity(matchDTO)
        const promise = dataService.saveMatch('', matchEntity)
        arr.push(promise)
    }
    await Promise.all(arr)

    //TODO implement if the api call is rejected, retry after specific time
}


app.get('/:summonername', async (req, res) => {
    const summonerDTO = await getPlayerPUUID(PlatformHostValue.EUW1, req.params.summonername)
    res.json(summonerDTO)
})


app.listen(4000, function () {
    console.log("Server started on localhost 4000")
}) // localhost:4000