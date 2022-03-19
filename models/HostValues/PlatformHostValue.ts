import {AppError} from '../../exception/errors/AppError';
import {PlatformHostConstants} from '../../constants/RoutingValues/PlatformHostValue';
import {RegionalHostValue} from './RegionalHostValue';
import {HostValue} from './HostValue';

export interface PlatformHostValue extends HostValue{
    platform: string,
    regionalHostValue: RegionalHostValue;

}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PlatformHostValue {
    export function getConstant(region: string): PlatformHostValue {
        const foundHostValue = PlatformHostConstants.find(constant => constant.platform === region.toUpperCase());
        if (foundHostValue === undefined) {
            throw new AppError('PlatformHostValueNotFound', 'Platform Host not found', false);
        }
        return foundHostValue;
    }
}