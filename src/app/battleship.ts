import { IGameData, IShipData, IStartGameData } from "./igamedata";
import { range } from "./lib/range";

export enum BoardCellType {
    // Numbers below 100 are for ships
    water = 100,
    ship = 101,
    hit = 102,
    miss = 103,
}

const shipData: IShipData[] = [
    { color: "blue", name: "Carrier", size: 5 },
    { color: "cyan", name: "Battleship", size: 4 },
    { color: "yellow", name: "Cruiser", size: 3 },
    { color: "line", name: "Submarine", size: 3 },
    { color: "line", name: "Destroyer", size: 2 },
];

const generateBoard = (startGameData: IStartGameData) => {
    const board: number[][] = [];
    for (const h of range(1, startGameData.boardHeight)) {
        const line: number[] = [];

        for (const w of range(1, startGameData.boardWidth)) {
            line.push(BoardCellType.water);
        }
        board.push(line);
    }
    return board;
};

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
