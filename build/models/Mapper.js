"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mapper = void 0;
class Mapper {
    static matchDTOToEntity(dto) {
        try {
            return {
                matchId: dto.metadata.matchId,
                gameCreation: dto.info.gameCreation,
                gameDuration: dto.info.gameDuration,
                gameId: dto.info.gameId,
                gameMode: dto.info.gameMode,
                gameEndTimestamp: dto.info.gameEndTimestamp,
                gameName: dto.info.gameName,
                gameType: dto.info.gameType,
                mapId: dto.info.mapId
            };
        }
        catch (err) {
            console.log(dto);
            throw err;
        }
    }
    static summonerToEntity(dto) {
        try {
            return {
                accountId: dto.accountId,
                id: dto.id,
                name: dto.name,
                profileIconId: dto.profileIconId,
                puuid: dto.puuid,
                revisionDate: dto.revisionDate,
                summonerLevel: dto.summonerLevel
            };
        }
        catch (err) {
            throw `Cannot map summoner to entity: ${err}`;
        }
    }
}
exports.Mapper = Mapper;
