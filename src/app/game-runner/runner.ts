import { initFirebase } from "../lib/firebase-pub";
import * as postMessage from "../lib/post-message";
// import { PubSub } from "../lib/pub-sub";

const setStatus = (s: string) => {
    const statusDiv = document.querySelector(".status-bar") as HTMLDivElement;
    statusDiv.textContent = s;
};

(async () => {
    const loadiFrame = (home: string, url: string) => {
        return new Promise<HTMLIFrameElement>((resolve, reject) => {
            const homeDiv = document.getElementById(home) as HTMLDivElement;
            const iframe = document.createElement("iframe");
            iframe.addEventListener("load", () => {
                resolve(iframe);
            });
            iframe.src = url;
            homeDiv.appendChild(iframe);
        });
    };

    const pongListener = (iframe: HTMLIFrameElement) => {
        return new Promise<void>((resolve, reject) => {
            const l = (e: MessageEvent) => {
                try {
                    const msg = JSON.parse(e.data) as postMessage.MessageType;
                    if (msg.type === "PONG") {
                        window.removeEventListener("message", l, false);
                        resolve();
                    }
                } catch (err) {
                    // Ignore
                }
            };
            window.addEventListener("message", l, false);
            postMessage.Ping(iframe.contentWindow!);
        });
    };

    setStatus("loading iframes");
    const iframeP1 = loadiFrame("player1home", "bs-iframe.html");
    const iframeP2 = loadiFrame("player2home", "bs-iframe.html");

    const iframe1 = await iframeP1;
    const iframe2 = await iframeP2;

    setStatus("pinging iframes");
    await Promise.all([
        pongListener(iframe1),
        pongListener(iframe2),
    ]);

    setStatus("iframes have responded");

    postMessage.InitalizeIframe("Player 1", iframe1.contentWindow!);
    postMessage.InitalizeIframe("Other Player", iframe2.contentWindow!);
})();
