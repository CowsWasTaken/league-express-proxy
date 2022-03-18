import {SummonerEntity} from '../models/Entities/SummonerEntity';
import {Tables} from '../constants/Tables';
import {MatchEntity} from '../models/Entities/MatchEntity';
import {SummonerMatchEntity} from '../models/Entities/SummonerMatchEntity';
import knex, {Knex} from 'knex';
import {TableManager} from './TableManager';


export class DataStoreService {

	private static instance: DataStoreService;
	private matchRows = [
		`${Tables.SUMMONER_MATCH_TBL}.matchId`,
		'gameDuration',
		'gameCreation',
		'gameEndTimestamp',
		'gameId',
		'gameName',
		'gameType',
		'gameMode',
		'mapId'];
	/**
     * @type {Knex}
     */
	private db: Knex;

	private constructor() {
		this.db = DataStoreService.getKnexConfig();
		this.db.raw('SELECT 1').then(() => {
			console.log('MySQL connected');
		});
		new TableManager(this.db).checkAndCreateAllTables().then();
	}
	/*
        singleton pattern
    */
	public static getInstance(): DataStoreService {
		if (!DataStoreService.instance) {
			DataStoreService.instance = new DataStoreService();
		}

		return DataStoreService.instance;
	}

	/*
        returns the playtime of matches in seconds
    */
	static getPlaytimeForMatches(matches: MatchEntity[]) {
		let playtime = 0;
		for (let i = 0; i < matches.length; i++) {
			const game = matches[i];
			/*
            Prior to patch 11.20, this field returns the game length in milliseconds calculated from gameEndTimestamp - gameStartTimestamp. Post patch 11.20, this field returns the max timePlayed of any participant in the game in seconds, which makes the behavior of this field consistent with that of match-v4. The best way to handling the change in this field is to treat the value as milliseconds if the gameEndTimestamp field isn't in the response and to treat the value as seconds if gameEndTimestamp is in the response.
             */
			if (!game.gameEndTimestamp) {
				playtime += (game.gameDuration / 1000);
			} else {
				playtime = playtime + matches[i].gameDuration;
			}
		}
		return playtime;
	}

	private static getKnexConfig(): Knex {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const knexConfig = require('../knexfile');
		return knex(knexConfig[process.env.NODE_ENV as string]);
	}

	async saveSummoner(summoner: SummonerEntity): Promise<any> {
		return this.db.insert(summoner).into(Tables.SUMMONER_TBL)
			.catch((err: any) => err);
	}

	/*
        links existing summoner to existing match 
    */
	async linkSummonerToMatch(puuid: string, matchId: string): Promise<any> {
		const summonerMatchEntity: SummonerMatchEntity = {matchId, puuid};
		return this.db.insert(summonerMatchEntity).into(Tables.SUMMONER_MATCH_TBL).catch((err: any) => err);
	}

	/*
        saves match in database and links it to existing summoner
    */
	async saveFullMatch(puuid: string, match: MatchEntity): Promise<any> {
		await this.db.insert(match).into(Tables.MATCH_TBL).catch(err => err);
		return this.linkSummonerToMatch(puuid, match.matchId);
	}

	/*
        returns list of matches for puuid found
    */
	async getMatchesForPuuid(puuid: string): Promise<MatchEntity[]> {
		return this.db.select(this.matchRows).from(Tables.MATCH_TBL).where(`${Tables.SUMMONER_TBL}.puuid`, '=', puuid)
			.innerJoin(Tables.SUMMONER_MATCH_TBL, `${Tables.SUMMONER_MATCH_TBL}.matchId`, `${Tables.MATCH_TBL}.matchId`)
			.innerJoin(Tables.SUMMONER_TBL, `${Tables.SUMMONER_MATCH_TBL}.puuid`, `${Tables.SUMMONER_TBL}.puuid`)
			.orderBy('gameCreation', 'asc')
			.catch((err: any) => err) as Promise<MatchEntity[]>;
	}

	/*
        returns list of matches for puuid found, filtered with gamemode
    */
	async getMatchesForPuuidFiltered(puuid: string, gameMode: string): Promise<MatchEntity[]> {
		return this.db.select(this.matchRows).from(Tables.MATCH_TBL).where(`${Tables.SUMMONER_TBL}.puuid`, '=', puuid).andWhere(`${Tables.MATCH_TBL}.gameMode`, '=', gameMode)
			.innerJoin(Tables.SUMMONER_MATCH_TBL, `${Tables.SUMMONER_MATCH_TBL}.matchId`, `${Tables.MATCH_TBL}.matchId`)
			.innerJoin(Tables.SUMMONER_TBL, `${Tables.SUMMONER_MATCH_TBL}.puuid`, `${Tables.SUMMONER_TBL}.puuid`)
			.orderBy('gameCreation', 'asc')
			.catch((err: any) => err) as Promise<MatchEntity[]>;
	}

	/*
        returns list of matchids found in database for parameter
    */
	async getExistingMatches(matchIds: string[]): Promise<{ matchId: string }[]> {
		return this.db.table(Tables.MATCH_TBL).select('matchId').whereIn('matchId', matchIds).catch((err: any) => err);
	}

	/*
        returns list of existing and missing matches found for list
    */
	async determineMissingGames(matchIds: string[]): Promise<{ existingMatches: string[], missingMatches: string[] }> {
		const existingMatches: string[] = (await this.getExistingMatches(matchIds) as { matchId: string }[]).map(res => res.matchId);// gets all matches existing already from database for list
		for (let i = 0; i < existingMatches.length; i++) {
			const index = matchIds.findIndex(matchId => matchId === existingMatches[i]); // find index in list
			if (index !== -1) { // index returns -1 if no element was found
				matchIds.splice(index, 1); //remove element from array
			}
		}
		return {existingMatches: existingMatches, missingMatches: matchIds};
	}
}
