import HttpStatusCode from '../models/HttpStatusCodes';
import {LeagueHttpError} from './errors/RateLimitError';

export class ExceptionHandler {
	static handleException(err: any, res: any): any | LeagueHttpError {
		switch (err.response.status) {
		case HttpStatusCode.BAD_REQUEST : {
			res.status(HttpStatusCode.BAD_REQUEST).send(err.message);
			break;
		}
		case HttpStatusCode.UNAUTHORIZED : {
			res.status(HttpStatusCode.UNAUTHORIZED).send(err.message);
			break;
		}
		case HttpStatusCode.FORBIDDEN : {
			res.status(HttpStatusCode.FORBIDDEN).send(err.message);
			break;
		}
		case HttpStatusCode.NOT_FOUND : {
			res.status(HttpStatusCode.NOT_FOUND).send(err.message);
			break;
		}
		case HttpStatusCode.METHOD_NOT_ALLOWED : {
			res.status(HttpStatusCode.METHOD_NOT_ALLOWED).send(err.message);
			break;
		}
		case HttpStatusCode.UNSUPPORTED_MEDIA_TYPE : {
			res.status(HttpStatusCode.UNSUPPORTED_MEDIA_TYPE).send(err.message);
			break;
		}
		case HttpStatusCode.TOO_MANY_REQUESTS : {
			const headers = err.message.response.headers;
			const retryAfter: number = +headers['retry-after'];
			return {description: 'Too Many Requests', status: 429, retryAfter};

		}
		case HttpStatusCode.INTERNAL_SERVER_ERROR : {
			res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(err.message);
			break;
		}
		case HttpStatusCode.BAD_GATEWAY : {
			res.status(HttpStatusCode.BAD_GATEWAY).send(err.message);
			break;
		}
		case HttpStatusCode.SERVICE_UNAVAILABLE : {
			res.status(HttpStatusCode.SERVICE_UNAVAILABLE).send(err.message);
			break;
		}
		case HttpStatusCode.GATEWAY_TIMEOUT : {
			res.status(HttpStatusCode.GATEWAY_TIMEOUT).send(err.message.message);
			break;
		}
		default : {
			res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(`Something unexpected happened: ${err.message}`);
		}

		}

	}
}