const ZMessageTypes = {
    attack: "ATTACK",
    attackResponse: "attack-response",
    challenge: "challenge",
    challengeResponse: "challenge-response",
    ping: "ping",
};

export function init(channel: INetworkChannel) {
    const promisify = <T>(messageType: string) => {
        return new Promise<T>((resolve, reject) => {
            channel.makeOnceReceiver<T>(messageType)((arg: T) => {
                resolve(arg);
            });
        });
    };

    return {
        attackReceiverP:
            () => promisify<IGameMessageAttack>(ZMessageTypes.attack),
        attackReplySender:
            channel.makeSender<IGameMessageAttackResponse>(ZMessageTypes.attackResponse),
        attackResponseP:
            () => promisify<IGameMessageAttackResponse>(ZMessageTypes.attackResponse),
        attackResponseReceiverP:
            () => promisify<IGameMessageAttackResponse>(ZMessageTypes.attackResponse),
        attackSender:
            channel.makeSender<IGameMessageAttack>(ZMessageTypes.attack),
        challengeReceiverP:
            () => promisify<IGameMessageChallenge>(ZMessageTypes.challenge),
        challengeReponseReceiverP:
            () => promisify<IGamemessageChallengeResponse>(ZMessageTypes.challengeResponse),
        challengeReponseSender:
            channel.makeSender<IGamemessageChallengeResponse>(ZMessageTypes.challengeResponse),
        challengeSender:
            channel.makeSender<IGameMessageChallenge>(ZMessageTypes.challenge),
    };
}
