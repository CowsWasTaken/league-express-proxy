import {AppError} from './errors/AppError';

process.on('unhandledRejection', (reason: string, p: Promise<any>) => {
	// I just caught an unhandled promise rejection,
	// since we already have fallback handler for unhandled errors (see below),
	// let throw and let him handle that
	throw reason;
});

process.on('uncaughtException', (error: Error) => {
	// I just received an error that was never handled, time to handle it and then decide whether a restart is needed
	if (error instanceof AppError && !error.isOperational) {
		process.exit(1);
	}
	// TODO do some better error handling here
});