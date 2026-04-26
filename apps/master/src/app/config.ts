import { IParseConfiguration as IParseConfig } from "./data/services";

interface IAppConfig {
    PARSE: IParseConfig & {
        VERBOSE_MODE: boolean,
        SERVER_URL: string
        MOUNT: string,
    },
    MONGOLAB_URI: string,
    PORT: number,
    DEV: boolean,
    PROD: boolean,
    OVERLAY_BROADCAST_PORT: number,
    TWITCH_CLIENT_ID: string,
    TWITCH_CLIENT_SECRET: string,
    BATTLENET_CLIENT_ID: string,
    BATTLENET_CLIENT_SECRET: string,
    BATTLENET_REGION: string,
    STRIPE_SECRET_KEY: string,
    HTTPS_KEY_PATH: string,
    HTTPS_CERT_PATH: string,
    OVERLAY_HTTPS_KEY_PATH: string,
    OVERLAY_HTTPS_CERT_PATH: string,
}

const configurations: {[key:string]:IAppConfig} = {
    dev: {
        PARSE: {
            APP_ID: "PSBdEx46ycVok7grEcdOMKPMsLYUl1OZ",
            JS_KEY: "stnDsBFS854z78FSBFu36bscjxhbv",
            MASTERKEY: "local-master-key-change-me",
            get URL() { return this.SERVER_URL + this.MOUNT},  
            VERBOSE_MODE: true,
            SERVER_URL: "https://localhost:25080",
            MOUNT: "/parse",
        },
        MONGOLAB_URI: "mongodb://127.0.0.1/w3booster",
        PORT: 25080,
        DEV: true,
        PROD: false,
        OVERLAY_BROADCAST_PORT: 25081,
        TWITCH_CLIENT_ID: "p3optsh4af4qzs28v0xce54faocoqt",
        TWITCH_CLIENT_SECRET: "",
        BATTLENET_CLIENT_ID: "",
        BATTLENET_CLIENT_SECRET: "",
        BATTLENET_REGION: "eu",
        STRIPE_SECRET_KEY: "",
        HTTPS_KEY_PATH: "conf/localhost.key",
        HTTPS_CERT_PATH: "conf/localhost.crt",
        OVERLAY_HTTPS_KEY_PATH: "conf/localhost.key",
        OVERLAY_HTTPS_CERT_PATH: "conf/localhost.crt",
    },
    devProdDb: {
        PARSE: {
            APP_ID: "PSBdEx46ycVok7grEcdOMKPMsLYUl1OZ",
            JS_KEY: "stnDsBFS854z78FSBFu36bscjxhbv",
            MASTERKEY: "local-master-key-change-me",
            get URL() { return this.SERVER_URL + this.MOUNT},  
            VERBOSE_MODE: true,
            SERVER_URL: "https://localhost:25080",
            MOUNT: "/parse",
        },
        MONGOLAB_URI: "",
        PORT: 25080,
        DEV: true,
        PROD: false,
        OVERLAY_BROADCAST_PORT: 25081,
        TWITCH_CLIENT_ID: "p3optsh4af4qzs28v0xce54faocoqt",
        TWITCH_CLIENT_SECRET: "",
        BATTLENET_CLIENT_ID: "",
        BATTLENET_CLIENT_SECRET: "",
        BATTLENET_REGION: "eu",
        STRIPE_SECRET_KEY: "",
        HTTPS_KEY_PATH: "conf/localhost.key",
        HTTPS_CERT_PATH: "conf/localhost.crt",
        OVERLAY_HTTPS_KEY_PATH: "conf/localhost.key",
        OVERLAY_HTTPS_CERT_PATH: "conf/localhost.crt",
    },
    prod: {
        PARSE: {
            APP_ID: "PSBdEx46ycVok7grEcdOMKPMsLYUl1OZ",
            JS_KEY: "stnDsBFS854z78FSBFu36bscjxhbv",
            MASTERKEY: "",
            get URL() { return this.SERVER_URL + this.MOUNT},  
            VERBOSE_MODE: true,
            SERVER_URL: "https://app.w3booster.com:14969",
            MOUNT: "/parse",
        },
        MONGOLAB_URI: "",
        PORT: 14969,
        DEV: false,
        PROD: true,
        OVERLAY_BROADCAST_PORT: 14970,
        TWITCH_CLIENT_ID: "sw2dpxriowzfaqcczg5d8ss3ymz1nu",
        TWITCH_CLIENT_SECRET: "",
        BATTLENET_CLIENT_ID: "",
        BATTLENET_CLIENT_SECRET: "",
        BATTLENET_REGION: "eu",
        STRIPE_SECRET_KEY: "",
        HTTPS_KEY_PATH: "../certs/privkey.pem",
        HTTPS_CERT_PATH: "../certs/fullchain.pem",
        OVERLAY_HTTPS_KEY_PATH: "../certs/overlayprivkey.pem",
        OVERLAY_HTTPS_CERT_PATH: "../certs/overlayfullchain.pem",
    }
}

