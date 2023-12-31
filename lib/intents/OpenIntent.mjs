import {TextParser} from "../parsers/TextParser.mjs";
import OpenAI from "openai";
import {GenericIntent} from "./GenericIntent.mjs";

export class OpenIntent extends GenericIntent {
    static name = "generic";

    static isIntended(text, context) {
        const words = [
            'open',
            'öffne',
            'öffnen',
            'starten',
            'ausführen',
            'ausführe',
            'run',
            'programm'
        ];
        return words.some(word => TextParser.includesWord(text, word));
    }

    static async execute(text, context) {
        const res = await OpenIntent.getUrlFromMessage(text);
        try {
            const object = JSON.parse(res);
            return [
                {
                    type: "assistant-response",
                    text: "Opening " + object.name
                },
                {
                    type: "open-command",
                    text: "Opened " + object.name,
                    url: object.url
                }
            ];
        } catch (e) {
            console.error(e);
        }

        return [
            {
                type: "assistant-response",
                text: "I couldn't figure out which URL you want to open."
            }
        ]
    }

    static async getUrlFromMessage(text) {
        const example = {
            text: "open netflix",
            result: {
                url: "https://www.netflix.com",
                name: "Netflix"
            }
        };
        const systemPrompt = `Take the best guess at which URL the user wants to open. E.g. if the user says '${example.text}', then return '${JSON.stringify(example.result)}'. Only return the JSON object and nothing else. If you can't figure out the URL, return an empty object.`;
        const openai = new OpenAI();

        const completion = await openai.chat.completions.create({
            messages: [
                {role: "system", content: systemPrompt},
                {role: "user", content: text},
            ],
            model: "gpt-3.5-turbo-1106",
            response_format: {
                type: "json_object"
            },
        });

        const out = completion.choices[0].message.content;
        if (out && out.trim().length > 0) {
            return out;
        } else {
            return null;
        }
    }

    static isDisabled() {
        return false;
    }
}