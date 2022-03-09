import {Knex, knex} from 'knex'
import {SummonerEntity} from "../models/Entities/SummonerEntity";
import {credentials} from "../config/credentials";
import {Tables} from "../constants/Tables";
import {MatchEntity} from "../models/Entities/MatchEntity";
import {SummonerMatchEntity} from "../models/Entities/SummonerMatchEntity";


export class DataStoreService {
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

    async getSummonerForPUUID(puuid: string): Promise<SummonerEntity> {
        return this.db.table(Tables.SUMMONER_TBL).where({puuid}).first().catch(err => err) as Promise<SummonerEntity>
    }

    async saveMatch(puuid: string, match: MatchEntity): Promise<any> {
        const summonerMatchEntity: SummonerMatchEntity = {matchId: match.matchId, puuid}
        await this.db.insert(match).into(Tables.MATCH_TBL).catch(err => err)
        return this.db.insert(summonerMatchEntity).into(Tables.SUMMONER_MATCH_TBL).catch(err => err)
    }

    async getMatchesForSummoner(puuid: string): Promise<MatchEntity[]> {
        return this.db.select().from(Tables.MATCH_TBL)
            .innerJoin(Tables.SUMMONER_MATCH_TBL, `${Tables.SUMMONER_MATCH_TBL}.matchId`, `${Tables.MATCH_TBL}.matchId`)
            .innerJoin(Tables.SUMMONER_TBL, `${Tables.SUMMONER_MATCH_TBL}.puuid`, `${Tables.SUMMONER_TBL}.puuid`).where('puuid', puuid) // TODO Fix this bullshit
            .catch(err => err) as Promise<MatchEntity[]>;
    }


    async getExistingMatches(matchIds: string[]): Promise<{ matchId: string }[]> {
        return this.db.table(Tables.MATCH_TBL).select('matchId').whereIn('matchId', matchIds).catch(err => err)
    }


}
