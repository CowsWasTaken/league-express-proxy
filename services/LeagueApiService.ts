import {PlatformHostValue} from "../constants/PlatformHostValue";
import {SummonerDTO} from "../models/DTOs/SummonerDTO";
import axios from "axios";
import {ExceptionHandler} from "../models/ExceptionHandler";
import {RegionalHostValue} from "../constants/RegionalHostValue";
import {credentials} from "../config/credentials";
import {MatchQueryParameter, objectToQueryString} from "../models/MatchQueryParameter";
import {MatchDTO} from "../models/DTOs/MatchDTO";
import {LeagueHttpError} from "../models/LeagueHttpError";
import {MatchEntity} from "../models/Entities/MatchEntity";
import {QUERY_PARAMS} from "../config/QUERY_PARAMS";
import {ApiConfig} from "../config/api_config";
import {Mapper} from "../models/Mapper";
import {DataStoreService} from "./DataStoreService";

export class LeagueApiService {
    api_key = credentials.apiKey
    protocol = 'https'
    api_query = `api_key=${this.api_key}`

    dataService = new DataStoreService()



    async determineMissingGames(matchIds: string[]): Promise<{ existingMatches: string[], missingMatches: string[] }> {
        const existingMatches: string[] = (await this.dataService.getExistingMatches(matchIds) as { matchId: string }[]).map(res => res.matchId)// gets all matches existing already from database for list
        for (let i = 0; i < existingMatches.length; i++) {
            let index = matchIds.findIndex(matchId => matchId === existingMatches[i]); // find index in list
            if (index !== -1) { // index returns -1 if no element was found
                matchIds.splice(index, 1); //remove element from array
            }
        }
        return {existingMatches: existingMatches, missingMatches: matchIds}
    }

    private createBaseUrl(hostValue: PlatformHostValue | RegionalHostValue): string {
        return `${this.protocol}://${hostValue}`
    }

    async getPlayerPUUID(res: any, platformHost: PlatformHostValue, summonerName: string): Promise<SummonerDTO> {
        return axios.get(`${this.createBaseUrl(platformHost)}/lol/summoner/v4/summoners/by-name/${summonerName}?${this.api_query}`)
            .then(response => {
                console.log(`Fetched PUUID: ${response.data.puuid}`)
                return response.data as SummonerDTO
            }).catch(err => ExceptionHandler.handleException(err, res));
    }

    async  getPlayerMatches(res: any, regionalHostValue: RegionalHostValue, puuid: string, matchQueryParameter?: MatchQueryParameter): Promise<string[]> {
        let playerMatches_API_CALL = `${this.createBaseUrl(regionalHostValue)}/lol/match/v5/matches/by-puuid/${puuid}/ids?${this.api_query}` // creates api call
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

    async  getMatch(regionalHostValue: RegionalHostValue, matchId: string): Promise<MatchDTO> {
        return axios.get(`${this.createBaseUrl(regionalHostValue)}/lol/match/v5/matches/${matchId}?${this.api_query}`)
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
    returns playtime in seconds for matches
 */
     getPlaytimeForMatches(matches: MatchEntity[], gameMode?: string) {
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

    delay = (ms: number) => new Promise(res => setTimeout(res, ms));


    /*
    saves all
 */
    async  fetchAndSaveAllMatchesForSummoner(res: any, summonerDTO: SummonerDTO) {

        const matchIds = await this.getAllPlayerMatchesList(res, summonerDTO.puuid)
        const filteredMatchIds: { existingMatches: string[], missingMatches: string[] } = await this.determineMissingGames(matchIds);
        console.log(`Existing Matches: ${filteredMatchIds.existingMatches.length} \nMissing Games ${filteredMatchIds.missingMatches.length}`)
        filteredMatchIds.existingMatches.forEach(match => { // links all existing matches to summoner
            this.dataService.linkSummonerToMatch(summonerDTO.puuid, match)
        })
        await this.saveMatchesForList(summonerDTO.puuid, filteredMatchIds.missingMatches)

        console.log(`All Matches for ${summonerDTO.name} has been fetched`)
    }

    async  getAllPlayerMatchesList(res: any, puuid: string) {
        let isFetchedMatchesGreaterMaxCount = true
        let matches: string[] = []
        for (let i = 0; isFetchedMatchesGreaterMaxCount; i++) {
            const start = i * QUERY_PARAMS.MAX_COUNT
            const matchQueryParameter: MatchQueryParameter = {count: QUERY_PARAMS.MAX_COUNT, start}
            const matchIds: string[] = await this.getPlayerMatches(res, RegionalHostValue.EUROPE, puuid, matchQueryParameter)
            if (QUERY_PARAMS.MAX_COUNT > matchIds.length) {
                isFetchedMatchesGreaterMaxCount = false
            }
            matchIds.push.apply(matches, matchIds) // pushes list to another list
        }
        console.log(`Number of matches${matches.length}`)
        return matches;
    }

    async  saveMatchesForList(puuid: string, matchIds: string[]) {
        let arr: string[] = [] // list with matchIds witch have been resolved and saved
        let rejected: string[] = []

        let isTooManyRequests = false
        let retryAfter = ApiConfig.timeoutTime

        for (let i = 0; (i < matchIds.length) && (!isTooManyRequests); i++) {
            let matchId = matchIds[i]

            await this.saveMatch(puuid, matchId)
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
            await this.delay(retryAfter * 1000) // for ms
            await this.saveMatchesForList(puuid, rejected)
        }


        //TODO implement if the api call is rejected, retry after specific time
    }

    async saveMatch(puuid: string, matchId: string): Promise<any> {

        const matchDTO = await this.getMatch(RegionalHostValue.EUROPE, matchId).catch((err: LeagueHttpError) => {
            if (err.status == 429)
                return Promise.reject(err)
        }) as MatchDTO

        const matchEntity = Mapper.matchDTOToEntity(matchDTO)
        return this.dataService.saveFullMatch(puuid, matchEntity);
    }
}