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
import {ApiConfig} from "./config/api_config";
import {QUERY_PARAMS} from "./config/QUERY_PARAMS";
import {MatchEntity} from "./models/Entities/MatchEntity";
import {LeagueHttpError} from "./models/LeagueHttpError";
import {MatchDTO} from "./models/DTOs/MatchDTO";
import {GameModeConstants} from "./constants/GameModeConstants";
import {ExceptionHandler} from "./models/ExceptionHandler";


const app = express();

app.use(cors())

const protocol = 'https'

const api_key = credentials.apiKey

const api_query = `api_key=${api_key}`

const dataService = new DataStoreService()


async function getPlayerPUUID(res: any, platformHost: PlatformHostValue, summonerName: string): Promise<SummonerDTO> {
    return axios.get(`${createBaseUrl(platformHost)}/lol/summoner/v4/summoners/by-name/${summonerName}?${api_query}`)
        .then(response => {
            console.log(`Fetched PUUID: ${response.data.puuid}`)
            return response.data as SummonerDTO
        }).catch(err => ExceptionHandler.handleException(err, res));
}

function createBaseUrl(hostValue: PlatformHostValue | RegionalHostValue): string {
    return `${protocol}://${hostValue}`
}

async function determineMissingGames(matchIds: string[]): Promise<{ existingMatches: string[], missingMatches: string[] }> {
    const existingMatches: string[] = (await dataService.getExistingMatches(matchIds) as { matchId: string }[]).map(res => res.matchId)// gets all matches existing already from database for list
    for (let i = 0; i < existingMatches.length; i++) {
        let index = matchIds.findIndex(matchId => matchId === existingMatches[i]); // find index in list
        if (index !== -1) { // index returns -1 if no element was found
            matchIds.splice(index, 1); //remove element from array
        }
    }
    return {existingMatches: existingMatches, missingMatches: matchIds}
}


async function getPlayerMatches(res: any, regionalHostValue: RegionalHostValue, puuid: string, matchQueryParameter?: MatchQueryParameter): Promise<string[]> {
    let playerMatches_API_CALL = `${createBaseUrl(regionalHostValue)}/lol/match/v5/matches/by-puuid/${puuid}/ids?${api_query}` // creates api call
    if (matchQueryParameter) { // adds querystring to api call if exists
        const queryString = objectToQueryString(matchQueryParameter)
        playerMatches_API_CALL = `${playerMatches_API_CALL}&${queryString}`
    }
    return axios.get(playerMatches_API_CALL)
        .then(response => {
            console.log(`Fetched Player Matches for Puuid: ${puuid}`)
            return response.data
        }).catch(err => err);
}


async function getMatch(regionalHostValue: RegionalHostValue, matchId: string): Promise<MatchDTO> {
    return axios.get(`${createBaseUrl(regionalHostValue)}/lol/match/v5/matches/${matchId}?${api_query}`)
        .then(response => {
            console.log(`Fetched Match: ${matchId} `)
            return response.data as MatchDTO
        }).catch(err => {
            const headers = err.response.headers
            const retryAfter: number = +headers['retry-after']
            const httpError: LeagueHttpError = {description: 'Too Many Requests', status: 429, retryAfter}
            return Promise.reject(httpError)
        });
}

/*
    is to fetch all games from summoner to database
 */
app.get('/matches/:summonername/execute', async (req, res) => {
    // const body = req.body as MatchQueryParameter
    const summonerDTO = await getPlayerPUUID(res, PlatformHostValue.EUW1, req.params.summonername)
    await dataService.saveSummoner(summonerDTO)

    res.json('Matches get fetched from League Api, this can take up to 10 min')
    await fetchAndSaveAllMatchesForSummoner(res, summonerDTO)

})

app.get('/matches/:summonername/detailed', async (req, res) => {
    const summonerDTO = await getPlayerPUUID(res, PlatformHostValue.EUW1, req.params.summonername)
    const list: MatchEntity[] = await dataService.getMatchesForSummoner(summonerDTO.puuid);
    res.json(list)
})

app.get('/test/:summonername', async (req, res) => {
    const summonerDTO = await getPlayerPUUID(res, PlatformHostValue.EUW1, req.params.summonername)
    res.json(summonerDTO)
})

/*
    returns stats for aram,
 */
app.get('/matches/:summonername', async (req, res) => {

    const gameMode: string | undefined = req.query.gameMode as string | undefined;
    const summonerDTO = await getPlayerPUUID(res, PlatformHostValue.EUW1, req.params.summonername)
    let matches: MatchEntity[] = []
    if (gameMode) {
        const isGameModeValid = GameModeConstants.find(element => element.gameMode === gameMode.toUpperCase())
        if (!isGameModeValid) {
            console.log(gameMode)
            res.json(`No valid Parameter to search for Game Mode, was ${gameMode}`)
            return
        } else {
            matches = await dataService.getMatchesForSummonerFiltered(summonerDTO.puuid, gameMode);
        }
    } else {
        matches = await dataService.getMatchesForSummoner(summonerDTO.puuid);
    }

    // const body = req.body as MatchQueryParameter
    const playtime = getPlaytimeForMatches(matches)

    res.json(`${gameMode ?? 'TOTAL'} playtime is ${(playtime / 3600).toFixed(2)} h`)

})

