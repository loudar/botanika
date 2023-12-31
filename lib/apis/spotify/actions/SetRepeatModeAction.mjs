import {GenericSpotifyAction} from "./GenericSpotifyAction.mjs";
import {TextParser} from "../../../parsers/TextParser.mjs";
import axios from "axios";
import {SpotifyApi} from "../SpotifyApi.mjs";

export class SetRepeatModeAction extends GenericSpotifyAction {
    static isIntendedAction(text) {
        const words = [
            "repeat",
            "wiederholen",
            "wiederhole",
            "loop",
            "schleife"
        ];
        return words.some(word => TextParser.includesWord(text, word));
    }

    static async execute(text, context) {
        const parameter = SetRepeatModeAction.getRepeatModeParameter(text);
        const result = await SetRepeatModeAction.executeInternal(context, parameter);
        if (result && parameter) {
            return [
                {
                    type: "system-response",
                    text: "Used Spotify API to update repeat mode to " + parameter
                },
                {
                    type: "assistant-response",
                    text: `Updated repeat mode to ${parameter}`,
                    canBeCached: true
                }
            ];
        } else {
            return [{
                type: "assistant-response",
                text: "Failed to update repeat mode.",
                canBeCached: true
            }];
        }
    }

    static async executeInternal(context, parameter) {
        try {
            const res = await axios({
                method: 'put',
                url: `https://api.spotify.com/v1/me/player/repeat?state=${parameter}`,
                headers: SpotifyApi.getDefaultHeaders(context)
            });
            if (res.status === 200) {
                return true;
            }
        } catch (e) {
            if (e.response.status === 401) {
                delete context.apis.spotify;
            } else {
                console.log(e);
            }
            return false;
        }
    }

    static getRepeatModeParameter(text) {
        const paramWordMap = {
            "track": ["track", "song", "lied"],
            "context": ["context", "playlist", "album", "artist"],
            "off": ["off", "aus", "ausgeschaltet", "ausmachen", "ausmachen", "ausstellen", "deaktivieren"]
        };
        for (const [param, words] of Object.entries(paramWordMap)) {
            if (words.some(word => TextParser.includesWord(text, word))) {
                return param;
            }
        }
        return null;
    }
}