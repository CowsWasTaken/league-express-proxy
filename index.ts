import express from 'express';
import cors from 'cors';
import {PlatformHostValue} from './constants/PlatformHostValue';
import {MatchEntity} from './models/Entities/MatchEntity';
import {LeagueApiService} from './services/LeagueApiService';
import {ServiceController} from './services/ServiceController';
import {config} from 'dotenv';
import {GameMode} from './models/GameMode';
import {ExceptionHandler} from "./exception/ExceptionHandler";

setEnvVariables();
const app = express();
const port: number = process.env.SERVICE_PORT as unknown as number;
app.use(cors());

const leagueApiService = LeagueApiService.getInstance(); // move away
const serviceController = ServiceController.getInstance();

/*
    is to fetch all games from summoner to database
 */
app.get('/matches/:summonername/execute', async (req, res, next) => {

    try {
        res.json('Matches get fetched from League Api, this can take up to 10 min');
        await serviceController.fetchAndSaveAllMatchesForSummonerName(res, req.params.summonername);
    } catch (err) {
        next(err)
    }

});

/*
    returns every match finding for summoner stored in database
*/
app.get('/matches/:summonername/detailed', async (req, res, next) => {

    try {
        const summonerDTO = await leagueApiService.getPlayerPUUID(PlatformHostValue.EUW1, req.params.summonername);
        const list: MatchEntity[] = await serviceController.getMatchesForPuuid(summonerDTO.puuid);
        res.json(list);
    } catch (err) {
        next(err)
    }

});

/*
    returns overall stats or for specified query gamemode, query parameter is the gamemode
 */
app.get('/matches/:summonername', async (req, res, next) => {
    try {
        const gameModeQuery = req.query.gameMode as string | undefined;
        let gameModeObject: GameMode | undefined = gameModeQuery ? GameMode.getConstant(gameModeQuery) : undefined
        const summonername = req.params.summonername;
        const matchesSummary = await serviceController.getMatchesSummary(summonername, gameModeObject);
        res.json(matchesSummary)
    } catch (err) {
        next(err)
    }
});


app.listen(port, function () {
    console.log(`Server started on localhost ${port}`);
});

app.use(handleGlobalExceptions)


function handleGlobalExceptions(err: any, req: any, res: any, next: any) {
    ExceptionHandler.handleException(err, res, next)
}

/**
 * sets the env variables from .env files if NODE_ENV is not for production
 */
function setEnvVariables() {
    if (process.env.NODE_ENV !== 'production') {
        config();
    }
}
