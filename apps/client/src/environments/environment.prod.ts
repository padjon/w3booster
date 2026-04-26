import { IParseConfiguration } from '@app/data/services';
import { version } from '../../package.json';
const runtimeConfig = (typeof window !== 'undefined' && (window as any).__W3BOOSTER_CONFIG__) || {};
const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';

function normalizeTrailingSlash(url: string) {
  return url.endsWith('/') ? url : url + '/';
}

function getRestUrl() {
  if (currentHost === 'preview.w3booster.com') {
    return 'https://api.preview.w3booster.com/';
  }

  return normalizeTrailingSlash(runtimeConfig.REST_URL || 'https://app.w3booster.com/');
}

function getParseUrl(restUrl: string) {
  if (currentHost === 'preview.w3booster.com') {
    return 'https://api.preview.w3booster.com/parse';
  }

  return runtimeConfig.PARSE_URL || normalizeTrailingSlash(restUrl) + 'parse';
}

const restUrl = getRestUrl();
export const environment = {
  env: 'PROD',
  production: true,
  REST_URL: restUrl,
  PARSE: {
    URL: getParseUrl(restUrl),
    APP_ID: runtimeConfig.PARSE_APP_ID || 'PSBdEx46ycVok7grEcdOMKPMsLYUl1OZ',
    JS_KEY: runtimeConfig.PARSE_JS_KEY || 'stnDsBFS854z78FSBFu36bscjxhbv'
  } as IParseConfiguration,
  LIVESERVER_URL: runtimeConfig.LIVESERVER_URL || 'http://app.w3booster.com:24869/',
  MATCH_UPDATE_WSS_URL: runtimeConfig.MATCH_UPDATE_WSS_URL || '',
  version: version
};
