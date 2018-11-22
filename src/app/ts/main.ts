import swal from "sweetalert";
import * as dataStore from "../lib/data-store";
import { firebaseNickJoiner } from "../lib/firebase-nick-joiner";
import { initFirebase } from "../lib/firebase-pub";
import * as firebasePubSub from "../lib/firebase-pub-sub";
import * as nioPrep from "../lib/nio";
import * as postMessage from "../lib/post-message";
import * as battleShip from "./battleship";
import { handleChallenge } from "./ui/handle-challenge";
import { addPlayer, IPlayerInfo, removePlayer } from "./ui/player-list";
import { renderGame } from "./ui/render-board";

import "../style/ui.css";

export interface IGameStatus {
    isPlaying: boolean;
}

const gameStatus: IGameStatus = {
    isPlaying: false,
};

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
            loginPlayer(msg);
            break;
        default:
            break;
    }
};

const loginPlayer = async (loginMessage: postMessage.IInitalizeIframe) => {

    const db = await initFirebase();
    const pubSub = firebasePubSub.init(db);

    const globalChannel = pubSub.connect(loginMessage.id, "*");
    const globalIo = nioPrep.init(globalChannel);

    const waitForChallenges = async () => {
        const gameMessage = await globalIo.challengeReceiverP();
        if (gameMessage.target !== loginMessage.id) {
            return;
        }
        const isAccepted = await handleChallenge(gameMessage);

        globalIo.challengeReponseSender({
            isAccepted,
            target: gameMessage.source,
        });

        if (isAccepted) {
            const channel = pubSub.connect(loginMessage.id, gameMessage.source);
            const channelIo = nioPrep.init(channel);

            window.setTimeout(() => {
                swal("Sent ready message");
                channelIo.readySender({ status: true });
            }, 1 * 1000);

            const gameData = battleShip.initGame(gameMessage.startGameData, channel, loginMessage.id);
            battleShip.randomizeShips(gameData);
            dataStore.save(loginMessage.id, gameData);
            gameStatus.isPlaying = true;
            renderGame(gameData, gameStatus);
        } else {
            waitForChallenges();
        }
    };
    waitForChallenges();

    const challengeOpponent = async (opponent: IPlayerInfo) => {
        swal(`Challenging ${opponent.name}`);

        const startGameData: IStartGameData = {
            boardHeight: 10,
            boardWidth: 10,
            playerList: [
                { name: loginMessage.name, id: loginMessage.id },
                { name: opponent.name, id: opponent.id },
            ],
            shipData: [
                { name: "Carrier", size: 5 },
                { name: "Battleship", size: 4 },
                { name: "Cruiser", size: 3 },
                { name: "Submarine", size: 3 },
                { name: "Destroyer", size: 2 },
            ],
        };

        globalIo.challengeSender({
            name: loginMessage.name,
            source: loginMessage.id,
            startGameData,
            target: opponent.id,
        });

        const gameMessage = await globalIo.challengeReponseReceiverP();
        if (gameMessage.target !== loginMessage.id) {
            return;
        }

        if (!gameMessage.isAccepted) {
            swal(`Your challenge was declined.`);
            return;
        }

        const channel = pubSub.connect(loginMessage.id, gameMessage.target);
        const channelIo = nioPrep.init(channel);

        swal.close!();

        const gameData = battleShip.initGame(startGameData, channel, loginMessage.id);
        battleShip.randomizeShips(gameData);
        dataStore.save(loginMessage.id, gameData);
        gameStatus.isPlaying = true;

        renderGame(gameData, gameStatus);

        swal("Waiting on opponent");
        await channelIo.readyReceiver();
        swal("Opponent answered ready");
        swal.close!();
    };

    // There is weird race condition where when you refresh the page, the user can end up
    // knocked off the list, so make the name unique to combat that problem.
    const userInfo = JSON.stringify(
        {
            id: loginMessage.id,
            name: loginMessage.name,
        });
    const userOnlineReference = db.ref("online").child(userInfo + firebaseNickJoiner + new Date().getTime());
    userOnlineReference.set(true);
    userOnlineReference.onDisconnect().remove();

    const onlineLIifeReferenceObject = db.ref("online");

    onlineLIifeReferenceObject.on("child_added", (snap) => {
        if (snap && snap.key) {
            const json = snap.key.split(firebaseNickJoiner)[0];
            const playerInfo = JSON.parse(json) as IPlayerInfo;
            if (playerInfo.id !== loginMessage.id) {
                addPlayer(playerInfo, challengeOpponent);
            }
        }
    });

    onlineLIifeReferenceObject.on("child_removed", (snap) => {
        if (snap && snap.key) {
            const json = snap.key.split(firebaseNickJoiner)[0];
            const playerInfo = JSON.parse(json) as IPlayerInfo;
            if (playerInfo.id !== loginMessage.id) {
                removePlayer(playerInfo);
            }
        }
    });

    renderGame(null, gameStatus);
};

window.addEventListener("message", messageHander, false);
