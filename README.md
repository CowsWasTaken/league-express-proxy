# League Express Proxy

You can see your League of Legends overall playtime for all game-modes (you can also filter for them).
Also you can receive all your played games, idk how  exactly I will implement this.
So let's see how this is written in the documentation (if one comes)

For this project i not really cared about code quality, so here we go...

## Requirements

### API_KEY Requirements

To get an API_KEY visit https://developer.riotgames.com/ , create an account and generate an `API_KEY`


### Database Requirements

The latest version of `mysql` image is used for the database.

You have to create your own database with schema `league-express-proxy/my-sql-league-db/schema.sql`, because i was to lazy to add it in the docker compose file.
So simply cd into `league-express-proxy/my-sql-league-db/` and run `docker compose up`. Then you can ssh into your container (via `docker exec -it <container name> /bin/bash`),
login, and run the schema.

You can also use your own database implementation, I used Knex.js as Query Builder so u just need to change the config and client info of it.
Just stick a bit to the schema and everything should be good :)

### Environment Variable Requirements

To run this project, you will need to add the following environment variables to your .env file

```bash
Example: 

NODE_ENV='test'
SERVICE_PORT=4000
DATABASE_HOST='127.0.0.1'
DATABASE_USER='root'
DATABASE_PASSWORD='password'
DATABASE_DATABASE='league_db'
DATABASE_PORT=3306
API_KEY='RGAPI-xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxx'
```


## Run Locally

Clone the project

```bash
  git clone https://github.com/CowsWasTaken/league-express-proxy.git
```

Go to the project directory

```bash
  cd league-express-proxy
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start:dev
```




## Optimizations

What optimizations did you make in your code? E.g. refactors, performance improvements, accessibility


## API Reference

Was to lazy to add endpoints, so this is empty...


## Authors

- [@CowsWasTaken](https://github.com/CowsWasTaken) (send me your bitcoin)


## License

[MIT](https://choosealicense.com/licenses/mit/)

## Support

If you need anything reach me out on Discord [![Cows#4692](https://badgen.net/badge/icon/discord?icon=discord&label)](https://discord.com/users/447331693708443668) 

