
export interface IShipData {
    name: string;
    size: number;
}

export interface IPlayerInfo {
    name: string;
    id: string;
}
export interface IStartGameData {
    boardHeight: number;
    boardWidth: number;
    playerList: IPlayerInfo[];
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
