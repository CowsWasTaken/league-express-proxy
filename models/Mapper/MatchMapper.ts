import { MatchEntity } from './Entities/MatchEntity';
import { MatchDTO } from './DTOs/MatchDTO';
import { SummonerDTO } from './DTOs/SummonerDTO';
import { SummonerEntity } from './Entities/SummonerEntity';

export class Mapper {
	static matchDTOToEntity(dto: MatchDTO): MatchEntity {
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
		} catch (err) {
			console.log(dto);
			throw err;
		}
	}

	static summonerToEntity(dto: SummonerDTO): SummonerEntity {
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
		} catch (err) {
			throw `Cannot map summoner to entity: ${err}`;
		}
	}
}