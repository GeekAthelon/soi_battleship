console.log("This is battle ship");

import { IGameData } from "./igamedata";

export function initGame() {
    const gameData: IGameData = {
        boardHeight: 10,
        boardWidth: 10,
        turnCount: 0,
        player1: {
            shipBoard: [],
            targetBoard: [],
            name: "Player 1",
            id: "1",
        },
        player2: {
            shipBoard: [],
            targetBoard: [],
            name: "Player 1",
            id: "2",
        }
    };

    return gameData;
}