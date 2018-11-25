// tslint:disable:only-arrow-functions

import * as chai from "chai";
import { firebaseNickJoiner } from "../../app/lib/firebase-nick-joiner";
import { initFirebase } from "../../app/lib/firebase-pub";
import * as postMessage from "../../app/lib/post-message";
import { amInBrowser } from "./am-in-browser";

const assert = chai.assert;

describe(`browser postMessage examples: Running ${amInBrowser()}`, function() {

    type MessageListenerHandler = (event: MessageEvent) => void;

    const eventList: MessageListenerHandler[] = [];
    const addMessageListener = (callback: MessageListenerHandler) => {
        eventList.push(callback);
        window.addEventListener("message", callback, false);
    };
    const getNewIframe = () => {
        return new Promise<HTMLIFrameElement>((resolve, reject) => {
            const iframeHome = document.getElementById("mocha-iframe-home") as HTMLDivElement;
            const iframe = document.createElement("iframe");
            iframe.addEventListener("load", () => {
                resolve(iframe);
            });
            iframe.src = "mocha-iframe.html";
            iframeHome.appendChild(iframe);
        });
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
            it("should get pong", () => {
                return new Promise((resolve, reject) => {
                    (async () => {
                        const iframe = await getNewIframe();

                        addMessageListener((event: MessageEvent) => {
                            const msg = JSON.parse(event.data) as postMessage.IMessageTypePong;
                            if (msg.type === "PONG") {
                                resolve();
                            }
                        });

                        assert.notStrictEqual(typeof window, "");
                        postMessage.Ping(iframe.contentWindow!);
                    })();
                });
            });
        });

        describe("firebase", function() {
            it("should get pong", function() {
                this.timeout(5 * 1000);

                return new Promise((resolve, reject) => {
                    (async () => {
                        const iframe = await getNewIframe();
                        const testKey = "soi-unittest-key";

                        const db = await initFirebase();

                        const testKeyReferenceObject = db.ref().child(testKey);
                        const onlineReferenceObject = db.ref().child(`online/unit-test${firebaseNickJoiner}0`);

                        const testValue = "" + new Date().getTime();

                        addMessageListener((event: MessageEvent) => {
                            const msg = JSON.parse(event.data) as postMessage.IMessageTypePong;
                            if (msg.type === "PONG") {
                                resolve();
                            }
                        });

                        postMessage.ListenForValue(testKey, testValue, iframe.contentWindow!);
                        onlineReferenceObject.onDisconnect().remove();
                        testKeyReferenceObject.set(testValue);
                        onlineReferenceObject.set("online" + testValue);
                    })();
                });

            });
        });

    }
});
