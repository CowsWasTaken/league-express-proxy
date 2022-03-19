import {PlatformHostValue} from '../../models/HostValues/PlatformHostValue';
import {RegionalHostConstants} from './RegionalHostValue';
import {RegionalHostValue} from '../../models/HostValues/RegionalHostValue';

// https://developer.riotgames.com/docs/lol#_routing-values
export const PlatformHostConstants: PlatformHostValue[] = [
    {
        platform: 'BR1',
        host: 'br1.api.riotgames.com',
        regionalHostValue: RegionalHostValue.getConstant('AMERICAS', RegionalHostConstants)
    },
    {
        platform: 'EUW1',
        host: 'euw1.api.riotgames.com',
        regionalHostValue: RegionalHostValue.getConstant('EUROPE', RegionalHostConstants)
    },
    {
        platform: 'JP1',
        host: 'jp1.api.riotgames.com',
        regionalHostValue: RegionalHostValue.getConstant('ASIA', RegionalHostConstants)
    },
    {
        platform: 'KR',
        host: 'kr.api.riotgames.com',
        regionalHostValue: RegionalHostValue.getConstant('ASIA', RegionalHostConstants)
    },
    {
        platform: 'LA1',
        host: 'la1.api.riotgames.com',
        regionalHostValue: RegionalHostValue.getConstant('AMERICAS', RegionalHostConstants)
    },
    {
        platform: 'LA2',
        host: 'la2.api.riotgames.com',
        regionalHostValue: RegionalHostValue.getConstant('AMERICAS', RegionalHostConstants)
    },
    {
        platform: 'NA1',
        host: 'na1.api.riotgames.com',
        regionalHostValue: RegionalHostValue.getConstant('AMERICAS', RegionalHostConstants)
    },
    {
        platform: 'OC1',
        host: 'oc1.api.riotgames.com',
        regionalHostValue: RegionalHostValue.getConstant('ASIA', RegionalHostConstants)
    },
    {
        platform: 'TR1',
        host: 'tr1.api.riotgames.com',
        regionalHostValue: RegionalHostValue.getConstant('EUROPE', RegionalHostConstants)
    },
    {
        platform: 'RU',
        host: 'ru.api.riotgames.com',
        regionalHostValue: RegionalHostValue.getConstant('ASIA', RegionalHostConstants)
    },
];