import { IGameData, IStartGameData } from "./igamedata";
import { range } from "./lib/range";

export enum BoardCellType {
    water = 1,
    ship = 2,
    hit = 3,
    miss = 4,
}

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
            targetBoard: generateBoard(startGameData),
        },
        player2: {
            id: startGameData.player2Id,
            name: startGameData.player2Name,
            shipBoard: generateBoard(startGameData),
            targetBoard: generateBoard(startGameData),
        },
        turnCount: 0,
    };

    return gameData;
}
