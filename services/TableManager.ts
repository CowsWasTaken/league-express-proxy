import {Tables} from "../constants/Tables";
import {Knex} from "knex";
import SchemaBuilder = Knex.SchemaBuilder;

export class TableManager {


    constructor(private db: Knex) {
    }

    async createSummonerTable(): Promise<SchemaBuilder> {

        return this.db.schema.hasTable(Tables.SUMMONER_TBL).then(res => {
            // this doesnt work properly, results empty inserts -> could be due to many bugs in knex library replacing bigint with string etc
            // if (!res) {
            //     return this.db.schema.createTableIfNotExists(Tables.SUMMONER_TBL, (table: CreateTableBuilder) => {
            //         table.string('puuid', 100).primary().notNullable()
            //         table.string('accountId', 80).notNullable()
            //         table.integer('profileIconId', 10)
            //         table.integer('revisionDate', 100)
            //         table.string('name', 50).notNullable()
            //         table.string('id', 100).notNullable()
            //         table.integer('summonerLevel').notNullable()
            //     })
            //         .catch(() => {
            //         throw new Error(`Cannot create Table ${Tables.SUMMONER_TBL}`)
            //     })
            // }

            if (!res) {
                return this.db.raw(TableManager.SummonerTableCreationQuery)
                    .catch(() => {
                        throw new Error(`Cannot create Table ${Tables.SUMMONER_TBL}`)
                    })
            }
        })

    }

    async createMatchTable(): Promise<SchemaBuilder> {
        return this.db.schema.hasTable(Tables.MATCH_TBL).then(res => {
            if (!res) {
                // this doesnt work properly, results empty inserts -> could be due to many bugs in knex library replacing bigint with string etc
                // return this.db.schema.createTableIfNotExists(Tables.MATCH_TBL, (table: CreateTableBuilder) => {
                //     table.string('matchId').primary().notNullable()
                //     table.bigInteger('gameDuration').notNullable()
                //     table.bigInteger('gameCreation')
                //     table.bigInteger('gameEndTimestamp')
                //     table.bigInteger('gameId')
                //     table.string('gameName', 100)
                //     table.integer('gameType', 70)
                //     table.string('gameMode', 50).notNullable()
                //     table.integer('mapId')
                // })
                //     .catch(() => {
                //     throw new Error(`Cannot create Table ${Tables.MATCH_TBL}`)
                // })
                return this.db.raw(TableManager.MatchTableCreationQuery)
                    .catch(() => {
                        throw new Error(`Cannot create Table ${Tables.MATCH_TBL}`)
                    })
            }
        })
    }

    async createSummonerMatchTable(): Promise<SchemaBuilder> {
        return this.db.schema.hasTable(Tables.SUMMONER_MATCH_TBL).then(res => {
            if (!res) {
                // this doesnt work properly, results empty inserts -> could be due to many bugs in knex library replacing bigint with string etc
                // return this.db.schema.createTableIfNotExists(Tables.SUMMONER_MATCH_TBL, (table: CreateTableBuilder) => {
                //     table.string('puuid', 100).notNullable()
                //     table.string('matchId', 80).notNullable()
                //     table.foreign('puuid').references(`${Tables.SUMMONER_TBL}.puuid`)
                //     table.foreign('matchId').references(`${Tables.MATCH_TBL}.matchId`)
                //     table.primary(['puuid', 'matchId'])
                // }).catch(() => {
                //     throw new Error(`Cannot create Table ${Tables.SUMMONER_MATCH_TBL}`)
                // })
                return this.db.raw(TableManager.SummonerMatchTableCreationQuery)
                    .catch(() => {
                        throw new Error(`Cannot create Table ${Tables.SUMMONER_MATCH_TBL}`)
                    })
            }
        })

    }

    async checkAndCreateAllTables(): Promise<any> {
        let summonerTbl = this.createSummonerTable()
        let matchTbl = this.createMatchTable()
        return Promise.all([summonerTbl, matchTbl]).then(() => this.createSummonerMatchTable())
    }

    private static SummonerMatchTableCreationQuery = `create table if not exists league_db.summoner_match_tbl
    (
        puuid   varchar(100) not null,
        matchId varchar(80)  not null,
        primary key (puuid, matchId),
        foreign key (puuid) references summoner_tbl (puuid),
        foreign key (matchId) references match_tbl (matchId)
    )`
    private static MatchTableCreationQuery = `create table if not exists league_db.match_tbl
    (
        matchId          varchar(80) not null,
        gameDuration     bigint(30)  not null,
        gameCreation     bigint(50),
        gameEndTimestamp bigint(50),
        gameId           bigint(50),
        gameName         varchar(100),
        gameType         varchar(70),
        gameMode         varchar(50) not null,
        mapId            int,
        primary key (matchId)
    )`
    private static SummonerTableCreationQuery = `create table if not exists league_db.summoner_tbl
    (
        puuid         varchar(100) not null,
        accountId     varchar(80),
        profileIconId int,
        revisionDate  bigint(40),
        name          varchar(50)  not null,
        id            varchar(100),
        summonerLevel int          not null,
        primary key (puuid)
        )`

}