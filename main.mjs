import express from 'express';
import {VoiceRecognitionEndpoint} from "./lib/endpoints/VoiceRecognitionEndpoint.mjs";
import {fileURLToPath} from "url";
import path from "path";
import {SendMessageEndpoint} from "./lib/endpoints/SendMessageEndpoint.mjs";
import {GetHistoryEndpoint} from "./lib/endpoints/GetHistoryEndpoint.mjs";
import dotenv from "dotenv";
import multer from "multer";
import passport from "passport";
import session from "express-session";
import {DB} from "./lib/db/DB.mjs";
import {SpotifyApi} from "./lib/apis/spotify/SpotifyApi.mjs";
import {AuthActions} from "./lib/actions/AuthActions.mjs";
import {PassportDeserializeUser, PassportSerializeUser, PassportStrategy} from "./lib/apis/PassportStrategy.mjs";
import {CLI} from "./lib/CLI.mjs";
import {Context} from "./lib/context/Context.mjs";

const upload = multer({ storage: multer.memoryStorage() });

dotenv.config();
const contextMap = {};

/**
 *
 * @param app {Express}
 * @param endpoint {method, path, handler}
 */
function addEndpoint(app, endpoint) {
    const { path, handler } = endpoint;
    app.post('/api' + path, AuthActions.checkAuthenticated, (req, res) => {
        handler(req, res, contextMap[req.sessionID]).then(() => {
            db.updateContext(req.user.id, JSON.stringify(contextMap[req.sessionID]));
        });
    });
}

export function addEndpoints(app, endpoints) {
    endpoints.forEach(endpoint => addEndpoint(app, endpoint));
}

const endpoints = [
    SendMessageEndpoint,
    GetHistoryEndpoint
];

const app = express();
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session({}));
app.post('/api' + VoiceRecognitionEndpoint.path, AuthActions.checkAuthenticated, upload.single('file'), (req, res) => {
    VoiceRecognitionEndpoint.handler(req, res, contextMap[req.sessionID]).then(() => {
        db.updateContext(req.user.id, JSON.stringify(contextMap[req.sessionID]));
    });
});
app.use(express.json());
addEndpoints(app, endpoints);

const db_url = process.env.MYSQL_URL.toString();
CLI.debug(`Connecting to database at url ${db_url}...`);
const db = new DB(process.env.MYSQL_URL);
await db.connect();
CLI.success('Connected to database!');

passport.use(PassportStrategy(db));
passport.serializeUser(PassportSerializeUser());
passport.deserializeUser(PassportDeserializeUser(db));

app.post("/api/authorize", AuthActions.authorizeUser(db, contextMap));
app.post("/api/logout", AuthActions.logout(contextMap));
app.get("/api/isAuthorized", AuthActions.isAuthorized(contextMap));

app.post("/api/reset-context", AuthActions.checkAuthenticated, async (req, res) => {
    // Keep API info when resetting context
    const apis = contextMap[req.sessionID].apis;
    contextMap[req.sessionID] = Context.generate(req.user, req.sessionID);
    contextMap[req.sessionID].apis = apis;

    await db.updateContext(req.user.id, JSON.stringify(contextMap[req.sessionID]));
    res.send({context: contextMap[req.sessionID]});
});

app.post("/api/reset-history", AuthActions.checkAuthenticated, async (req, res) => {
    contextMap[req.sessionID].history = [];
    await db.updateContext(req.user.id, JSON.stringify(contextMap[req.sessionID]));
    res.send({context: contextMap[req.sessionID]});
});

app.get('/api/spotify-login', AuthActions.checkAuthenticated, async (req, res) => {
    await SpotifyApi.onLogin(req, res);
});

app.get('/api/spotify-logout', AuthActions.checkAuthenticated, async (req, res) => {
    delete contextMap[req.sessionID].apis.spotify;
    await db.updateContext(req.user.id, JSON.stringify(contextMap[req.sessionID]));
    res.redirect('/spotify-logout-success');
});

app.get('/api/spotify-callback', AuthActions.checkAuthenticated, async (req, res) => {
    await SpotifyApi.onCallback(req, res, contextMap[req.sessionID], db);
});

app.post('/api/toggle-assistant-mute', AuthActions.checkAuthenticated, async (req, res) => {
    contextMap[req.sessionID].assistant.muted = !contextMap[req.sessionID].assistant.muted;
    await db.updateContext(req.user.id, JSON.stringify(contextMap[req.sessionID]));
    res.send({context: contextMap[req.sessionID]});
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "ui")));
app.use('/audio', AuthActions.checkAuthenticated, express.static(path.join(__dirname, '/audio')));

app.get('*', (req, res) => {
    res.sendFile(__dirname + '/ui/index.html');
});

app.listen(3000, () => {
    CLI.success(`Listening on ${process.env.DEPLOYMENT_URL || 'http://localhost:3000'}`);
});
