import { initFirebase } from "../lib/firebase-pub";
import * as postMessage from "../lib/post-message";

const tryParse = (s: string) => {
    try {
        return JSON.parse(s);
    } catch (err) {
        return null;
    }
};

const messageHander = (e: MessageEvent) => {
    const msg = tryParse(e.data) as postMessage.MessageType;
    if (msg === null) {
        return;
    }

    switch (msg.type) {
        case "PING":
            postMessage.Pong(window.parent);
            break;
        case "FIREBASE-LISTEN-FOR-VALUE":
            initFirebase().then((db) => {
                const dbReferenceObject = db.ref().child(msg.key);

                const testVal = (snap: any) => {
                    if (snap!.val() === msg.value) {
                        postMessage.Pong(window.parent);
                    } else {
                        dbReferenceObject.once("value", testVal);
                    }
                };
                dbReferenceObject.once("value", testVal);
            });
            break;
        default:
            break;
    }
};

window.addEventListener("message", messageHander, false);
