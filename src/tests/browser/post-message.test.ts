// tslint:disable:only-arrow-functions

import * as chai from "chai";
import { initFirebase } from "../../app/lib/firebase-pub";
import * as postMessage from "../../app/lib/post-message";
import { amInBrowser } from "./am-in-browser";

const assert = chai.assert;

describe.only(`browser postMessage examples: Running ${amInBrowser()}`, function() {

    type MessageListenerHandler = (event: MessageEvent) => void;

    const eventList: MessageListenerHandler[] = [];
    const addMessageListener = (callback: MessageListenerHandler) => {
        eventList.push(callback);
        window.addEventListener("message", callback, false);
    };

    this.afterEach(function() {
        while (eventList.length) {
            const messageHander = eventList.pop();
            window.removeEventListener("message", messageHander!, false);
        }
    });

    it("should be alive", function() {
        assert.notStrictEqual(typeof window, "");
    });

    if (amInBrowser()) {
        describe("postMessage", function() {
            it("should get pong", (done) => {
                const iframe = document.querySelector("#iframe-echo") as HTMLIFrameElement;

                addMessageListener((event: MessageEvent) => {
                    const msg = JSON.parse(event.data) as postMessage.IMessageTypePong;
                    if (msg.type === "PONG") {
                        done();
                    }
                });

                assert.notStrictEqual(typeof window, "");
                postMessage.Ping(iframe.contentWindow!);
            });
        });

        describe("firebase", function() {
            it("should get pong", (done) => {
                this.timeout(20 * 1000);

                const iframe = document.querySelector("#iframe-echo") as HTMLIFrameElement;
                const testKey = "soi-unittest-key";

                initFirebase().then((db) => {
                    const testKeyReferenceObject = db.ref().child(testKey);
                    const onlineReferenceObject = db.ref().child("online/unit-test");

                    const testValue = "" + new Date().getTime();

                    addMessageListener((event: MessageEvent) => {
                        const msg = JSON.parse(event.data) as postMessage.IMessageTypePong;
                        if (msg.type === "PONG") {
                            done();
                        }
                    });

                    postMessage.ListenForValue(testKey, testValue, iframe.contentWindow!);

                    onlineReferenceObject.onDisconnect().remove();

                    testKeyReferenceObject.set(testValue);
                    onlineReferenceObject.set("online" + testValue);

                });
            });
        });

    }
});
