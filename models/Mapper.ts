import {MatchEntity} from "./Entities/MatchEntity";
import {MatchDTO} from "./DTOs/MatchDTO";

export class Mapper {
    static matchDTOToEntity(dto: MatchDTO): MatchEntity {
        try {
            return  {
                matchId: dto.metadata.matchId,
                gameCreation: dto.info.gameCreation,
                gameDuration: dto.info.gameDuration,
                gameId: dto.info.gameId,
                gameMode: dto.info.gameMode,
                gameEndTimestamp: dto.info.gameEndTimestamp,
                gameName: dto.info.gameName,
                gameType: dto.info.gameType,
                mapId: dto.info.mapId
            }
        } catch (err) {
            console.log(dto)
            throw err
        }
    }
}