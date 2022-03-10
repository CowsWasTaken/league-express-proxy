import express from 'express';
import cors from 'cors'
import {PlatformHostValue} from "./constants/PlatformHostValue";
import {MatchEntity} from "./models/Entities/MatchEntity";
import {GameModeConstants} from "./constants/GameModeConstants";
import {LeagueApiService} from "./services/LeagueApiService";


const app = express();

app.use(cors())

const leagueApiService = new LeagueApiService()

/*
    is to fetch all games from summoner to database
 */
app.get('/matches/:summonername/execute', async (req, res) => {
    // const body = req.body as MatchQueryParameter
    const summonerDTO = await leagueApiService.getPlayerPUUID(res, PlatformHostValue.EUW1, req.params.summonername)
    await leagueApiService.dataService.saveSummoner(summonerDTO)

    res.json('Matches get fetched from League Api, this can take up to 10 min')
    await leagueApiService.fetchAndSaveAllMatchesForSummoner(res, summonerDTO)

})

app.get('/matches/:summonername/detailed', async (req, res) => {
    const summonerDTO = await leagueApiService.getPlayerPUUID(res, PlatformHostValue.EUW1, req.params.summonername)
    const list: MatchEntity[] = await leagueApiService.dataService.getMatchesForSummoner(summonerDTO.puuid);
    res.json(list)
})

app.get('/test/:summonername', async (req, res) => {
    const summonerDTO = await leagueApiService.getPlayerPUUID(res, PlatformHostValue.EUW1, req.params.summonername)
    res.json(summonerDTO)
})

/*
    returns stats for aram,
 */
app.get('/matches/:summonername', async (req, res) => {

    const gameMode: string | undefined = req.query.gameMode as string | undefined;
    const summonerDTO = await leagueApiService.getPlayerPUUID(res, PlatformHostValue.EUW1, req.params.summonername)
    let matches: MatchEntity[] = []
    if (gameMode) {
        const isGameModeValid = GameModeConstants.find(element => element.gameMode === gameMode.toUpperCase())
        if (!isGameModeValid) {
            console.log(gameMode)
            res.json(`No valid Parameter to search for Game Mode, was ${gameMode}`)
            return
        } else {
            matches = await leagueApiService.dataService.getMatchesForSummonerFiltered(summonerDTO.puuid, gameMode);
        }
    } else {
        matches = await leagueApiService.dataService.getMatchesForSummoner(summonerDTO.puuid);
    }

    const playtime = leagueApiService.getPlaytimeForMatches(matches)

    res.json(`${gameMode ?? 'TOTAL'} playtime is ${(playtime / 3600).toFixed(2)} h`)

})


app.listen(4000, function () {
    console.log("Server started on localhost 4000")
}) // localhost:4000

