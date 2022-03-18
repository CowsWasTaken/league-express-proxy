// centralized error object that derives from Node’s Error

export class AppError extends Error {
    public readonly name: string;
    public readonly isOperational: boolean; // if app can progress then its set to true otherwise false

    constructor(name: string, description: string, isOperational: boolean) {
        super(description);

        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain

        this.name = name;
        this.isOperational = isOperational;
        Error.captureStackTrace(this);
    }
}