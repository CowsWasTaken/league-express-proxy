import {GameModeConstants} from '../constants/GameConstants/GameModeConstants';
import {AppError} from '../exception/errors/AppError';

export interface GameMode {
    gameMode: string,
    description: string
}


export class GameMode {
    static getConstant(gameMode: string): GameMode {
        const foundGameMode = GameModeConstants.find(constant => constant.gameMode === gameMode.toUpperCase());
        if (foundGameMode === undefined) {
            throw new AppError('GameModeNotFound', 'Game Mode not found for given string', false);
        }
        return foundGameMode;
    }
}