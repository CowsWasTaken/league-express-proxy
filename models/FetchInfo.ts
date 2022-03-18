import {FilteredMatches} from './FilteredMatches';
import {ApiConfig} from '../config/api_config';

export interface FetchInfo  {
    idealFetchTimeSeconds: number; // in seconds
    buffer: number,
    existingMatches: number;
    missingMatches: number;
}

export class FetchInfo {
    static calculate(filteredMatches: FilteredMatches): FetchInfo {
        return {
            idealFetchTimeSeconds: FetchInfo.toIdealFetchTime(filteredMatches.missingMatches.length),
            existingMatches: filteredMatches.existingMatches.length,
            missingMatches: filteredMatches.missingMatches.length,
            buffer: ApiConfig.defaultTimeoutTime
        };
    }

    private static toIdealFetchTime(size: number): number {

        const apiCallIntervals = size / (ApiConfig.requestsPer2Minute);
        return (Math.floor(apiCallIntervals)) * ApiConfig.defaultTimeoutTime;
    }

}
