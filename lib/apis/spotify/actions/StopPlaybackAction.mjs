import {GenericSpotifyAction} from "./GenericSpotifyAction.mjs";
import {TextParser} from "../../../parsers/TextParser.mjs";
import axios from "axios";
import {SpotifyApi} from "../SpotifyApi.mjs";

export class StopPlaybackAction extends GenericSpotifyAction {
    static isIntendedAction(text) {
        const words = [
            "stop",
            "halt",
            "pausiere",
            "pausieren",
            "pause",
            "stopp",
            "hör auf",
            "höre auf",
        ];
        return words.some(word => TextParser.includesWord(text, word));
    }

    static async execute(text, context) {
        const result = await StopPlaybackAction.executeInternal(context);
        if (result) {
            return [
                {
                    type: "system-response",
                    text: "Used Spotify API to stop playback"
                }
            ];
        } else {
            return [{
                type: "assistant-response",
                text: "Failed to stop playback.",
                canBeCached: true
            }];
        }
    }

    static async executeInternal(context) {
        try {
            const res = await axios({
                method: 'PUT',
                url: `https://api.spotify.com/v1/me/player/pause`,
                headers: SpotifyApi.getDefaultHeaders(context)
            });
            if (res.status === 204) {
                return true;
            }
        } catch (e) {
            if (e.response.status === 401) {
                delete context.apis.spotify;
            } else {
                console.log(e);
            }
            return null;
        }
    }
}