const configurationIdent = process.env.config?? 'dev';
const selectedConfiguration = configurations[configurationIdent];

if(!selectedConfiguration) {
    console.error("Invalid configuration selected: " + configurationIdent );
    process.exit(1);
} else {
    console.log("Loaded Configuration: " + configurationIdent);
}

if (selectedConfiguration) {
    selectedConfiguration.MONGOLAB_URI = process.env.MONGOLAB_URI ?? selectedConfiguration.MONGOLAB_URI;
    selectedConfiguration.PORT = Number(process.env.PORT ?? selectedConfiguration.PORT);
    selectedConfiguration.OVERLAY_BROADCAST_PORT = Number(process.env.OVERLAY_BROADCAST_PORT ?? selectedConfiguration.OVERLAY_BROADCAST_PORT);
    selectedConfiguration.HTTPS_KEY_PATH = process.env.HTTPS_KEY_PATH ?? selectedConfiguration.HTTPS_KEY_PATH;
    selectedConfiguration.HTTPS_CERT_PATH = process.env.HTTPS_CERT_PATH ?? selectedConfiguration.HTTPS_CERT_PATH;
    selectedConfiguration.OVERLAY_HTTPS_KEY_PATH = process.env.OVERLAY_HTTPS_KEY_PATH ?? selectedConfiguration.OVERLAY_HTTPS_KEY_PATH;
    selectedConfiguration.OVERLAY_HTTPS_CERT_PATH = process.env.OVERLAY_HTTPS_CERT_PATH ?? selectedConfiguration.OVERLAY_HTTPS_CERT_PATH;
    selectedConfiguration.PARSE.SERVER_URL = process.env.PARSE_SERVER_URL ?? selectedConfiguration.PARSE.SERVER_URL;
    selectedConfiguration.PARSE.MOUNT = process.env.PARSE_MOUNT ?? selectedConfiguration.PARSE.MOUNT;
    selectedConfiguration.PARSE.APP_ID = process.env.PARSE_APP_ID ?? selectedConfiguration.PARSE.APP_ID;
    selectedConfiguration.PARSE.JS_KEY = process.env.PARSE_JS_KEY ?? selectedConfiguration.PARSE.JS_KEY;
    selectedConfiguration.PARSE.MASTERKEY = process.env.PARSE_MASTER_KEY ?? selectedConfiguration.PARSE.MASTERKEY;
    selectedConfiguration.TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID ?? selectedConfiguration.TWITCH_CLIENT_ID;
    selectedConfiguration.TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET ?? selectedConfiguration.TWITCH_CLIENT_SECRET;
    selectedConfiguration.BATTLENET_CLIENT_ID = process.env.BATTLENET_CLIENT_ID ?? selectedConfiguration.BATTLENET_CLIENT_ID;
    selectedConfiguration.BATTLENET_CLIENT_SECRET = process.env.BATTLENET_CLIENT_SECRET ?? selectedConfiguration.BATTLENET_CLIENT_SECRET;
    selectedConfiguration.BATTLENET_REGION = process.env.BATTLENET_REGION ?? selectedConfiguration.BATTLENET_REGION;
    selectedConfiguration.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? selectedConfiguration.STRIPE_SECRET_KEY;
}

export const appConfig = Object.assign(selectedConfiguration, {
    SERVER_URL: selectedConfiguration.PARSE.SERVER_URL,
    isDevMode: !selectedConfiguration.PROD
})
