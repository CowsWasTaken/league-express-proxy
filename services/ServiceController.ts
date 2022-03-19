import {SummonerDTO} from '../models/DTOs/SummonerDTO';
import {DataStoreService} from '../database/DataStoreService';
import {LeagueApiService} from './LeagueApiService';
import {LeagueHttpError} from '../exception/errors/RateLimitError';
import {MatchDTO} from '../models/DTOs/MatchDTO';
import {MatchMapper} from '../models/Mapper/MatchMapper';
import {ApiConfig} from '../config/api_config';
import {MatchEntity} from '../models/Entities/MatchEntity';
import {GameModeConstants} from '../constants/GameConstants/GameModeConstants';
import {GameMode} from '../models/GameMode';
import {MatchesSummary} from '../models/MatchesSummary';
import {FilteredMatches} from '../models/FilteredMatches';
import {PlatformHostValue} from '../models/HostValues/PlatformHostValue';
import {RegionalHostValue} from '../models/HostValues/RegionalHostValue';

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
     * @param hostValue regional host value for getMatch api call
     * @param summonerDTO saves summoner to database
     * @param filteredMatches save, link and fetch existing/missing games to puuid
     */
    async fetchAndSaveForFilteredMatchesSummoner(hostValue : RegionalHostValue, summonerDTO: SummonerDTO, filteredMatches: FilteredMatches) {
        await this.dataService.saveSummoner(summonerDTO);
        await this.fetchAndSaveForFilteredMatches(hostValue, summonerDTO.puuid, filteredMatches);
    }

    async getFilteredMatchesForPuuid(hostValue : RegionalHostValue, puuid: string): Promise<FilteredMatches> {
        const matchIds = await this.leagueApiService.getAllPlayerMatchesList(hostValue, puuid);
        return this.dataService.determineMissingGames(matchIds);
    }

    /**
     *  links games for existing matches to puuid
     *  fetches all missing games and saves them to puuid
     *
     * @param hostValue
     * @param puuid
     * @param filteredMatches
     */
    async fetchAndSaveForFilteredMatches(hostValue : RegionalHostValue, puuid: string, filteredMatches: FilteredMatches) {

        filteredMatches.existingMatches.forEach(match => { // links all existing matches to summoner
            this.dataService.linkSummonerToMatch(puuid, match);
        });
        await this.saveMatchesForList(hostValue, puuid, filteredMatches.missingMatches);
        console.log(`All Matches for Puuid: ${puuid} has been fetched`); // TODO logger
    }

    /**
     *
     * @param hostValue Regional Host Value because match API is called, not working with platform host value
     * @param puuid to link summoner to match
     * @param matchId matchId for game which is being fetched and stored
     * @returns Promise if everything went fine
     */
    async fetchAndSaveFullMatch(hostValue : RegionalHostValue, puuid: string, matchId: string): Promise<any> {

        const matchDTO = await this.leagueApiService.getMatch(hostValue, matchId).catch((err: LeagueHttpError) => {
            if (err.status == 429)
                return Promise.reject(err);
        }) as MatchDTO;

        const matchEntity = MatchMapper.toEntity(matchDTO);
        return this.dataService.saveFullMatch(puuid, matchEntity);
    }

    /**
     *
     * @param hostValue Regional Host Value because match API is called, not working with platform host value
     * @param puuid summoner puuid has to exist as tupel in database
     * @param matchIds matchids to fetch, store and link to puuid
     */
    async saveMatchesForList(hostValue : RegionalHostValue, puuid: string, matchIds: string[]) {
        const arr: string[] = []; // list with matchIds witch have been resolved and saved
        const rejected: string[] = [];

        let isTooManyRequests = false;
        let retryAfter = ApiConfig.defaultTimeoutTime;

        for (let i = 0; (i < matchIds.length) && (!isTooManyRequests); i++) {
            const matchId = matchIds[i];

            await this.fetchAndSaveFullMatch( hostValue, puuid, matchId)
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
            await this.saveMatchesForList(hostValue, puuid, rejected);
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
     * @param hostValue from league api the host value should be the platform routing value https://developer.riotgames.com/docs/lol#_routing-values
     * @returns summoner DTO
     */
    async getSummonerForName(summonername: string, hostValue: PlatformHostValue): Promise<SummonerDTO> {
        return this.leagueApiService.getPlayerPUUID(hostValue, summonername).catch(err => {
            return Promise.reject(err);
        });
    }

    /**
     *
     * @param summonername name of summoner
     * @param hostValue
     * @param gameMode optional gamemode to get playtime form ARAM, CLASSIC, TUTORIAL, etc
     * @returns playtime in seconds
     */
    async getPlaytimeForSummoner(summonername: string, hostValue: PlatformHostValue, gameMode?: string): Promise<any> {
        const summonerDTO = await this.getSummonerForName(summonername, hostValue).catch(err => {
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

    /**
     *
     * @param summonername
     * @param hostValue hostValue from league api the host value should be the platform routing value https://developer.riotgames.com/docs/lol#_routing-values
     * @param gameMode
     */
    async getMatchesSummary(summonername: string, hostValue: PlatformHostValue, gameMode?: GameMode) {
        const summoner = await this.getSummonerForName(summonername, hostValue);
        const matches = gameMode ? await this.dataService.getMatchesForPuuidFiltered(summoner.puuid, gameMode.gameMode) : await this.getMatchesForPuuid(summoner.puuid);
        const playtime = Math.round(DataStoreService.getPlaytimeForMatches(matches));
        return {
            gameMode, matchesCount: matches.length, playtime
        } as MatchesSummary;
    }


    /**
     *
     * @param ms delay in milliseconds
     * @returns Promise with given delay
     */
    delay = (ms: number) => new Promise(res => setTimeout(res, ms));

}