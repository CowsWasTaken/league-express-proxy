export interface MatchDTO {
    metadata: {
        dataVersion: number,
        matchId: string,
        participants: string []
    },
    info: {
        gameCreation: number,
        gameDuration: number,
        gameEndTimestamp: number,
        gameId: number,
        gameMode: string,
        gameName: string,
        gameStartTimestamp: number,
        gameType: string,
        gameVersion: string,
        mapId: number,
    }
}