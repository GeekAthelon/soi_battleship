
export interface IShipData {
    name: string;
    size: number;
}

export interface IPlayerList {
    name: string;
    id: string;
}
export interface IStartGameData {
    boardHeight: number;
    boardWidth: number;
    playerList: IPlayerList[];
    shipData: IShipData[];
}

export interface IPlayer {
    shipBoard: number[][];
    shipHitPoints: number[];
    targetBoard: number[][];
}

export interface IGameData {
    data: IPlayer;
    id: string;
    startGameData: IStartGameData;
}