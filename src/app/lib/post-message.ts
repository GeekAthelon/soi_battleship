export interface IMessageTypeBase {
    type: string;
}

export interface IMessageTypePing extends IMessageTypeBase {
    type: "PING";
}

export interface IMessageTypePong extends IMessageTypeBase {
    type: "PONG";
}

const postMessage = (dest: Window, msg: any) => {
    const s = JSON.stringify(msg);
    dest.postMessage(s, "*");
};

export const Ping = (dest: Window) => {
    const msg: IMessageTypePing = {
        type: "PING",
    };
    postMessage(dest, msg);
};

export const Pong = (dest: Window) => {
    const msg: IMessageTypePong = {
        type: "PONG",
    };
    postMessage(dest, msg);
};

export type MessageType = IMessageTypePing | IMessageTypePong;
