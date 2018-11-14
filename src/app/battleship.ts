import * as pubSubMessages from "../app/pub-sub-name";
import { IGameData, IShipData, IStartGameData } from "./igamedata";
import * as IMessage from "./imessages";
import { IMsgAttackResponse } from "./imessages";
import * as dataStore from "./lib/data-store";
import * as PubSub from "./lib/pub-sub";
import { range } from "./lib/range";

export enum BoardCellType {
    // Numbers below 100 are for ships
    water = 100,
    ship = 101,
    hit = 102,
    miss = 103,
}

const generateBoard = (startGameData: IStartGameData) => {
    const board: number[][] = [];
    for (const x of range(0, startGameData.boardWidth - 1)) {
        board[x] = [];

        for (const y of range(0, startGameData.boardHeight - 1)) {
            board[x][y] = BoardCellType.water;
        }
    }
    return board;
};

export function tryPlaceShip(
    shipData: IShipData[],
    shipNumber: number,
    x: number,
    y: number,
    position: "h" | "v",
    board: number[][]): boolean {

    const xRange = position === "h" ? range(x, x + shipData[shipNumber].size - 1) : range(x, x);
    const yRange = position === "v" ? range(y, y + shipData[shipNumber].size - 1) : range(y, y);

    for (x of xRange) {
        for (y of yRange) {
            if (!board[x]) {
                return false;
            }
            if (board[x][y] !== BoardCellType.water) {
                return false;
            }
        }
    }

    for (x of xRange) {
        for (y of yRange) {
            board[x][y] = shipNumber;
        }
    }
    return true;
}

export function randomizeShips(gameData: IGameData) {
    function getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    let retryCount = 50;

    gameData.data.shipBoard = generateBoard(gameData.startGameData);

    gameData.startGameData.shipData.forEach((ship, idx) => {
        let isValid = false;
        while (!isValid) {
            retryCount--;
            if (retryCount === 0) {
                throw new Error("Unable to place ships");
            }

            const x = getRandomInt(0, gameData.startGameData.boardWidth);
            const y = getRandomInt(0, gameData.startGameData.boardHeight);
            const p: "h" | "v" = getRandomInt(0, 1) === 0 ? "h" : "v";

            isValid = tryPlaceShip(gameData.startGameData.shipData, idx, x, y, p, gameData.data.shipBoard);
        }
    });
}

async function processAttackResponse(gameData: IGameData, gameMessage: IMessage.IMsgAttackResponse) {
    if (!gameMessage.isSuccess) {
        return;
    }

    const cellValue = gameMessage.isHit ? BoardCellType.hit : BoardCellType.miss;
    gameData.data.targetBoard[gameMessage.x][gameMessage.y] = cellValue;
}

async function processAttack(gameData: IGameData, gameMessage: IMessage.IMsgAttack) {
    const cell = gameData.data.shipBoard[gameMessage.x] && gameData.data.shipBoard[gameMessage.x][gameMessage.y];

    const responseMessage: IMsgAttackResponse = {
        id: "attack-response",
        isHit: false,
        isSink: false,
        isSuccess: false,
        playerTurn: gameMessage.sourcePlayerId,
        sourcePlayerId: gameMessage.targetPlayerId,
        sunkShip: undefined,
        targetPlayerId: gameMessage.sourcePlayerId,
        x: gameMessage.x,
        y: gameMessage.y,
    };

    if (cell < gameData.startGameData.shipData.length) {
        // Hit a ship in an unhit-spot
    } else if (cell === BoardCellType.water) {
        responseMessage.isSuccess = true;
        responseMessage.playerTurn = gameMessage.targetPlayerId;

        gameData.data.shipBoard[gameMessage.x][gameMessage.y] = BoardCellType.miss;
    } else {
        // Either hit a targetted spot alreada
        // Or, hit outside the game area
    }

    return responseMessage;
}

function sendUpateUI(gameData: IGameData, gameMessage: IMessage.GameMessage) {
    const updateUiMessage: IMessage.IMsgUpdateUI = {
        gameData,
        id: "update-ui",
        sourcePlayerId: gameMessage.sourcePlayerId,
        targetPlayerId: gameMessage.targetPlayerId,
    };
    PubSub.Pub(gameData.id, pubSubMessages.UPDATE_UI, updateUiMessage);
}

export async function processMessage(recipient: string, gameMessage: IMessage.GameMessage) {
    // When running the test suite, we get activity from both player1 and player2
    // going through this routine.
    //
    // in a real multiplayer game, we wouldn't need recipient to filter the chatter.
    if (recipient !== gameMessage.targetPlayerId) {
        return;
    }
    const gameData = await dataStore.load(gameMessage.targetPlayerId);

    switch (gameMessage.id) {
        case "attack":
            const responseMessage = await processAttack(gameData, gameMessage);
            if (responseMessage) {
                PubSub.Pub(responseMessage.targetPlayerId, pubSubMessages.ATTACK_RESPONSE, responseMessage);
            }
            break;
        case "attack-response":
            await processAttackResponse(gameData, gameMessage);
            break;
        case "update-ui":
            break;
        default:
            throw new Error(gameMessage);
    }

    await dataStore.save(gameMessage.targetPlayerId, gameData);
    sendUpateUI(gameData, gameMessage);
}

export function initGame(startGameData: IStartGameData, playerID: string) {
    const gameData: IGameData = {
        data: {
            shipBoard: generateBoard(startGameData),
            shipHitPoints: startGameData.shipData.map((s) => s.size),
            targetBoard: generateBoard(startGameData),
        },
        id: playerID,
        startGameData,
        turnCount: 0,
    };

    PubSub.Sub(playerID, pubSubMessages.ATTACK_RESPONSE, (msg: IMsgAttackResponse) => {
        processMessage(playerID, msg);
    });
    return gameData;
}