/*
    returns playtime in seconds for matches
 */
function getPlaytimeForMatches(matches: MatchEntity[], gameMode?: string) {
    let playtime = 0;
    for (let i = 0; i < matches.length; i++) {
        const game = matches[i]
        if (gameMode) {
            if (game.gameMode !== gameMode) {
                continue
            }
        }
        /*
        Prior to patch 11.20, this field returns the game length in milliseconds calculated from gameEndTimestamp - gameStartTimestamp. Post patch 11.20, this field returns the max timePlayed of any participant in the game in seconds, which makes the behavior of this field consistent with that of match-v4. The best way to handling the change in this field is to treat the value as milliseconds if the gameEndTimestamp field isn't in the response and to treat the value as seconds if gameEndTimestamp is in the response.
         */
        if (!game.gameEndTimestamp) {
            playtime += (game.gameDuration / 1000)
        } else {
            playtime = playtime + matches[i].gameDuration
        }
    }
    return playtime
}

// creates a delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


/*
    saves all
 */
async function fetchAndSaveAllMatchesForSummoner(res: any, summonerDTO: SummonerDTO) {

    const matchIds = await getAllPlayerMatchesList(res, summonerDTO.puuid)
    const filteredMatchIds: { existingMatches: string[], missingMatches: string[] } = await determineMissingGames(matchIds);
    console.log(`Existing Matches: ${filteredMatchIds.existingMatches.length} \nMissing Games ${filteredMatchIds.missingMatches.length}`)
    filteredMatchIds.existingMatches.forEach(match => { // links all existing matches to summoner
        dataService.linkSummonerToMatch(summonerDTO.puuid, match)
    })
    await saveMatchesForList(summonerDTO.puuid, filteredMatchIds.missingMatches)

    console.log(`All Matches for ${summonerDTO.name} has been fetched`)
}

async function getAllPlayerMatchesList(res: any, puuid: string) {
    let isFetchedMatchesGreaterMaxCount = true
    let matches: string[] = []
    for (let i = 0; isFetchedMatchesGreaterMaxCount; i++) {
        const start = i * QUERY_PARAMS.MAX_COUNT
        const matchQueryParameter: MatchQueryParameter = {count: QUERY_PARAMS.MAX_COUNT, start}
        const matchIds: string[] = await getPlayerMatches(res, RegionalHostValue.EUROPE, puuid, matchQueryParameter)
        if (QUERY_PARAMS.MAX_COUNT > matchIds.length) {
            isFetchedMatchesGreaterMaxCount = false
        }
        matchIds.push.apply(matches, matchIds) // pushes list to another list
    }
    console.log(`Number of matches${matches.length}`)
    return matches;
}

async function saveMatchesForList(puuid: string, matchIds: string[]) {
    let arr: string[] = [] // list with matchIds witch have been resolved and saved
    let rejected: string[] = []

    let isTooManyRequests = false
    let retryAfter = ApiConfig.timeoutTime

    for (let i = 0; (i < matchIds.length) && (!isTooManyRequests); i++) {
        let matchId = matchIds[i]

        await saveMatch(puuid, matchId)
            .then(() => arr.push(matchId))
            .catch((err: LeagueHttpError) => {
                if (err.status === 429) {
                    console.log(`429 Too Many Requests, Match ${matchId}`)
                    // rejected.push(matchId)
                    retryAfter = err.retryAfter!
                    const arr = matchIds.slice(i, matchIds.length)
                    rejected.push(...arr)
                    isTooManyRequests = true
                } else {
                    console.log(`Match ${matchId} cannot be resolved`)
                    console.log(err)
                }
            });
    }
    // await Promise.all(arr) is useless at this point because all saveMatch functions are awaited
    if (rejected.length > 0) {
        console.log(`Timeout for ${retryAfter} seconds`)
        await delay(retryAfter * 1000) // for ms
        await saveMatchesForList(puuid, rejected)
    }


    //TODO implement if the api call is rejected, retry after specific time
}

async function saveMatch(puuid: string, matchId: string): Promise<any> {

    const matchDTO = await getMatch(RegionalHostValue.EUROPE, matchId).catch((err: LeagueHttpError) => {
        if (err.status == 429)
            return Promise.reject(err)
    }) as MatchDTO

    const matchEntity = Mapper.matchDTOToEntity(matchDTO)
    return dataService.saveFullMatch(puuid, matchEntity);
}

app.listen(4000, function () {
    console.log("Server started on localhost 4000")
}) // localhost:4000

