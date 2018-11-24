const EventNames = {
    attack: "attack",
    attackResponse: "attack-response",
    challenge: "challenge",
    challengeResponse: "challenge-response",
    ping: "ping",
    playerReady: "player-ready",
};

export interface Inio {
    recieveAttack: () => Promise<IGameMessageAttack>;
    recieveAttackReponse: () => Promise<IGameMessageAttackResponse>;
    recieveChallengeResponse: () => Promise<IGamemessageChallengeResponse>;
    recieveChallenge: () => Promise<IGameMessageChallenge>;
    recievePlayerReady: () => Promise<IGameMessagePlayerReady>;

    sendAttackResponse: (arg: IGameMessageAttackResponse) => void;
    sendAttack: (arg: IGameMessageAttack) => void;
    sendChallengeResponse: (arg: IGamemessageChallengeResponse) => void;
    sendChallenge: (arg: IGameMessageChallenge) => void;
    sendPlayerReady: (arg: IGameMessagePlayerReady) => void;
}

export function init(channel: INetworkChannel): Inio {
    const promisify = <T>(messageType: string) => {
        return new Promise<T>((resolve, reject) => {
            channel.makeOnceReceiver<T>(messageType)((arg: T) => {
                resolve(arg);
            });
        });
    };

    const doSend = <T>(name: string, arg: T) => [
        channel.makeSender<T>(name)(arg),
    ];

    return {
        recieveAttack:
            () => promisify<IGameMessageAttack>(EventNames.attack),
        recieveAttackReponse:
            () => promisify<IGameMessageAttackResponse>(EventNames.attackResponse),
        recieveChallenge:
            () => promisify<IGameMessageChallenge>(EventNames.challenge),
        recieveChallengeResponse:
            () => promisify<IGamemessageChallengeResponse>(EventNames.challengeResponse),
        recievePlayerReady:
            () => promisify<IGameMessagePlayerReady>(EventNames.playerReady),
        sendAttack:
            (arg: IGameMessageAttack) => doSend(EventNames.attack, arg),
        sendAttackResponse:
            (arg: IGameMessageAttackResponse) => doSend(EventNames.attackResponse, arg),
        sendChallenge:
            (arg: IGameMessageChallenge) => doSend(EventNames.challenge, arg),
        sendChallengeResponse:
            (arg: IGamemessageChallengeResponse) => doSend(EventNames.challengeResponse, arg),
        sendPlayerReady:
            (arg: IGameMessagePlayerReady) => doSend(EventNames.playerReady, arg),
    };
}
