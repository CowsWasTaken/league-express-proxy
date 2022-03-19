# League Playtime API

You can see your League of Legends overall playtime for all game-modes (you can also filter for them). Also you can
receive all your played games, IDK how exactly I will implement this. 

So let's see how this is written in the
documentation (hope this is up-to-date)

I just tried to make it work, optimization coming later

Filter for Ranked Games coming soon...

## Run Locally

Clone the project

```bash
  git clone https://github.com/CowsWasTaken/league-playtime-api.git
```

Go to the project directory (don't forget to set your `API_KEY` in the `.env` file)

```bash
  cd league-playtime-api
```

Run Database

```bash
  docker compose up
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start:dev
```

You can access the service on `http://localhost:port/` (default is set to 4000)

## Requirements

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/get-docker/)
[![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/en/download/)

### API_KEY Requirements

To get an API_KEY visit https://developer.riotgames.com/ , create an account and generate an `API_KEY`

### Database Requirements

Make sure to have `Docker` and `Docker Compose` installed at your machine.

The latest version of `mysql` image is used for the database.

The Database schema can be seen in the `schema.sql`. As Query Builder is Knex.js used, so its relative versatile

### Environment Variable Requirements

To run this project, you will need to add the following environment variables to your .env file

Example:

```dotenv
NODE_ENV='development'
SERVICE_PORT=4000
DATABASE_HOST='127.0.0.1'
DATABASE_USER='root'
DATABASE_PASSWORD='password'
DATABASE_DATABASE='league_db'
DATABASE_PORT=3306
API_KEY='RGAPI-xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxx'
```

## Optimizations

What optimizations did you make in your code? E.g. refactors, performance improvements, accessibility

## API Reference

#### Get Playtime 

```http request
  GET /:platformValue/matches/:summonername?gameMode=ARAM
```

| Parameter        | Type         | Description  | Model                                                          |
|:-----------------|:-------------|:-------------|:---------------------------------------------------------------|
| `:platformValue` | `pathParam`  | **Required** | https://developer.riotgames.com/docs/lol#_routing-values       |
| `:summonername`  | `pathParam`  | **Required** ||
| `gameMode`       | `queryParam` | Optional     | https://static.developer.riotgames.com/docs/lol/gameModes.json |

Returns played matches and playtime in seconds

``` json
{
    "gameMode": {
        "gameMode": "ARAM",
        "description": "ARAM games"
    },
    "matchesCount": 866,
    "playtime": 1018842
}
```

### Get all matches

```http request
  GET /:platformValue/matches/:summonername/detailed
```

| Parameter        | Type        | Description  | Model                                                    |
|:-----------------|:------------|:-------------|:---------------------------------------------------------|
| `:platformValue` | `pathParam` | **Required** | https://developer.riotgames.com/docs/lol#_routing-values |
| `:summonername`  | `pathParam` | **Required** ||

``` json
[
  {
        "matchId": "EUW1_5775938866",
        "gameDuration": 986,
        "gameCreation": 1647198074000,
        "gameEndTimestamp": 1647199186077,
        "gameId": 5775938866,
        "gameName": "teambuilder-match-5775938866",
        "gameType": "MATCHED_GAME",
        "gameMode": "ARAM",
        "mapId": 12
    },
    {
        "matchId": "EUW1_5776061973",
        "gameDuration": 1418,
        "gameCreation": 1647199393000,
        "gameEndTimestamp": 1647200912668,
        "gameId": 5776061973,
        "gameName": "teambuilder-match-5776061973",
        "gameType": "MATCHED_GAME",
        "gameMode": "ARAM",
        "mapId": 12
    }, 
    ...
]
```

### Fetch Matches

Fetch and store all Matches related to summoner in database.


Not yet optimized for fetching Summoner Matches at the same time, 
because the Rate Limit from the League `API_KEY` is quickly reached
for Development Keys

```http request
  POST /:platformValue/matches/:summonername/execute
```

| Parameter        | Type        | Description  | Model                                                    |
|:-----------------|:------------|:-------------|:---------------------------------------------------------|
| `:platformValue` | `pathParam` | **Required** | https://developer.riotgames.com/docs/lol#_routing-values |
| `:summonername`  | `pathParam` | **Required** ||

## Authors

- [@CowsWasTaken](https://github.com/CowsWasTaken) (send me your bitcoin )
    jkjk unless ...

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Support

If you need anything reach me out on
Discord [![Cows#4692](https://badgen.net/badge/icon/discord?icon=discord&label)](https://discord.com/users/447331693708443668) 

