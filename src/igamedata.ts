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

