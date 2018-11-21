// tslint:disable:no-console
import firebase from "firebase/app";

interface IDictionary {
    [name: string]: INetworkPubSubSubscription[];
}

interface IFirebasePush {
    source: string;
    target: string;
    name: string;
    arg: string;
    timestamp: number;
}

export function init(db: firebase.database.Database): INetworkPubSub {
    const registry: IDictionary = {};
    let uniqueTriggerValue = 0;
    const ref = db.ref("mesages");
    let serverTimeOffset: number;

    const getOffset = () => {
        if (serverTimeOffset !== undefined) {
            return Promise.resolve(serverTimeOffset);
        }
        return new Promise<number>((resolve) => {
            const offsetRef = firebase.database().ref(".info/serverTimeOffset");
            offsetRef.on("value", (snap) => {
                serverTimeOffset = snap!.val();
                resolve(serverTimeOffset);
            });
        });
    };
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
                pubT(name, arg);
            };
        };

        const republishT = <T extends {}>(name: string, arg: T) => {
            [true, false].forEach((flag) => {
                const key = makeKeyName2(receiverPrefix, name, flag);
                const funcs = registry[key];
                if (!funcs) { return; }
                const cb = funcs.pop();
                if (!cb) { return; }

                if (flag) {
                    removeSub(key, cb);
                }

                cb.call(null, arg);
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

        const pubT = async (name: string, arg: any) => {
            const offset = await getOffset();
            const item: IFirebasePush = {
                arg,
                name,
                source,
                target,
                timestamp: new Date().getTime() + offset,
            };
            ref.push(item);
        };

        getOffset().then((offset) => {
            ref.orderByChild("timestamp").startAt(Date.now() + offset).on("child_added", (snap) => {
                if (snap && snap.key) {
                    const val = snap.val() as IFirebasePush;
                    if (val.target === target) {
                        republishT(val.name, val.arg);
                    }
                }
            });
        });

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
