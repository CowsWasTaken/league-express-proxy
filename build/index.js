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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const credentials_1 = require("./config/credentials");
const PlatformHostValue_1 = require("./constants/PlatformHostValue");
const RegionalHostValue_1 = require("./constants/RegionalHostValue");
const MatchQueryParameter_1 = require("./models/MatchQueryParameter");
const DataStoreService_1 = require("./services/DataStoreService");
const Mapper_1 = require("./models/Mapper");
const api_config_1 = require("./config/api_config");
const QUERY_PARAMS_1 = require("./config/QUERY_PARAMS");
const GameMode_1 = require("./models/GameMode");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const protocol = 'https';
const api_key = credentials_1.credentials.apiKey;
const api_query = `api_key=${api_key}`;
const dataService = new DataStoreService_1.DataStoreService();
function getPlayerPUUID(platformHost, summonerName) {
    return __awaiter(this, void 0, void 0, function* () {
        return axios_1.default.get(`${createBaseUrl(platformHost)}/lol/summoner/v4/summoners/by-name/${summonerName}?${api_query}`)
            .then(response => {
            console.log(`Fetched PUUID: ${response.data.puuid}`);
            return response.data;
        }).catch(err => err);
    });
}
function createBaseUrl(hostValue) {
    return `${protocol}://${hostValue}`;
}
function determineMissingGames(matchIds) {
    return __awaiter(this, void 0, void 0, function* () {
        const existingMatches = yield dataService.getExistingMatches(matchIds); // gets all matches existing already from database for list
        for (let i = 0; i < existingMatches.length; i++) {
            let index = matchIds.findIndex(matchId => matchId === existingMatches[i].matchId); // find index in list
            if (index !== -1) { // index returns -1 if no element was found
                matchIds.splice(index, 1); //remove element from array
            }
        }
        let arr = [];
        existingMatches.forEach(match => arr.push(match.matchId));
        return { existingMatches: arr, missingMatches: matchIds };
    });
}
function getPlayerMatches(regionalHostValue, puuid, matchQueryParameter) {
    return __awaiter(this, void 0, void 0, function* () {
        let playerMatches_API_CALL = `${createBaseUrl(regionalHostValue)}/lol/match/v5/matches/by-puuid/${puuid}/ids?${api_query}`; // creates api call
        if (matchQueryParameter) { // adds querystring to api call if exists
            const queryString = (0, MatchQueryParameter_1.objectToQueryString)(matchQueryParameter);
            playerMatches_API_CALL = `${playerMatches_API_CALL}&${queryString}`;
        }
        return axios_1.default.get(playerMatches_API_CALL)
            .then(response => {
            console.log(`Fetched Player Matches for Puuid: ${puuid}`);
            return response.data;
        }).catch(err => err);
    });
}
function getMatch(regionalHostValue, matchId) {
    return __awaiter(this, void 0, void 0, function* () {
        return axios_1.default.get(`${createBaseUrl(regionalHostValue)}/lol/match/v5/matches/${matchId}?${api_query}`)
            .then(response => {
            console.log(`Fetched Match: ${matchId} `);
            return response.data;
        }).catch(err => {
            const headers = err.response.headers;
            const retryAfter = +headers['retry-after'];
            const httpError = { description: 'Too Many Requests', status: 429, retryAfter };
            return Promise.reject(httpError);
        });
    });
}
/*
    is to fetch all games from summoner to database
 */
app.get('/matches/:summonername/execute', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const body = req.body as MatchQueryParameter
    const summonerDTO = yield getPlayerPUUID(PlatformHostValue_1.PlatformHostValue.EUW1, req.params.summonername);
    yield dataService.saveSummoner(summonerDTO);
    res.json('Matches get fetched from League Api, this can take up to 10 min');
    yield fetchAndSaveAllMatchesForSummoner(summonerDTO);
}));
app.get('/matches/:summonername/detailed', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const summonerDTO = yield getPlayerPUUID(PlatformHostValue_1.PlatformHostValue.EUW1, req.params.summonername);
    const list = yield dataService.getMatchesForSummoner(summonerDTO.puuid);
    res.json(list);
}));
/*
    just a testing endpoint
 */
app.get('/test', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let arr = ["EUW1_5770029429", "EUW1_5770075799", "EUW1_5769829384",];
    yield determineMissingGames(arr);
    res.json('done');
}));
/*
    returns stats for aram
 */
app.get('/matches/:summonername', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const gameMode = req.query.gameMode;
    // const body = req.body as MatchQueryParameter
    const summonerDTO = yield getPlayerPUUID(PlatformHostValue_1.PlatformHostValue.EUW1, req.params.summonername);
    const matches = yield dataService.getMatchesForSummoner(summonerDTO.puuid);
    const playtime = getPlaytimeForMatches(matches);
    res.json(`Aram playtime is ${(playtime / 3600).toFixed(2)} h`);
}));
/*
    returns playtime in seconds for matches
 */
