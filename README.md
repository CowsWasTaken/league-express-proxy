# League Playtime API

You can see your League of Legends overall playtime for all game-modes (you can also filter for them). Also you can
receive all your played games, idk how exactly I will implement this. So let's see how this is written in the
documentation (if one comes)

For this project i not really cared about code quality, so here we go...

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

### API_KEY Requirements

To get an API_KEY visit https://developer.riotgames.com/ , create an account and generate an `API_KEY`

### Database Requirements

Make sure to have `Docker` and `Docker Compose` installed at your machine.

The latest version of `mysql` image is used for the database.

The Database schema can be seen in the `schema.sql`

You can also use your own database implementation, I used Knex.js as Query Builder so u just need to change the config
and client info of it. Just stick a bit to the schema and everything should be good :)

### Environment Variable Requirements

To run this project, you will need to add the following environment variables to your .env file

```bash
Example: 

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

#### Get all items

```http
  GET /matches/:summonername
```

| Parameter       | Type         | Description  | Model                                                          |
|:----------------|:-------------|:-------------|:---------------------------------------------------------------|
| `:summonername` | `pathParam`  | **Required** ||
| `gameMode`      | `queryParam` | Optional     | https://static.developer.riotgames.com/docs/lol/gameModes.json |

Returns played matches and playtime in seconds

``` http
{
    "matchesCount": 361,
    "playtime": 458603 
}
```

### Get all matches

```http
  GET /matches/:summonername
```

| Parameter       | Type        | Description  | Model |
|:----------------|:------------|:-------------|:------|
| `:summonername` | `pathParam` | **Required** ||

```
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
    }
]
```

### Fetch Matches

Fetch and store all Matches related to summoner in database

```http
  POST /matches/:summonername/execute
```

| Parameter       | Type        | Description  | Model |
|:----------------|:------------|:-------------|:------|
| `:summonername` | `pathParam` | **Required** ||

## Authors

- [@CowsWasTaken](https://github.com/CowsWasTaken) (send me your bitcoin)

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Support

If you need anything reach me out on
Discord [![Cows#4692](https://badgen.net/badge/icon/discord?icon=discord&label)](https://discord.com/users/447331693708443668) 

