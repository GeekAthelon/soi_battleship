type shipDirection = "h" | "v";

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

interface IShipStatus {
    hitPoints: number;
    shipDirection: shipDirection;
    x: number;
    y: number;
}

interface IPlayer {
    shipBoard: number[][];
    shipStatus: IShipStatus[];
    targetBoard: number[][];
}

interface IGameData {
    data: IPlayer;
    id: string;
    readyPlayers: string[];
    startGameData: IStartGameData;
    status: "none" | "challenged" | "started";
}
