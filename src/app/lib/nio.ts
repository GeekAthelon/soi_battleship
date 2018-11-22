const EventNames = {
    attack: "attack",
    attackResponse: "attack-response",
    challenge: "challenge",
    challengeResponse: "challenge-response",
    ping: "ping",
};

export interface Inio {
    attackReceiverP: () => Promise<IGameMessageAttack>;
    attackReplySender: (arg: IGameMessageAttackResponse) => void;
    attackResponseP: () => Promise<IGameMessageAttackResponse>;
    attackResponseReceiverP: () => Promise<IGameMessageAttackResponse>;
    attackSender: (arg: IGameMessageAttack) => void;
    challengeReceiverP: () => Promise<IGameMessageChallenge>;
    challengeReponseReceiverP: () => Promise<IGamemessageChallengeResponse>;
    challengeReponseSender: (arg: IGamemessageChallengeResponse) => void;
    challengeSender: (arg: IGameMessageChallenge) => void;

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
        attackReceiverP:
            () => promisify<IGameMessageAttack>(EventNames.attack),
        attackReplySender:
            channel.makeSender<IGameMessageAttackResponse>(EventNames.attackResponse),
        attackResponseP:
            () => promisify<IGameMessageAttackResponse>(EventNames.attackResponse),
        attackResponseReceiverP:
            () => promisify<IGameMessageAttackResponse>(EventNames.attackResponse),
        attackSender:
            channel.makeSender<IGameMessageAttack>(EventNames.attack),
        challengeReceiverP:
            () => promisify<IGameMessageChallenge>(EventNames.challenge),
        challengeReponseReceiverP:
            () => promisify<IGamemessageChallengeResponse>(EventNames.challengeResponse),
        challengeReponseSender:
            channel.makeSender<IGamemessageChallengeResponse>(EventNames.challengeResponse),
        challengeSender:
            channel.makeSender<IGameMessageChallenge>(EventNames.challenge),
    };
}
