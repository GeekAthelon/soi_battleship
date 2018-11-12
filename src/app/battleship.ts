import { IGameData, IPlayer, IShipData, IStartGameData } from "./igamedata";
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

const generateBoard = (startGameData: IStartGameData | IGameData) => {
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

export function randomizeShips(player: IPlayer, gameData: IGameData) {
    let retryCount = 50;

    player.shipBoard = generateBoard(gameData);

    function getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    shipData.forEach((ship, idx) => {
        let isValid = false;
        while (!isValid) {
            retryCount--;
            if (retryCount === 0) {
                throw new Error("Unable to place ships");
            }

            const x = getRandomInt(0, gameData.boardWidth);
            const y = getRandomInt(0, gameData.boardHeight);
            const p: "h" | "v" = getRandomInt(0, 1) === 0 ? "h" : "v";

            isValid = tryPlaceShip(idx, x, y, p, player.shipBoard);
        }
    });
}

export function initGame(startGameData: IStartGameData) {
    const gameData: IGameData = {
        boardHeight: startGameData.boardHeight,
        boardWidth: startGameData.boardWidth,
        player1: {
            id: startGameData.player1Id,
            name: startGameData.player1Name,
            shipBoard: generateBoard(startGameData),
            shipHitPoints: shipData.map((s) => s.size),
            targetBoard: generateBoard(startGameData),
        },
        player2: {
            id: startGameData.player2Id,
            name: startGameData.player2Name,
            shipBoard: generateBoard(startGameData),
            shipHitPoints: shipData.map((s) => s.size),
            targetBoard: generateBoard(startGameData),
        },
        turnCount: 0,
    };

    return gameData;
}
