import {WeatherIntent} from "../intents/WeatherIntent.mjs";
import {DisabledIntent} from "../intents/DisabledIntent.mjs";
import {OpenAiIntent} from "../intents/OpenAiIntent.mjs";
import {DatabaseIntent} from "../intents/DatabaseIntent.mjs";
import {OpenIntent} from "../intents/OpenIntent.mjs";
import {MusicIntent} from "../intents/MusicIntent.mjs";
import {ChatIntent} from "../intents/chat/ChatIntent.mjs";
import {TestIntent} from "../intents/TestIntent.mjs";

export class IntentAction {
    static getIntendedAction(text, context) {
        const intent = IntentAction.intents.find(i => i.isIntended(text, context));
        if (intent) {
            return intent;
        }
        return null;
    }

    static intents = [
        TestIntent,
        OpenIntent,
        WeatherIntent,
        MusicIntent,
        DatabaseIntent,
        ChatIntent
    ];

    static async getIntentAndRespond(text, context, responses) {
        const intent = IntentAction.getIntendedAction(text, context);
        if (intent) {
            if (intent.isDisabled()) {
                responses = await DisabledIntent.execute(intent.name);
            } else {
                let newResponses = await intent.execute(text, context);
                if (!newResponses) {
                    newResponses = await OpenAiIntent.execute(text, context);
                }
                responses = responses.concat(newResponses);
            }
        } else {
            responses = responses.concat(await OpenAiIntent.execute(text, context));
        }
        return responses;
    }
}