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

export interface IMsgAttackResponse extends IMsgBase {
    id: "attack-response";

    // If the target was something invalid --
    // Outside the board, or a location targetted already,
    // set isSuccess to false.
    isSuccess: boolean;

    // Was ship hit?
    isHit: boolean;

    // Was a ship sunk?
    isSink: boolean;

    // What ship was sunk?
    sunkShip: number | undefined;

    // Whose turn?
    playerTurn: string;

    // The coordinates of the attack
    x: number;
    y: number;
}

export type GameMessage = IMsgAttack | IMsgAttackResponse | IMsgUpdateUI;
