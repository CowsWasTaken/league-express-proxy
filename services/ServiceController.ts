import {SummonerDTO} from '../models/DTOs/SummonerDTO';
import {DataStoreService} from '../database/DataStoreService';
import {LeagueApiService} from './LeagueApiService';
import {RegionalHostValue} from '../constants/RegionalHostValue';
import {LeagueHttpError} from '../exception/errors/RateLimitError';
import {MatchDTO} from '../models/DTOs/MatchDTO';
import {Mapper} from '../models/Mapper';
import {ApiConfig} from '../config/api_config';
import {PlatformHostValue} from '../constants/PlatformHostValue';
import {MatchEntity} from '../models/Entities/MatchEntity';
import {GameModeConstants} from '../constants/GameModeConstants';
import {GameMode} from '../models/GameMode';
import {MatchesSummary} from '../models/MatchesSummary';
import {FilteredMatches} from '../models/FilteredMatches';

export class ServiceController {

    private static instance: ServiceController;
    private dataService = DataStoreService.getInstance();
    private leagueApiService = LeagueApiService.getInstance();

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {
    }

    /*
        singleton pattern
    */
    public static getInstance(): ServiceController {
        if (!ServiceController.instance) {
            ServiceController.instance = new ServiceController();
        }

        return ServiceController.instance;
    }

    /**
     *
     * @param summonerDTO
     * @param filteredMatches
     */
    async fetchAndSaveForFilteredMatchesSummoner(summonerDTO: SummonerDTO, filteredMatches: FilteredMatches) {
        await this.dataService.saveSummoner(summonerDTO);
        await this.fetchAndSaveForFilteredMatches( summonerDTO.puuid, filteredMatches);
    }

    async getFilteredMatchesForPuuid(puuid: string): Promise<FilteredMatches> {
        const matchIds = await this.leagueApiService.getAllPlayerMatchesList(puuid);
        return this.dataService.determineMissingGames(matchIds);
    }

    /**
     *
     * @param puuid
     * @param filteredMatches
     */
    async fetchAndSaveForFilteredMatches(puuid: string, filteredMatches: FilteredMatches) {

        filteredMatches.existingMatches.forEach(match => { // links all existing matches to summoner
            this.dataService.linkSummonerToMatch(puuid, match);
        });
        await this.saveMatchesForList(puuid, filteredMatches.missingMatches);
        console.log(`All Matches for Puuid: ${puuid} has been fetched`); // TODO logger
    }

    /**
     *
     * @param puuid to link summoner to match
     * @param matchId matchId for game which is being fetched and stored
     * @returns Promise if everything went fine
     */
    async saveMatch(puuid: string, matchId: string): Promise<any> {

        const matchDTO = await this.leagueApiService.getMatch(RegionalHostValue.EUROPE, matchId).catch((err: LeagueHttpError) => {
            if (err.status == 429)
                return Promise.reject(err);
        }) as MatchDTO;

        const matchEntity = Mapper.matchDTOToEntity(matchDTO);
        return this.dataService.saveFullMatch(puuid, matchEntity);
    }

    /**
     *
     * @param puuid summoner puuid
     * @param matchIds matchids to fetch, store and link to summoner
     */
    async saveMatchesForList(puuid: string, matchIds: string[]) {
        const arr: string[] = []; // list with matchIds witch have been resolved and saved
        const rejected: string[] = [];

        let isTooManyRequests = false;
        let retryAfter = ApiConfig.defaultTimeoutTime;

        for (let i = 0; (i < matchIds.length) && (!isTooManyRequests); i++) {
            const matchId = matchIds[i];

            await this.saveMatch(puuid, matchId)
                .then(() => arr.push(matchId))
                .catch((err: LeagueHttpError) => {
                    if (err.status === 429) {
                        console.log(`429 Too Many Requests, Match ${matchId}`);
                        // rejected.push(matchId)
                        retryAfter = err.retryAfter!;
                        const arr = matchIds.slice(i, matchIds.length);
                        rejected.push(...arr);
                        isTooManyRequests = true;
                    } else {
                        console.log(`Match ${matchId} cannot be resolved`);
                        console.log(err);
                    }
                });
        }
        // await Promise.all(arr) is useless at this point because all saveMatch functions are awaited
        if (rejected.length > 0) {
            console.log(`Timeout for ${retryAfter} seconds`);
            await this.delay(retryAfter * 1000); // for ms
            await this.saveMatchesForList(puuid, rejected);
        }


        //TODO implement if the api call is rejected, retry after specific time
    }

    /**
     *
     * @param puuid
     * @returns list of matchentities found in database for puuid
     */
    async getMatchesForPuuid(puuid: string) {
        return this.dataService.getMatchesForPuuid(puuid);
    }

    /**
     *
     * @param summonername name of summoner
     * @param platformHost region summoner plays in EUW, NA, etc
     * @returns summoner DTO
     */
    async getSummonerForName(summonername: string, platformHost?: PlatformHostValue): Promise<SummonerDTO> {
        platformHost = platformHost ?? PlatformHostValue.getDefault();
        return this.leagueApiService.getPlayerPUUID(platformHost, summonername).catch(err => {
            return Promise.reject(err);
        });
    }

    /**
     *
     * @param summonername name of summoner
     * @param gameMode optional gamemode to get playtime form ARAM, CLASSIC, TUTORIAL, etc
     * @returns playtime in seconds
     */
    async getPlaytimeForSummoner(summonername: string, gameMode?: string): Promise<any> {
        const summonerDTO = await this.getSummonerForName(summonername).catch(err => {
            return Promise.reject(err);
        });
        let matches: MatchEntity[] = [];
        if (gameMode) {
            const isGameModeValid = GameModeConstants.find(element => element.gameMode === gameMode.toUpperCase());
            if (!isGameModeValid) {
                return Promise.reject(`No valid Parameter to search for Game Mode, was ${gameMode}`);
            } else {
                matches = await this.dataService.getMatchesForPuuidFiltered(summonerDTO.puuid, gameMode);
            }
        } else {
            matches = await this.dataService.getMatchesForPuuid(summonerDTO.puuid);
        }

        return DataStoreService.getPlaytimeForMatches(matches);
    }

    async getMatchesSummary(summonername: string, gameMode?: GameMode, platformHostValue?: PlatformHostValue) {
        const summoner = await this.getSummonerForName(summonername);
        const matches = gameMode ? await this.dataService.getMatchesForPuuidFiltered(summoner.puuid, gameMode.gameMode) : await this.getMatchesForSummonerName(summonername, platformHostValue);
        return {
            gameMode, matchesCount: matches.length, playtime: DataStoreService.getPlaytimeForMatches(matches)
        } as MatchesSummary;
    }

    async getMatchesForSummonerName(summonername: string, platformHostValue?: PlatformHostValue) {
        const summoner: SummonerDTO = await this.getSummonerForName(summonername, platformHostValue);
        return await this.getMatchesForPuuid(summoner.puuid);
    }


    /**
     *
     * @param ms delay in milliseconds
     * @returns Promise with given delay
     */
    delay = (ms: number) => new Promise(res => setTimeout(res, ms));

}