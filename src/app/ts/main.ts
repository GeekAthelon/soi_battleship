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
import { renderGame, setReadyStatus, waitForPlayerReady } from "./ui/render-board";

import "../style/ui.css";

enum STATE {
    INITIAL_STATE,
    WAITING,
    ISSUE_CHALLENGE,
    WAITING_CHALLENGE_RESPONSE,
    ACCEPT_CHALLENGE,
    WAITING_FOR_READY,
    WAITING_PLAY,
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
    acceptChallenge?: IGameMessageChallenge;
    isPlaying: boolean;
    opponent: IPlayerInfo;
    state: STATE;
    opponentReady: boolean;
    playerId: string;
    playerName: string;
    playerReady: boolean;
}

async function mainInit(loginMessage: postMessage.IInitalizeIframe) {
    const gameStatus: IGameStatus = {
        isPlaying: false,
        opponent: {
            id: "",
            name: "",
        },
        opponentReady: false,
        playerId: "",
        playerName: "",
        playerReady: false,
        state: STATE.INITIAL_STATE,
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

        globalIo.sendChallenge({
            name: loginMessage.name,
            source: loginMessage.id,
            startGameData,
            target: opponent.id,
        });
        setState(STATE.WAITING_CHALLENGE_RESPONSE);
    };

    const acceptChallenge = async () => {
        if (!gameStatus.acceptChallenge) {
            return;
        }
        const isAccepted = await askAcceptChallenge(gameStatus.acceptChallenge);

        globalIo.sendChallengeResponse({
            gameStartData: gameStatus.acceptChallenge.startGameData,
            isAccepted,
            target: gameStatus.acceptChallenge.source,
        });

        if (isAccepted) {
            const channel = pubSub.connect(loginMessage.id, gameStatus.acceptChallenge.source);

            const gameData = battleShip.initGame(gameStatus.acceptChallenge.startGameData, channel, loginMessage.id);
            battleShip.randomizeShips(gameData);
            dataStore.save(loginMessage.id, gameData);
            gameStatus.isPlaying = true;

            gameStatus.opponent.id = gameStatus.acceptChallenge!.source;

            renderGame(gameData, gameStatus);
            setState(STATE.WAITING_FOR_READY);
        }
    };

    const waitingChallengeResponse = async () => {
        const gameMessage = await globalIo.recieveChallengeResponse();
        if (gameMessage.target !== loginMessage.id) {
            return;
        }

        if (!gameMessage.isAccepted) {
            swal(`Your challenge was declined.`);
            setState(STATE.WAITING);
            return;
        }

        swal.close!();

        const channel = pubSub.connect(loginMessage.id, gameMessage.target);
        // const channelIo = nioPrep.init(channel);

        const gameData = battleShip.initGame(gameMessage.gameStartData, channel, loginMessage.id);
        battleShip.randomizeShips(gameData);
        dataStore.save(loginMessage.id, gameData);
        gameStatus.isPlaying = true;

        renderGame(gameData, gameStatus);
        setState(STATE.WAITING_FOR_READY);
    };

    const getPlayerIo = (gameData: IGameData) => {
        const opponentId =
            gameData.startGameData.playerList.filter((p) => p.id !== loginMessage.id)[0].id;

        const playerChannel = pubSub.connect(loginMessage.id, opponentId);
        const playerIo = nioPrep.init(playerChannel);
        return playerIo;
    };

    const waitForBothPlayersReady = async () => {
        const gameData = await dataStore.load(loginMessage.id);
        const playerIo = getPlayerIo(gameData);

        const areBothReady = () => {
            setReadyStatus(gameData, gameStatus);
            if (gameStatus.playerReady && gameStatus.opponentReady) {
                setState(STATE.WAITING_PLAY);
            }
        };

        waitForPlayerReady(gameData, gameStatus).then(() => {
            gameStatus.playerReady = true;
            playerIo.sendPlayerReady({ id: loginMessage.id });
            areBothReady();
        });
        playerIo.recievePlayerReady().then((v) => {
            gameStatus.opponentReady = true;
            areBothReady();
        });

    };

    const setState = (state: STATE) => {
        const statusEl = document.querySelector(".js-status") as HTMLElement;
        statusEl.innerHTML = "State : " + STATE[state];
        gameStatus.state = state;
        executeStateMachine();
    };

    const executeStateMachine = async () => {
        switch (gameStatus.state) {
            case STATE.INITIAL_STATE:
                if (loginMessage.id !== "") {
                    gameStatus.playerId = loginMessage.id;
                    gameStatus.playerName = loginMessage.name;
                    gameStatus.state = STATE.WAITING;
                    renderGame(null, gameStatus);
                }
                break;
            case STATE.WAITING:
                // We are waiting for something to happen, either a challenge
                // or a challenge response.
                break;
            case STATE.ISSUE_CHALLENGE:
                challengeOpponent(gameStatus.opponent);
                break;
            case STATE.WAITING_CHALLENGE_RESPONSE:
                waitingChallengeResponse();
                break;
            case STATE.ACCEPT_CHALLENGE:
                acceptChallenge();
                break;
            case STATE.WAITING_FOR_READY:
                waitForBothPlayersReady();
                break;
            case STATE.WAITING_PLAY:
                break;
        }
    };
    setState(STATE.INITIAL_STATE);

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
                    setState(STATE.ISSUE_CHALLENGE);
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
        const gameMessage = await globalIo.recieveChallenge();
        buildAcceptChallengeQueue();
        if (gameMessage.target !== loginMessage.id) {
            return;
        }

        addChallenge({ id: gameMessage.source, name: gameMessage.name }, () => {
            gameStatus.acceptChallenge = gameMessage;
            setState(STATE.ACCEPT_CHALLENGE);
        });
    };
    buildAcceptChallengeQueue();
}

window.addEventListener("message", messageHander, false);
