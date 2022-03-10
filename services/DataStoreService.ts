import {Knex, knex} from 'knex'
import {SummonerEntity} from "../models/Entities/SummonerEntity";
import {credentials} from "../config/credentials";
import {Tables} from "../constants/Tables";
import {MatchEntity} from "../models/Entities/MatchEntity";
import {SummonerMatchEntity} from "../models/Entities/SummonerMatchEntity";


export class DataStoreService {
    matchRows = [
        `${Tables.SUMMONER_MATCH_TBL}.matchId`,
        "gameDuration",
        "gameCreation",
        "gameEndTimestamp",
        "gameId",
        "gameName",
        "gameType",
        "gameMode",
        "mapId"]
    /**
     * @type {Knex}
     */
    private db
    private dbConfig = knex({
        client: 'mysql2',
        connection: credentials.connection
    });

    constructor() {
        this.db = this.dbConfig

        this.db.raw("SELECT 1").then(() => {
            console.log("MySQL connected");
        })

    }

    async saveSummoner(summoner: SummonerEntity): Promise<any> {
        return this.db.insert(summoner).into(Tables.SUMMONER_TBL)
            .catch((err) => err)
    }

    async linkSummonerToMatch(puuid: string, matchId: string): Promise<any> {
        const summonerMatchEntity: SummonerMatchEntity = {matchId, puuid}
        return this.db.insert(summonerMatchEntity).into(Tables.SUMMONER_MATCH_TBL).catch(err => err)
    }

    async saveFullMatch(puuid: string, match: MatchEntity): Promise<any> {
        await this.db.insert(match).into(Tables.MATCH_TBL).catch(err => err)
        return this.linkSummonerToMatch(puuid, match.matchId)
    }

    async getMatchesForSummoner(puuid: string): Promise<MatchEntity[]> {
        const selectedRows = [
            `${Tables.SUMMONER_MATCH_TBL}.matchId`,
            "gameDuration",
            "gameCreation",
            "gameEndTimestamp",
            "gameId",
            "gameName",
            "gameType",
            "gameMode",
            "mapId"]
        return this.db.select(selectedRows).from(Tables.MATCH_TBL).where(`${Tables.SUMMONER_TBL}.puuid`, '=', puuid)
            .innerJoin(Tables.SUMMONER_MATCH_TBL, `${Tables.SUMMONER_MATCH_TBL}.matchId`, `${Tables.MATCH_TBL}.matchId`)
            .innerJoin(Tables.SUMMONER_TBL, `${Tables.SUMMONER_MATCH_TBL}.puuid`, `${Tables.SUMMONER_TBL}.puuid`)
            .orderBy('gameCreation', "asc")
            .catch(err => err) as Promise<MatchEntity[]>;
    }

    async getMatchesForSummonerFiltered(puuid: string, gameMode: string): Promise<MatchEntity[]> {
        return this.db.select(this.matchRows).from(Tables.MATCH_TBL).where(`${Tables.SUMMONER_TBL}.puuid`, '=', puuid).andWhere(`${Tables.MATCH_TBL}.gameMode`, '=', gameMode)
            .innerJoin(Tables.SUMMONER_MATCH_TBL, `${Tables.SUMMONER_MATCH_TBL}.matchId`, `${Tables.MATCH_TBL}.matchId`)
            .innerJoin(Tables.SUMMONER_TBL, `${Tables.SUMMONER_MATCH_TBL}.puuid`, `${Tables.SUMMONER_TBL}.puuid`)
            .orderBy('gameCreation', "asc")
            .catch(err => err) as Promise<MatchEntity[]>;
    }

    async getExistingMatches(matchIds: string[]): Promise<{ matchId: string }[]> {
        return this.db.table(Tables.MATCH_TBL).select('matchId').whereIn('matchId', matchIds).catch(err => err)
    }
}
