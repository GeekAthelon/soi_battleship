import { IGameData, IShipData, IStartGameData } from "../ts/igamedata";
import * as IMessage from "../ts/imessages";
import * as p from "./pub-sub2";
const l = p.init();

export const { Pub, Sub, Unsub, UnsubAll, UnsubByName } = l;

export const MSG = {
    UPDATE_UI: "update-ui",
};
