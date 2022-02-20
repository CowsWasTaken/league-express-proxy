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

    saveSummoner(summoner: SummonerEntity): Promise<any> {
        return this.db.insert(summoner).into(Tables.SUMMONER_TBL)
            .catch((err) => err)
    }

    async getSummonerForPUUID(puuid: string): Promise<SummonerEntity> {
        return this.db.table(Tables.SUMMONER_TBL).where({puuid}).first().catch(err => err) as Promise<SummonerEntity>
    }

    async saveMatch(puuid: string, match: MatchEntity): Promise<any> {
        return this.db.insert(match).into(Tables.MATCH_TBL).catch(err => err)
    }

}
