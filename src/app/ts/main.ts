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
        case "INTIALIZEIFRAME":
            const playerName = msg.name;
            loginPlayer(playerName);
            break;
        default:
            break;
    }
};

const playerList: string[] = [];

const refreshPlayerList = () => {
    playerList.sort();
    const ul = document.querySelector(".js-playerlist") as HTMLUListElement;

    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }

    playerList.forEach((player) => {
        const li = document.createElement("li");
        // li.classList.add(`js-playerlist-${player}`);
        li.textContent = player;
        ul.appendChild(li);
    });
};

const loginPlayer = async (name: string) => {
    const db = await initFirebase();
    const gameRef = "battleship";

    // There is weird race condition where when you refresh the page, the user can end up
    // knocked off the list, so make the name unique to combat that problem.
    const userOnlineReference = db.ref("online").child(name + ":" + new Date().getTime());
    userOnlineReference.set(true);
    userOnlineReference.onDisconnect().remove();

    const onlineLIifeReferenceObject = db.ref("online");

    setTimeout(() => {
        const dd = db.ref("online").child("" + new Date().getTime());
        dd.set(true);
        dd.onDisconnect().remove();
    }, 5 * 1000);

    onlineLIifeReferenceObject.on("child_added", (snap) => {
        if (snap && snap.key) {
            playerList.push(snap.key);
            refreshPlayerList();
        }
    });

    onlineLIifeReferenceObject.on("child_removed", (snap) => {
        if (snap && snap.key) {
            const idx = playerList.indexOf(snap.key);
            playerList.splice(idx, 1);
            refreshPlayerList();
        }
    });

};

window.addEventListener("message", messageHander, false);
