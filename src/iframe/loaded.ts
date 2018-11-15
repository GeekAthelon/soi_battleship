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
    }
};

window.addEventListener("message", messageHander, false);
