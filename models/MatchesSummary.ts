import {GameMode} from './GameMode';

export interface MatchesSummary {
    matchesCount: number,
    playtime: number // in seconds
    gameMode?: GameMode,
}