import HttpStatusCode from '../models/HttpStatusCodes';
import {NetworkError} from "./errors/NetworkError";
import {AppError} from "./errors/AppError";

export class ExceptionHandler {

    static handleException(err: any, res: any, next: any) {
        switch (err.constructor) {
            case NetworkError : {
                ExceptionHandler.handleNetworkError(err, res)
                break
            }
            case AppError: {
                ExceptionHandler.handleAppError(err, res)
                break
            }
            default : {
                res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(`${err.name}: ${err.message}`)
            }
        }
        next()
    }

    private static handleAppError(err: AppError, res: any) {
			res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(`${err.name}: ${err.message}`)
    }

    private static handleNetworkError(err: NetworkError, res: any) {
        res.status(err.httpCode).send(`${err.name}: ${err.message}`)
        }
    }