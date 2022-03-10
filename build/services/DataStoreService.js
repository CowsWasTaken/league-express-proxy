"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStoreService = void 0;
const knex_1 = require("knex");
const credentials_1 = require("../config/credentials");
const Tables_1 = require("../constants/Tables");
class DataStoreService {
    constructor() {
        this.dbConfig = (0, knex_1.knex)({
            client: 'mysql2',
            connection: credentials_1.credentials.connection
        });
        this.db = this.dbConfig;
        this.db.raw("SELECT 1").then(() => {
            console.log("MySQL connected");
        });
    }
    saveSummoner(summoner) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.insert(summoner).into(Tables_1.Tables.SUMMONER_TBL)
                .catch((err) => err);
        });
    }
    getSummonerForPUUID(puuid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.table(Tables_1.Tables.SUMMONER_TBL).where({ puuid }).first().catch(err => err);
        });
    }
    linkSummonerToMatch(puuid, matchId) {
        return __awaiter(this, void 0, void 0, function* () {
            const summonerMatchEntity = { matchId, puuid };
            return this.db.insert(summonerMatchEntity).into(Tables_1.Tables.SUMMONER_MATCH_TBL).catch(err => err);
        });
    }
    saveFullMatch(puuid, match) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.insert(match).into(Tables_1.Tables.MATCH_TBL).catch(err => err);
            return this.linkSummonerToMatch(puuid, match.matchId);
        });
    }
    getMatchesForSummoner(puuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const selectedRows = [
                `${Tables_1.Tables.SUMMONER_MATCH_TBL}.matchId`,
                "gameDuration",
                "gameCreation",
                "gameEndTimestamp",
                "gameId",
                "gameName",
                "gameType",
                "gameMode",
                "mapId"
            ];
            return this.db.select(selectedRows).from(Tables_1.Tables.MATCH_TBL).where(`${Tables_1.Tables.SUMMONER_TBL}.puuid`, '=', puuid)
                .innerJoin(Tables_1.Tables.SUMMONER_MATCH_TBL, `${Tables_1.Tables.SUMMONER_MATCH_TBL}.matchId`, `${Tables_1.Tables.MATCH_TBL}.matchId`)
                .innerJoin(Tables_1.Tables.SUMMONER_TBL, `${Tables_1.Tables.SUMMONER_MATCH_TBL}.puuid`, `${Tables_1.Tables.SUMMONER_TBL}.puuid`)
                .orderBy('gameCreation', "asc")
                .catch(err => err);
        });
    }
    getExistingMatches(matchIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.table(Tables_1.Tables.MATCH_TBL).select('matchId').whereIn('matchId', matchIds).catch(err => err);
        });
    }
}
exports.DataStoreService = DataStoreService;
