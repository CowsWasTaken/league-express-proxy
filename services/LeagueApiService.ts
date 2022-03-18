import {PlatformHostValue} from '../constants/PlatformHostValue';
import {SummonerDTO} from '../models/DTOs/SummonerDTO';
import axios from 'axios';
import {RegionalHostValue} from '../constants/RegionalHostValue';
import {MatchQueryParameter, objectToQueryString} from '../models/MatchQueryParameter';
import {MatchDTO} from '../models/DTOs/MatchDTO';
import {LeagueHttpError} from '../exception/errors/RateLimitError';
import {QUERY_PARAMS} from '../config/QUERY_PARAMS';

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

	/*
        returns Summoner for summonername and platformhost
    */
	async getPlayerPUUID(platformHost: PlatformHostValue, summonerName: string): Promise<SummonerDTO | any> {
		return axios.get(`${this.createBaseUrl(platformHost)}/lol/summoner/v4/summoners/by-name/${summonerName}?${this.api_query}`)
			.then(response => {
				console.log(`Fetched PUUID: ${response.data.puuid}`);
				return response.data as SummonerDTO;
			}).catch(err => Promise.reject(err));
	}

	/*
        returns list of matchdIds for player puuid and for additional matchQueryParameter
    */
	async getPlayerMatches(regionalHostValue: RegionalHostValue, puuid: string, matchQueryParameter?: MatchQueryParameter): Promise<string[]> {
		let playerMatches_API_CALL = `${this.createBaseUrl(regionalHostValue)}/lol/match/v5/matches/by-puuid/${puuid}/ids?${this.api_query}`; // creates api call
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

	/*
        returns detailed matchinfo for matchid
    */
	async getMatch(regionalHostValue: RegionalHostValue, matchId: string): Promise<MatchDTO> {
		return axios.get(`${this.createBaseUrl(regionalHostValue)}/lol/match/v5/matches/${matchId}?${this.api_query}`)
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


	/*
        returns all matches for summoner available from league api
    */
	async getAllPlayerMatchesList(puuid: string) {
		let isFetchedMatchesGreaterMaxCount = true;
		const matches: string[] = [];
		for (let i = 0; isFetchedMatchesGreaterMaxCount; i++) {
			const start = i * QUERY_PARAMS.MAX_COUNT;
			const matchQueryParameter: MatchQueryParameter = {count: QUERY_PARAMS.MAX_COUNT, start};
			const matchIds: string[] = await this.getPlayerMatches( RegionalHostValue.EUROPE, puuid, matchQueryParameter);
			if (QUERY_PARAMS.MAX_COUNT > matchIds.length) {
				isFetchedMatchesGreaterMaxCount = false;
			}
			matchIds.push.apply(matches, matchIds); // pushes list to another list
		}
		console.log(`Number of matches${matches.length}`);
		return matches;
	}

	private createBaseUrl(hostValue: PlatformHostValue | RegionalHostValue): string {
		return `${this.protocol}://${hostValue}`;
	}
}