import { initFirebase } from "../app/lib/firebase-pub";
import * as postMessage from "../app/lib/post-message";

const messageHander = (e: MessageEvent) => {
    const div = document.createElement("div");

    div.textContent = e.data;
    document.body.append(div);

    const msg = JSON.parse(e.data) as postMessage.MessageType;

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
