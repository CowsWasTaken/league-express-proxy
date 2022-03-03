import {Knex, knex} from 'knex'
import {SummonerEntity} from "../models/Entities/SummonerEntity";
import {credentials} from "../config/credentials";
import {Tables} from "../constants/Tables";
import {MatchEntity} from "../models/Entities/MatchEntity";


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
        return this.db.insert(match).into(Tables.MATCH_TBL).catch(err => err)
    }

    async getMatchesForSummoner(puuid: string) : Promise<MatchEntity[]> {
        return this.db.select().from(Tables.MATCH_TBL)
        .innerJoin(Tables.SUMMONER_MATCH_TBL, `${Tables.SUMMONER_MATCH_TBL}.matchId`, `${Tables.MATCH_TBL}.matchId`)
        .innerJoin(Tables.SUMMONER_TBL, `${Tables.SUMMONER_MATCH_TBL}.puuid`, `${Tables.SUMMONER_TBL}.puuid`)
        .catch(err => err) as Promise<MatchEntity[]>;
    }

    async getPuuidForName(summonerName: string): Promise<SummonerEntity> {
        return this.db.table(Tables.SUMMONER_TBL).whereRaw(`LOWER(name) LIKE ?', '%'+${summonerName.toLowerCase()}+'%`).first()
        .catch(err => err);
    }



}