function getPlaytimeForMatches(matches) {
    let playtime = 0;
    for (let i = 0; i < matches.length; i++) {
        const game = matches[i];
        if (game.gameMode === GameMode_1.GameMode.ARAM) {
            /*
            Prior to patch 11.20, this field returns the game length in milliseconds calculated from gameEndTimestamp - gameStartTimestamp. Post patch 11.20, this field returns the max timePlayed of any participant in the game in seconds, which makes the behavior of this field consistent with that of match-v4. The best way to handling the change in this field is to treat the value as milliseconds if the gameEndTimestamp field isn't in the response and to treat the value as seconds if gameEndTimestamp is in the response.
             */
            if (!game.gameEndTimestamp) {
                playtime += (game.gameDuration / 1000);
            }
            else {
                playtime = playtime + matches[i].gameDuration;
            }
        }
    }
    return playtime;
}
// creates a delay
const delay = (ms) => new Promise(res => setTimeout(res, ms));
/*
    saves all
 */
function fetchAndSaveAllMatchesForSummoner(summonerDTO) {
    return __awaiter(this, void 0, void 0, function* () {
        const matchIds = yield getAllPlayerMatchesList(summonerDTO.puuid);
        const filteredMatchIds = yield determineMissingGames(matchIds);
        console.log(`Existing Matches: ${filteredMatchIds.existingMatches.length} \nMissing Games ${filteredMatchIds.missingMatches.length}`);
        filteredMatchIds.existingMatches.forEach(match => {
            dataService.linkSummonerToMatch(summonerDTO.puuid, match);
        });
        yield saveMatchesForList(summonerDTO.puuid, filteredMatchIds.missingMatches);
        console.log(`All Matches for ${summonerDTO.name} has been fetched`);
    });
}
function getAllPlayerMatchesList(puuid) {
    return __awaiter(this, void 0, void 0, function* () {
        let isFetchedMatchesGreaterMaxCount = true;
        let matches = [];
        for (let i = 0; isFetchedMatchesGreaterMaxCount; i++) {
            const start = i * QUERY_PARAMS_1.QUERY_PARAMS.MAX_COUNT;
            const matchQueryParameter = { count: QUERY_PARAMS_1.QUERY_PARAMS.MAX_COUNT, start };
            const matchIds = yield getPlayerMatches(RegionalHostValue_1.RegionalHostValue.EUROPE, puuid, matchQueryParameter);
            if (QUERY_PARAMS_1.QUERY_PARAMS.MAX_COUNT > matchIds.length) {
                isFetchedMatchesGreaterMaxCount = false;
            }
            matchIds.push.apply(matches, matchIds); // pushes list to another list
        }
        console.log(`Number of matches${matches.length}`);
        return matches;
    });
}
function saveMatchesForList(puuid, matchIds) {
    return __awaiter(this, void 0, void 0, function* () {
        let arr = []; // list with matchIds witch have been resolved and saved
        let rejected = [];
        let isTooManyRequests = false;
        let retryAfter = api_config_1.ApiConfig.timeoutTime;
        for (let i = 0; (i < matchIds.length) && (!isTooManyRequests); i++) {
            let matchId = matchIds[i];
            yield saveMatch(puuid, matchId)
                .then(() => arr.push(matchId))
                .catch((err) => {
                if (err.status === 429) {
                    console.log(`429 Too Many Requests, Match ${matchId}`);
                    // rejected.push(matchId)
                    retryAfter = err.retryAfter;
                    const arr = matchIds.slice(i, matchIds.length);
                    rejected.push(...arr);
                    isTooManyRequests = true;
                }
                else {
                    console.log(`Match ${matchId} cannot be resolved`);
                    console.log(err);
                }
            });
        }
        // await Promise.all(arr) is useless at this point because all saveMatch functions are awaited
        if (rejected.length > 0) {
            console.log(`Timeout for ${retryAfter} seconds`);
            yield delay(retryAfter * 1000); // for ms
            yield saveMatchesForList(puuid, rejected);
        }
        //TODO implement if the api call is rejected, retry after specific time
    });
}
function saveMatch(puuid, matchId) {
    return __awaiter(this, void 0, void 0, function* () {
        const matchDTO = yield getMatch(RegionalHostValue_1.RegionalHostValue.EUROPE, matchId).catch((err) => {
            if (err.status == 429)
                return Promise.reject(err);
        });
        const matchEntity = Mapper_1.Mapper.matchDTOToEntity(matchDTO);
        return dataService.saveFullMatch(puuid, matchEntity);
    });
}
app.listen(4000, function () {
    console.log("Server started on localhost 4000");
}); // localhost:4000
