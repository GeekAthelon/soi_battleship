type INetworkPubSubSubscription = (arg: any) => void;
type INetworkPubSubSubscriptionT<T> = (arg: T) => void;

type NetWorkPubSubSender = <T extends {}>(name: string) => (arg: T) => void;
type NetworkPubSubReceiver = <T extends {}>(name: string) => (fn: INetworkPubSubSubscriptionT<T>) => void;

type NetWorkSender = <T extends {}>(arg: T) => void;

interface INetworkPubSub {
    pub: (name: string, arg: any) => void;
    sub: (name: string, fn: INetworkPubSubSubscription) => void;
    unsub: (name: string, fn: INetworkPubSubSubscription) => void;
    pubT: <T extends {}>(id: string, arg: T) => void;
    subT: <T extends {}> (name: string, fn: INetworkPubSubSubscriptionT<T>) => void;
    makeReceiver: NetworkPubSubReceiver;
    makeSender: NetWorkPubSubSender;
}
