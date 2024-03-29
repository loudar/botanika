import {GenericIntent} from "./GenericIntent.mjs";

export class TestIntent extends GenericIntent {
    static name = "Test";

    static isIntended(text, context) {
        return text.toLowerCase() === "test";
    }

    static isDisabled() {
        return false;
    }

    static async execute(text, context) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return [
            {
                type: "assistant-response",
                text: "Test Response"
            }
        ]
    }
}