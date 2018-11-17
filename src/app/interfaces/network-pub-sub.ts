type INetworkPubSubSubscription = (arg: any) => void;
interface INetworkPubSub {
    pub: (name: string, arg: any) => void;
    sub: (name: string, fn: INetworkPubSubSubscription) => void;
    unsub: (name: string, fn: INetworkPubSubSubscription) => void;
}
