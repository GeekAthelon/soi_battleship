export interface IMsgBase {
    id: string;
    targetPlayerId: string;
    sourcePlayerId: string;
}

export interface IMsgUpdateUI extends IMsgBase {
    id: "update-ui";
    gameData: IGameData;
}

export type GameMessage = IMsgUpdateUI;
