import { IParseConfiguration } from '@app/data/services';
import { version } from '../../package.json';
export const environment = {
    env: 'LOCAL',
    production: false,
    REST_URL: 'https://localhost:25080/',
    PARSE: {
        URL: 'https://localhost:25080/parse',
        APP_ID: 'PSBdEx46ycVok7grEcdOMKPMsLYUl1OZ',
        JS_KEY: 'stnDsBFS854z78FSBFu36bscjxhbv'
    } as IParseConfiguration,
    LIVESERVER_URL: 'https://localhost:25081/',
    version: version
};
