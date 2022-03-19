import {AppError} from '../../exception/errors/AppError';
import {HostValue} from './HostValue';

export interface RegionalHostValue extends HostValue{
    region: string,
}

export class RegionalHostValue {
    static getConstant(region: string, constants: RegionalHostValue[]): RegionalHostValue {
        const foundHostValue = constants.find(constant => constant.region === region.toUpperCase());
        if (foundHostValue === undefined) {
            throw new AppError('RegionalHostValueNotFound', 'Regional Host not found', false);
        }
        return foundHostValue;
    }
}