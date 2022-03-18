import express from 'express';
import cors from 'cors'
import {PlatformHostValue} from "./constants/PlatformHostValue";
import {MatchEntity} from "./models/Entities/MatchEntity";
import {LeagueApiService} from "./services/LeagueApiService";
import {ServiceController} from "./services/ServiceController";

setEnvVariables()
const app = express();
const port: number = process.env.SERVICE_PORT as unknown as number
app.use(cors())

const leagueApiService = LeagueApiService.getInstance() // move away
const serviceController = ServiceController.getInstance()

/*
    is to fetch all games from summoner to database
 */
app.get('/matches/:summonername/execute', async (req, res) => {
    res.json('Matches get fetched from League Api, this can take up to 10 min')
    await serviceController.fetchAndSaveAllMatchesForSummonerName(res, req.params.summonername)

})

/*
    returns every match finding for summoner stored in database
*/
app.get('/matches/:summonername/detailed', async (req, res) => {

    const summonerDTO = await leagueApiService.getPlayerPUUID(PlatformHostValue.EUW1, req.params.summonername)
    const list: MatchEntity[] = await serviceController.getMatchesForPuuid(summonerDTO.puuid)
    res.json(list)
})

/*
    returns overall stats or for specified query gamemode, query parameter is the gamemode
 */

app.get('/matches/:summonername', async (req, res) => {

    const gameMode: string | undefined = req.query.gameMode as string | undefined;
    const summonername = req.params.summonername
    await serviceController.getPlaytimeForSummoner(summonername, gameMode).then(playtime => {
        res.json(`${gameMode ?? 'TOTAL'} playtime is ${(playtime / 3600).toFixed(2)} h`)
    }).catch(err => {
        res.json(err);
    })

})


app.listen(port, function () {
    console.log(`Server started on localhost ${port}`)
}) // localhost:3306


/**
 * sets the env variables from .env files if NODE_ENV is not for production
 */
function setEnvVariables() {
    if (process.env.NODE_ENV !== 'production') {
        require('dotenv').config();
    }
}
