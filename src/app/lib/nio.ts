const EventNames = {
    attack: "attack",
    attackResponse: "attack-response",
    challenge: "challenge",
    challengeResponse: "challenge-response",
    ping: "ping",
    ready: "ready",
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
            () => promisify<IGameMessagePlayerReady>(EventNames.ready),

        sendAttack:
            channel.makeSender<IGameMessageAttack>(EventNames.attack),
        sendAttackResponse:
            channel.makeSender<IGameMessageAttackResponse>(EventNames.attackResponse),
        sendChallenge:
            channel.makeSender<IGameMessageChallenge>(EventNames.challenge),
        sendChallengeResponse:
            channel.makeSender<IGamemessageChallengeResponse>(EventNames.challengeResponse),
        sendPlayerReady:
            channel.makeSender<IGameMessagePlayerReady>(EventNames.ready),
    };
}
