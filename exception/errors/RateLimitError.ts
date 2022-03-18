import HttpStatusCode from "../../models/HttpStatusCodes";
import {AppError} from "./AppError";

export interface LeagueHttpError {
    status: number,
    description: string,
    retryAfter?: number
}

export class RateLimitError extends AppError {
    public readonly name: string;
    public readonly httpCode: HttpStatusCode;
    public readonly retryAfter: number;
    public readonly isOperational: boolean;



    constructor(name: string, httpCode: HttpStatusCode, description: string, isOperational: boolean, retryAfter: number) {
        super(name, httpCode, description, isOperational);
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain

        this.name = name;
        this.httpCode = httpCode;
        this.retryAfter = retryAfter;
        this.isOperational = isOperational;
        Error.captureStackTrace(this);

    }
}