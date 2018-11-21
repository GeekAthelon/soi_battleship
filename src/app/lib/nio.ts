import { ZMessageTypes } from "../ts/constants";

export function init(channel: INetworkChannel) {

    const promisify = <T>(messageType: string) => {
        return new Promise<T>((resolve, reject) => {
            channel.makeOnceReceiver<T>(messageType)((arg: T) => {
                resolve(arg);
            });
        });
    };

    return {
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
