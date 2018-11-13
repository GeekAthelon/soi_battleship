import * as pubSubMessages from "../app/pub-sub-name";
import { IGameData, IPlayer, IShipData, IStartGameData } from "./igamedata";
import * as IMessage from "./imessages";
import { IMsgAttackResponse } from "./imessages";
import * as PubSub from "./lib/pub-sub";
import { range } from "./lib/range";

export enum BoardCellType {
    // Numbers below 100 are for ships
    water = 100,
    ship = 101,
    hit = 102,
    miss = 103,
}

export const shipData: IShipData[] = [
    { name: "Carrier", size: 5 },
    { name: "Battleship", size: 4 },
    { name: "Cruiser", size: 3 },
    { name: "Submarine", size: 3 },
    { name: "Destroyer", size: 2 },
];

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

    shipData.forEach((ship, idx) => {
        let isValid = false;
        while (!isValid) {
            retryCount--;
            if (retryCount === 0) {
                throw new Error("Unable to place ships");
            }

            const x = getRandomInt(0, gameData.startGameData.boardWidth);
            const y = getRandomInt(0, gameData.startGameData.boardHeight);
            const p: "h" | "v" = getRandomInt(0, 1) === 0 ? "h" : "v";

            isValid = tryPlaceShip(idx, x, y, p, gameData.data.shipBoard);
        }
    });
}

export function processMessage(gameMessage: IMessage.GameMessage) {
    switch (gameMessage.id) {
        case "attack":

            const responseMessage: IMsgAttackResponse = {
                id: "attack-response",
                isHit: false,
                isSink: false,
                isSuccess: false,
                sunkShip: undefined,
            };

            PubSub.Pub(pubSubMessages.ATTACK_RESPONSE, responseMessage);

            break;
        case "attack-response":
            break;
        default:
            throw new Error(gameMessage);
    }
}

export function initGame(startGameData: IStartGameData, playerID: string) {
    const gameData: IGameData = {
        data: {
            id: playerID,
            shipBoard: generateBoard(startGameData),
            shipHitPoints: shipData.map((s) => s.size),
            targetBoard: generateBoard(startGameData),
        },
        startGameData,
        turnCount: 0,
    };

    return gameData;
}
