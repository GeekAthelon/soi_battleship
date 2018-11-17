import { IGameData } from "./igamedata";

export interface IMsgBase {
    id: string;
    targetPlayerId: string;
    sourcePlayerId: string;
}

export interface IMsgUpdateUI extends IMsgBase {
    id: "update-ui";
    gameData: IGameData;
}

export interface IMsgAttack extends IMsgBase {
    id: "attack";
    x: number;
    y: number;
}

export type GameMessage = IMsgAttack | IMsgUpdateUI;
