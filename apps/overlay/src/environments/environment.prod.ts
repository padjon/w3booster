const runtimeConfig = (typeof window !== 'undefined' && (window as any).__W3BOOSTER_CONFIG__) || {};

export const environment = {
  production: true,
  RECORDER_SERVER_URL: runtimeConfig.OVERLAY_RECORDER_WSS_URL || ''
};
