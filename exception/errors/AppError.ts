// centralized error object that derives from Node’s Error
import HttpStatusCode from '../../models/HttpStatusCodes';

export class AppError extends Error {
	public readonly name: string;
	public readonly httpCode: HttpStatusCode;
	public readonly isOperational: boolean; // if app can progress then its set to true otherwise false

	constructor(name: string, httpCode: HttpStatusCode, description: string, isOperational: boolean) {
		super(description);

		Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain

		this.name = name;
		this.httpCode = httpCode;
		this.isOperational = isOperational;
		Error.captureStackTrace(this);
	}
}