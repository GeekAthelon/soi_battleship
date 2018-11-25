// tslint:disable:no-console

interface IDictionary {
    [name: string]: INetworkPubSubSubscription[];
}

export function init(): INetworkPubSub {
    const registry: IDictionary = {};
    let uniqueTriggerValue = 0;

    function getUniqueTrigger() {
        uniqueTriggerValue++;
        return `Trigger:${uniqueTriggerValue}`;
    }

    const DEBUGremoveAll = () => {
        Object.keys(registry).forEach((key) => delete registry[key]);
    };

    function connect(source: string, target: string): INetworkChannel {
        const enableLogging = false;
        const senderPrefix = `${source}:${target}:`;
        const receiverPrefix = `${target}:${source}:`;
        const makeKeyName2 = (id: string, name: string, once: boolean) => `T:${id}:${name}:${!!once}`;

        const makeReceiver = <T extends {}>(name: string) => {
            return makeReceiver2<T>(name, false);
        };

        const makeOnceReceiver = <T extends {}>(name: string) => {
            return makeReceiver2<T>(name, true);
        };

        const makeReceiver2 = <T extends {}>(name: string, once: boolean) => {
            return (fn: INetworkPubSubSubscriptionT<T>) => {
                subT<T>(name, fn, once);
            };
        };

        const makeSender = <T extends {}>(name: string) => {
            return (arg: T) => {
                pubT<T>(name, arg);
            };
        };

        const pubT = <T extends {}>(name: string, arg: T) => {
            [true, false].forEach((flag) => {
                const key = makeKeyName2(senderPrefix, name, flag);
                const funcs = registry[key];
                if (!funcs) { return; }
                const cb = funcs.pop();
                if (!cb) { return; }
                cb.call(null, arg);

                if (flag) {
                    removeSub(key, cb);
                }

                pubT(name, arg);
            });
        };

        const subT = <T extends {}>(name: string, fn: INetworkPubSubSubscriptionT<T>, once?: boolean) => {
            const key = makeKeyName2(receiverPrefix, name, !!once);
            if (enableLogging) { console.log("Subscribing to " + key); }
            if (!registry[key]) {
                registry[key] = [fn];
            } else {
                registry[key].push(fn);
            }
        };

        const removeSub = (key: string, fn: INetworkPubSubSubscription) => {
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
            makeOnceReceiver,
            makeReceiver,
            makeSender,
            pubT,
            subT,
        };
    }
    return {
        DEBUGremoveAll,
        connect,
        getUniqueTrigger,
    };
}
