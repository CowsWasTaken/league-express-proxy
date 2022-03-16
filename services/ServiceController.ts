import {SummonerDTO} from "../models/DTOs/SummonerDTO";
import {DataStoreService} from "./DataStoreService";
import {LeagueApiService} from "./LeagueApiService";
import {RegionalHostValue} from "../constants/RegionalHostValue";
import {LeagueHttpError} from "../exception/errors/LeagueHttpError";
import {MatchDTO} from "../models/DTOs/MatchDTO";
import {Mapper} from "../models/Mapper";
import {ApiConfig} from "../config/api_config";
import {PlatformHostValue} from "../constants/PlatformHostValue";
import {MatchEntity} from "../models/Entities/MatchEntity";
import {GameModeConstants} from "../constants/GameModeConstants";

export class ServiceController {

    private static instance: ServiceController;
    private dataService = DataStoreService.getInstance()
    private leagueApiService = LeagueApiService.getInstance()

    private constructor() {
    }

    public static getInstance(): ServiceController {
        if (!ServiceController.instance) {
            ServiceController.instance = new ServiceController();
        }

        return ServiceController.instance;
    }

    async fetchAndSaveAllMatchesForSummonerName(res: any, summonername: string) {

        const summonerDTO = await this.getSummonerForName(summonername)
        await this.dataService.saveSummoner(summonerDTO)
        await this.fetchAndSaveAllMatchesForSummoner(res, summonerDTO)
    }


    async fetchAndSaveAllMatchesForSummoner(res: any, summonerDTO: SummonerDTO) {

        const matchIds = await this.leagueApiService.getAllPlayerMatchesList( summonerDTO.puuid)
        const filteredMatchIds: { existingMatches: string[], missingMatches: string[] } = await this.dataService.determineMissingGames(matchIds);
        console.log(`Existing Matches: ${filteredMatchIds.existingMatches.length} \nMissing Games ${filteredMatchIds.missingMatches.length}`) // TODO logger
        filteredMatchIds.existingMatches.forEach(match => { // links all existing matches to summoner
            this.dataService.linkSummonerToMatch(summonerDTO.puuid, match)
        })
        await this.saveMatchesForList(summonerDTO.puuid, filteredMatchIds.missingMatches)

        console.log(`All Matches for ${summonerDTO.name} has been fetched`) // TODO logger
    }

    async saveMatch(puuid: string, matchId: string): Promise<any> {

        const matchDTO = await this.leagueApiService.getMatch(RegionalHostValue.EUROPE, matchId).catch((err: LeagueHttpError) => {
            if (err.status == 429)
                return Promise.reject(err)
        }) as MatchDTO

        const matchEntity = Mapper.matchDTOToEntity(matchDTO)
        return this.dataService.saveFullMatch(puuid, matchEntity);
    }

    async saveMatchesForList(puuid: string, matchIds: string[]) {
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

    async getMatchesForPuuid(puuid: string) {
        return this.dataService.getMatchesForPuuid(puuid)
    }

    async getSummonerForName(summonername: string, platformHost?: PlatformHostValue) {
        if (platformHost) {
            return this.leagueApiService.getPlayerPUUID(platformHost, summonername).catch(err => {
                return Promise.reject(err)
            })
        } else {
            return this.leagueApiService.getPlayerPUUID(PlatformHostValue.getDefault(), summonername).catch(err => {
                console.log('here')
                return Promise.reject(err)
            })
        }
    }

    async getPlaytimeForSummoner(summonername: string, gameMode?: string): Promise<any> {
        const summonerDTO = await this.getSummonerForName(summonername).catch(err => {
            return Promise.reject(err)
        })
        let matches: MatchEntity[] = []
        if (gameMode) {
            const isGameModeValid = GameModeConstants.find(element => element.gameMode === gameMode.toUpperCase())
            if (!isGameModeValid) {
                console.log(gameMode)
                return Promise.reject(`No valid Parameter to search for Game Mode, was ${gameMode}`)
            } else {
                matches = await this.dataService.getMatchesForPuuidFiltered(summonerDTO.puuid, gameMode);
            }
        } else {
            matches = await this.dataService.getMatchesForPuuid(summonerDTO.puuid);
        }

        return DataStoreService.getPlaytimeForMatches(matches)
    }


    delay = (ms: number) => new Promise(res => setTimeout(res, ms));

}