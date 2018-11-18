// tslint:disable:no-console

interface IDictionary {
    [name: string]: INetworkPubSubSubscription[];
}

const registry: IDictionary = {};

let uniqueTriggerValue = 0;

export function getUniqueTrigger() {
    uniqueTriggerValue++;
    return `Trigger:${uniqueTriggerValue}`;
}

export const DEBUGremoveAll = () => {
    Object.keys(registry).forEach((key) => delete registry[key]);
};

export function connect(source: string, target: string): INetworkPubSub {
    const enableLogging = false;
    const senderPrefix = `${source}:${target}:`;
    const receiverPrefix = `${target}:${source}:`;

    const makeKeyName = (id: string, name: string) => `${id}:${name}`;
    const makeKeyName2 = (id: string, name: string) => `T:${id}:${name}`;

    const makeReceiver = <T extends {}>(name: string) => {
        return (fn: INetworkPubSubSubscriptionT<T>) => {
            subT<T>(name, fn);
        };
    };

    const makeSender = <T extends {}>(name: string) => {
        return (arg: T) => {
            pubT<T>(name, arg);
        };
    };

    const pubT = <T extends {}>(name: string, arg: T) => {
        const key = makeKeyName2(senderPrefix, name);
        if (!registry[key]) { return; }
        registry[key].forEach((x) => {
            setTimeout(() => {
                x.call(null, arg);
            });
        }, 1);
    };

    const subT = <T extends {}>(name: string, fn: INetworkPubSubSubscriptionT<T>) => {
        const key = makeKeyName2(receiverPrefix, name);
        if (enableLogging) { console.log("Subscribing to " + key); }
        if (!registry[key]) {
            registry[key] = [fn];
        } else {
            registry[key].push(fn);
        }
    };

    const pub = (name: string, arg: any) => {
        const key = makeKeyName(senderPrefix, name);
        if (enableLogging) { console.log("Publish to " + key); }
        if (!registry[key]) { return; }
        registry[key].forEach((x) => {
            setTimeout(() => {
                x.call(null, arg);
            });
        }, 1);
    };

    const sub = (name: string, fn: INetworkPubSubSubscription) => {
        const key = makeKeyName(receiverPrefix, name);
        if (enableLogging) { console.log("Subscribing to " + key); }
        if (!registry[key]) {
            registry[key] = [fn];
        } else {
            registry[key].push(fn);
        }
    };

    const unsub = (name: string, fn: INetworkPubSubSubscription) => {
        const key = makeKeyName(receiverPrefix, name);
        const list = registry[key];
        if (!list) {
            return;
        }

        const idx = list.indexOf(fn);
        if (idx !== -1) {
            list.splice(idx, 1);
        }
        if (!list.length) {
            delete registry[key];
        }
    };

    return {
        makeReceiver,
        makeSender,
        pub,
        pubT,
        sub,
        subT,
        unsub,
    };
}
