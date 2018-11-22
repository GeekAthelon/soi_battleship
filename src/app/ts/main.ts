import swal from "sweetalert";
import * as dataStore from "../lib/data-store";
import { firebaseNickJoiner } from "../lib/firebase-nick-joiner";
import { initFirebase } from "../lib/firebase-pub";
import * as firebasePubSub from "../lib/firebase-pub-sub";
import * as nioPrep from "../lib/nio";
import * as postMessage from "../lib/post-message";
import * as battleShip from "./battleship";
import { askAcceptChallenge } from "./ui/ask-accept-challenge";
import { addChallenge, removeChallenge } from "./ui/challenge-list";
import { addPlayer, IPlayerInfo, removePlayer } from "./ui/player-list";
import { renderGame } from "./ui/render-board";

import "../style/ui.css";

enum STATES {
    INITIAL_STATE,
    WAITING,
    ISSUE_CHALLENGE,
    WAITING_CHALLENGE_RESPONSE,
    ACCEPT_CHALLENGE,
}

const tryParse = (s: string) => {
    try {
        return JSON.parse(s);
    } catch (err) {
        return null;
    }
};

// This message handler is used to communicate with the parent window
// Once we are initalized, there is no further contact.
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
            mainInit(msg);
            break;
        default:
            break;
    }
};

export interface IGameStatus {
    isPlaying: boolean;
    opponent: IPlayerInfo;
    state: STATES;
    playerId: string;
    playerName: string;
}

async function mainInit(loginMessage: postMessage.IInitalizeIframe) {
    const gameStatus: IGameStatus = {
        isPlaying: false,
        opponent: {
            id: "",
            name: "",
        },
        playerId: "",
        playerName: "",
        state: STATES.INITIAL_STATE,
    };
    const db = await initFirebase();

    async function panicAndNukeDatabas() {
        const root = db.ref();
        root.set(null);
    }

    const pubSub = firebasePubSub.init(db);

    const globalChannel = pubSub.connect(loginMessage.id, "*");
    const globalIo = nioPrep.init(globalChannel);

    const challengeOpponent = async (opponent: IPlayerInfo) => {
        swal(`Issuing challenge to: ${opponent.name}`);

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
        setState(STATES.WAITING_CHALLENGE_RESPONSE);
    };

    const waitingChallengeResponse = async () => {
        const gameMessage = await globalIo.challengeReponseReceiverP();
        if (gameMessage.target !== loginMessage.id) {
            return;
        }

        if (!gameMessage.isAccepted) {
            swal(`Your challenge was declined.`);
            setState(STATES.WAITING);
            return;
        }
        swal(`Your challenge was accepted.`);

        setState(STATES.WAITING);
    };

    const setState = (state: STATES) => {
        gameStatus.state = state;
        executeStateMachine();
    };

    const executeStateMachine = async () => {
        switch (gameStatus.state) {
            case STATES.INITIAL_STATE:
                if (loginMessage.id !== "") {
                    gameStatus.playerId = loginMessage.id;
                    gameStatus.playerName = loginMessage.name;
                    gameStatus.state = STATES.WAITING;
                    renderGame(null, gameStatus);
                }
                break;
            case STATES.WAITING:
                // We are waiting for something to happen, either a challenge
                // or a challenge response.
                break;
            case STATES.ISSUE_CHALLENGE:
                challengeOpponent(gameStatus.opponent);
                break;
            case STATES.WAITING_CHALLENGE_RESPONSE:
                waitingChallengeResponse();
                break;
            case STATES.ACCEPT_CHALLENGE:
                alert("Accepting");
                break;
        }
    };
    setState(STATES.INITIAL_STATE);

    const loginPlayer = async (zloginMessage: postMessage.IInitalizeIframe) => {
        const waitForChallenges = async () => {
            const gameMessage = await globalIo.challengeReceiverP();
            if (gameMessage.target !== loginMessage.id) {
                return;
            }
            const isAccepted = await askAcceptChallenge(gameMessage);

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

        renderGame(null, gameStatus);
    };

    const userInfo = JSON.stringify(
        {
            id: loginMessage.id,
            name: loginMessage.name,
        });

    // There is weird race condition where when you refresh the page, the user can end up
    // knocked off the list, so make the name unique to combat that problem.
    const userOnlineReference = db.ref("online").child(userInfo + firebaseNickJoiner + new Date().getTime());
    userOnlineReference.set(true);
    userOnlineReference.onDisconnect().remove();

    const onlineLIifeReferenceObject = db.ref("online");

    onlineLIifeReferenceObject.on("child_added", (snap) => {
        if (snap && snap.key) {
            const json = snap.key.split(firebaseNickJoiner)[0];
            const playerInfo = JSON.parse(json) as IPlayerInfo;
            if (playerInfo.id !== loginMessage.id) {
                addPlayer(playerInfo, () => {
                    const r = { ...playerInfo };
                    r.callback = undefined;
                    gameStatus.opponent = r;
                    setState(STATES.ISSUE_CHALLENGE);
                });
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

    const buildAcceptChallengeQueue = async () => {
        const gameMessage = await globalIo.challengeReceiverP();
        buildAcceptChallengeQueue();
        if (gameMessage.target !== loginMessage.id) {
            return;
        }

        addChallenge({ id: gameMessage.source, name: gameMessage.name }, () => {
            setState(STATES.ACCEPT_CHALLENGE);
        });
    };
    buildAcceptChallengeQueue();
}

window.addEventListener("message", messageHander, false);
