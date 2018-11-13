export interface IPlayerList {
    name: string;
    id: string;
}
export interface IStartGameData {
    boardHeight: number;
    boardWidth: number;
    playerList: IPlayerList[];
}

export interface IPlayer {
    id: string;
    shipBoard: number[][];
    shipHitPoints: number[];
    targetBoard: number[][];
}

export interface IGameData {
    startGameData: IStartGameData;
    turnCount: number;
    data: IPlayer;
}

export interface IShipData {
    name: string;
    size: number;
}
