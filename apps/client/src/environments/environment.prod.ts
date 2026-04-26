import { IParseConfiguration } from '@app/data/services';
import { version } from '../../package.json';
const runtimeConfig = (typeof window !== 'undefined' && (window as any).__W3BOOSTER_CONFIG__) || {};
export const environment = {
  env: 'PROD',
  production: true,
  REST_URL: runtimeConfig.REST_URL || 'https://app.w3booster.com/',
  PARSE: {
    URL: runtimeConfig.PARSE_URL || 'https://app.w3booster.com:14969/parse',
    APP_ID: runtimeConfig.PARSE_APP_ID || 'PSBdEx46ycVok7grEcdOMKPMsLYUl1OZ',
    JS_KEY: runtimeConfig.PARSE_JS_KEY || 'stnDsBFS854z78FSBFu36bscjxhbv'
  } as IParseConfiguration,
  LIVESERVER_URL: runtimeConfig.LIVESERVER_URL || 'http://app.w3booster.com:24869/',
  MATCH_UPDATE_WSS_URL: runtimeConfig.MATCH_UPDATE_WSS_URL || '',
  version: version
};
