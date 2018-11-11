import { IGameData } from "./igamedata";

export function initGame() {
    const gameData: IGameData = {
        boardHeight: 10,
        boardWidth: 10,
        player1: {
            id: "1",
            name: "Player 1",
            shipBoard: [],
            targetBoard: [],
        },
        player2: {
            id: "2",
            name: "Player 1",
            shipBoard: [],
            targetBoard: [],
        },
        turnCount: 0,
    };

    return gameData;
}

const g = initGame();
// alert(JSON.stringify(g));
