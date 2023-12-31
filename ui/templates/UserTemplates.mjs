import {FJS} from "@targoninc/fjs";
import {Auth} from "../js/Auth.mjs";

export class UserTemplates {
    static login(router) {
        const form = FJS.create("div")
            .classes("full-center")
            .children(
                FJS.create("div")
                    .classes("flex-v", "padded", "rounded", "centered", "align-content")
                    .children(
                        FJS.create("div")
                            .classes("flex", "align-content")
                            .children(
                                FJS.create("label")
                                    .attributes("for", "username")
                                    .text("Username")
                                    .build(),
                                FJS.create("input")
                                    .id("username")
                                    .name("username")
                                    .autocomplete("username")
                                    .type("text")
                                    .build()
                            ).build(),
                        FJS.create("div")
                            .classes("flex", "align-content")
                            .children(
                                FJS.create("label")
                                    .attributes("for", "password")
                                    .text("Password")
                                    .build(),
                                FJS.create("input")
                                    .id("password")
                                    .name("password")
                                    .autocomplete("current-password")
                                    .type("password")
                                    .build()
                            ).build(),
                        FJS.create("div")
                            .classes("flex", "align-content")
                            .children(
                                FJS.create("span")
                                    .classes("login-error")
                                    .build(),
                            ).build(),
                        FJS.create("button")
                            .text("Submit")
                            .onclick(async () => {
                                await Auth.authorizeFromForm(router);
                            })
                            .build()
                    ).build()
            ).build();

        form.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") {
                await Auth.authorizeFromForm(router);
            }
        });

        return form;
    }
}