interface IShipData {
    name: string;
    size: number;
}

interface IPlayerInfo {
    name: string;
    id: string;
}
interface IStartGameData {
    boardHeight: number;
    boardWidth: number;
    playerList: IPlayerInfo[];
    shipData: IShipData[];
}

interface IPlayer {
    shipBoard: number[][];
    shipHitPoints: number[];
    targetBoard: number[][];
}

interface IGameData {
    data: IPlayer;
    id: string;
    startGameData: IStartGameData;
}
