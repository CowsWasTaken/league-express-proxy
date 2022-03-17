create table if not exists league_db.summoner_tbl
(
    puuid         varchar(100) not null,
    accountId     varchar(80),
    profileIconId int,
    revisionDate  bigint(40),
    name          varchar(50)  not null,
    id            varchar(100),
    summonerLevel int          not null,
    primary key (puuid)
);

create table if not exists league_db.match_tbl
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
);

create table if not exists league_db.summoner_match_tbl
(
    puuid   varchar(100) not null,
    matchId varchar(80)  not null,
    primary key (puuid, matchId),
    foreign key (puuid) references summoner_tbl (puuid),
    foreign key (matchId) references match_tbl (matchId)
);