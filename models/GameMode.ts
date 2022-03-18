import {GameModeConstants} from '../constants/GameModeConstants';
import {AppError} from '../exception/errors/AppError';

export interface GameMode {
    gameMode: string,
    description: string
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GameMode {
    export function getConstant(gameMode: string): GameMode {
        const foundGameMode = GameModeConstants.find(constant => constant.gameMode === gameMode.toUpperCase());
        if (foundGameMode === undefined) {
            throw new AppError('GameModeNotFound', 'Game Mode not found for given string', false);
        }
        return foundGameMode;
    }
}