import {MatchType} from './MatchType';

export interface MatchQueryParameter {
    startTime?: number,
    endTime?: number,
    queue?: number,
    type?: MatchType,
    start?: number,
    count?: number
}

/**
 *
 * @param obj
 * @returns handed parameter object translated to query string
 */
export function objectToQueryString(obj: any) {
	const str = [];
	for (const p in obj) // eslint-disable-next-line no-prototype-builtins
		if (obj.hasOwnProperty(p)) {
			str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
		}
	return str.join('&');
}

