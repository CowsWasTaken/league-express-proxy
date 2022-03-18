import {GameMode} from './GameMode';

export interface MatchesSummary {
    matchesCount: number,
    gameMode: GameMode,
    playtime: number // in seconds
}