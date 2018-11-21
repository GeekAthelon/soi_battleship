type INetworkPubSubSubscription = (arg: any) => void;
type INetworkPubSubSubscriptionT<T> = (arg: T) => void;

type NetWorkPubSubSender = <T extends {}>(name: string) => (arg: T) => void;
type NetworkPubSubReceiver = <T extends {}>(name: string) =>
    (fn: INetworkPubSubSubscriptionT<T>) => void;

type NetWorkSender = <T extends {}>(arg: T) => void;

interface INetworkChannel {
    pubT: <T extends {}>(id: string, arg: T) => void;
    subT: <T extends {}> (name: string, fn: INetworkPubSubSubscriptionT<T>, once?: boolean) => void;
    makeReceiver: NetworkPubSubReceiver;
    makeOnceReceiver: NetworkPubSubReceiver;
    makeSender: NetWorkPubSubSender;
}

interface INetworkPubSub {
    getUniqueTrigger: () => string;
    DEBUGremoveAll: () => void;
    connect: (source: string, target: string) => INetworkChannel;
}
