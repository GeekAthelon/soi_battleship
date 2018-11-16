// POST messages are used  for inter-process communications
// Either the hosting page and the game's iframe or between the testing
// sytem's iframe.
//

export interface IMessageTypeBase {
    type: string;
}

export interface IMessageTypePing extends IMessageTypeBase {
    type: "PING";
}

export interface IMessageTypePong extends IMessageTypeBase {
    type: "PONG";
}

export interface IInitalizeIframe extends IMessageTypeBase {
    type: "INTIALIZEIFRAME";
    name: string;
}

export interface IMessageListenFirebaseChange extends IMessageTypeBase {
    type: "FIREBASE-LISTEN-FOR-VALUE";
    key: string;
    value: string;
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

export const ListenForValue = (key: string, value: string, dest: Window) => {
    const msg: IMessageListenFirebaseChange = {
        key,
        type: "FIREBASE-LISTEN-FOR-VALUE",
        value,
    };
    postMessage(dest, msg);
};

export const InitalizeIframe = (name: string, dest: Window) => {
    const msg: IInitalizeIframe = {
        name,
        type: "INTIALIZEIFRAME",
    };
    postMessage(dest, msg);
};

export type MessageType =
    IMessageTypePing |
    IMessageTypePong |
    IInitalizeIframe |
    IMessageListenFirebaseChange
    ;
