import {RegionalHostValue} from '../../models/HostValues/RegionalHostValue';

// https://developer.riotgames.com/docs/lol#_routing-values
export const RegionalHostConstants: RegionalHostValue[] = [
    {
        region: 'AMERICAS', host: 'americas.api.riotgames.com',
    },
    {
        region: 'ASIA', host: 'asia.api.riotgames.com',
    },
    {
        region: 'EUROPE', host: 'europe.api.riotgames.com',
    },
];
