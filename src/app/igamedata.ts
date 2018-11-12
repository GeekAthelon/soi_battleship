export interface IStartGameData {
    boardHeight: number;
    boardWidth: number;
    player1Name: string;
    player1Id: string;
    player2Name: string;
    player2Id: string;
}

export interface IPlayer {
    name: string;
    id: string;
    shipBoard: number[][];
    targetBoard: number[][];
}

export interface IGameData {
    boardWidth: number;
    boardHeight: number;
    turnCount: number;
    player1: IPlayer;
    player2: IPlayer;
}
