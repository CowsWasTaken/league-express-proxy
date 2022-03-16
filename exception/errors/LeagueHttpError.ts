export interface LeagueHttpError {
    status: number,
    description: string,
    retryAfter?: number
}