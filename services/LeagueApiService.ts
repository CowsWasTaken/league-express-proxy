import {SummonerDTO} from '../models/DTOs/SummonerDTO';
import axios from 'axios';
import {MatchQueryParameter, objectToQueryString} from '../models/Query/MatchQueryParameter';
import {MatchDTO} from '../models/DTOs/MatchDTO';
import {LeagueHttpError} from '../exception/errors/RateLimitError';
import {QUERY_PARAMS} from '../config/QUERY_PARAMS';
import {PlatformHostValue} from '../models/HostValues/PlatformHostValue';
import {RegionalHostValue} from '../models/HostValues/RegionalHostValue';
import {HostValue} from '../models/HostValues/HostValue';

export class LeagueApiService {

    private static instance: LeagueApiService;
    api_key = process.env.API_KEY;
    protocol = 'https';
    api_query = `api_key=${this.api_key}`;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {
    }

    /*
        singleton pattern
    */
    public static getInstance(): LeagueApiService {
        if (!LeagueApiService.instance) {
            LeagueApiService.instance = new LeagueApiService();
        }

        return LeagueApiService.instance;
    }

    /**
     * https://developer.riotgames.com/apis#summoner-v4/GET_getBySummonerName
     *
     * @param hostValue hostValue from league api the host value should be the platform routing value https://developer.riotgames.com/docs/lol#_routing-values
     * @param summonerName name of summoner
     * @return SummonerDTO
     */
    async getPlayerPUUID(hostValue: PlatformHostValue, summonerName: string): Promise<SummonerDTO> {
        return axios.get(`${this.createBaseUrl(hostValue)}/lol/summoner/v4/summoners/by-name/${summonerName}?${this.api_query}`)
            .then(response => {
                console.log(`Fetched PUUID: ${response.data.puuid}`);
                return response.data as SummonerDTO;
            }).catch(err => Promise.reject(err));
    }

    /**
     * https://developer.riotgames.com/apis#match-v5/GET_getMatchIdsByPUUID
     *
     * @param hostValue  has to be RegionalHostValue according to League API
     * @param puuid id of summoner
     * @param matchQueryParameter object for specifying query parameter for api call
     * @return list of match ids
     */
    async getPlayerMatches(hostValue: RegionalHostValue, puuid: string, matchQueryParameter?: MatchQueryParameter): Promise<string[]> {
        let playerMatches_API_CALL = `${this.createBaseUrl(hostValue)}/lol/match/v5/matches/by-puuid/${puuid}/ids?${this.api_query}`; // creates api call
        if (matchQueryParameter) { // adds querystring to api call if exists
            const queryString = objectToQueryString(matchQueryParameter);
            playerMatches_API_CALL = `${playerMatches_API_CALL}&${queryString}`;
        }
        return axios.get(playerMatches_API_CALL)
            .then(response => {
                console.log(`Fetched Player Matches for Puuid: ${puuid}`);
                return response.data;
            }).catch(err => Promise.reject(err));
    }

    /**
     * https://developer.riotgames.com/apis#match-v5/GET_getMatch
     *
     * @param hostValue has to be RegionalHostValue according to League API
     * @param matchId id of the match
     */
    async getMatch(hostValue: RegionalHostValue, matchId: string): Promise<MatchDTO> {
        return axios.get(`${this.createBaseUrl(hostValue)}/lol/match/v5/matches/${matchId}?${this.api_query}`)
            .then(response => {
                console.log(`Fetched Match: ${matchId} `);
                return response.data as MatchDTO;
            }).catch(err => {
                const headers = err.response.headers;
                const retryAfter: number = +headers['retry-after'];
                const httpError: LeagueHttpError = {description: 'Too Many Requests', status: 429, retryAfter};
                return Promise.reject(httpError);
            });
    }


    /**
     * loops as long as not all matches are fetched, max count as maximum number of matches per api call to
     * https://developer.riotgames.com/apis#match-v5/GET_getMatch
     *
     * @param hostValue has to be RegionalHostValue according to League API
     * @param puuid id of summoner
     * @return all match ids found for puuid
     */
    async getAllPlayerMatchesList(hostValue: RegionalHostValue, puuid: string) : Promise<string[]> {
        let isFetchedMatchesGreaterMaxCount = true;
        const matches: string[] = [];
        for (let i = 0; isFetchedMatchesGreaterMaxCount; i++) {
            const start = i * QUERY_PARAMS.MAX_COUNT;
            const matchQueryParameter: MatchQueryParameter = {count: QUERY_PARAMS.MAX_COUNT, start};
            const matchIds: string[] = await this.getPlayerMatches(hostValue, puuid, matchQueryParameter);
            if (QUERY_PARAMS.MAX_COUNT > matchIds.length) {
                isFetchedMatchesGreaterMaxCount = false;
            }
            matchIds.push.apply(matches, matchIds); // pushes list to another list
        }
        return matches;
    }

    private createBaseUrl(hostValue: HostValue): string {
        return `${this.protocol}://${hostValue.host}`;
    }
}