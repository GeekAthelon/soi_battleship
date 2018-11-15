import * as chai from "chai";
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

    this.afterEach(() => {
        while (eventList.length) {
            const messageHander = eventList.pop();
            window.removeEventListener("message", messageHander!, false);
        }
    });

    it("should be alive", () => {
        assert.notStrictEqual(typeof window, "");
    });

    if (amInBrowser()) {
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
    }
});
