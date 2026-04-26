import { W3StreamAPI } from './apis/w3stream/w3stream.api';
import express from 'express';
import { ParseAPI, PatchAPI, AdminAPI, W3StatsAPI, W3AliasAPI, TwitchAuthAPI, PaypalAPI, BattleNetAuthAPI, StripeAPI } from './apis';
import path from 'path';
import bodyParser from 'body-parser';
import errorHandler from 'errorhandler';
import { ParseService } from './data/services';
import { appConfig } from './config';

ParseService.setAsParseServer();

const cors = require('cors');
const app = express();

app.use((req: express.Request, res, next) => {
    const informations = [req.method, req.path, JSON.stringify(req.body)];
    console.log('REQUEST: ' + informations.join(' '));
    // res.status(404).send();
    next();
});

// Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

app.use('/public', express.static(path.join(__dirname, '/public')));
app.use('/admin', new AdminAPI(app).getHandler());
app.use('/twitch-auth', new TwitchAuthAPI(app).getHandler());
app.use('/battlenet-auth', new BattleNetAuthAPI(app).getHandler());
app.use('/paypal', new PaypalAPI(app).getHandler());
app.use('/stripe', new StripeAPI(app).getHandler());
app.use('/patch', new PatchAPI(app).getHandler());
app.use('/w3alias', new W3AliasAPI(app).getHandler());
app.use('/w3stats', new W3StatsAPI(app).getHandler());
app.use('/stream', new W3StreamAPI(app).getHandler());

new ParseAPI(app).init().then((server) => {
    console.log("Parse server is initialized and can receive requests");
    app.use(appConfig.PARSE.MOUNT, server.getHandler());
    app.emit("PARSE_SERVER_READY");
})

app.use(errorHandler());
export default app;
