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

        const makeKeyName = (id: string, name: string) => `${id}:${name}`;
        const makeKeyName2 = (id: string, name: string) => `T:${id}:${name}`;

        const makeReceiver = <T extends {}>(name: string) => {
            return (fn: INetworkPubSubSubscriptionT<T>) => {
                subT<T>(name, fn);
            };
        };

        const makeSender = <T extends {}>(name: string) => {
            return (arg: T) => {
                pubT(name, arg);
            };
        };

        const republishT = <T extends {}>(name: string, arg: T) => {
            const key = makeKeyName2(receiverPrefix, name);
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

        const republish = (name: string, arg: any) => {
            const key = makeKeyName(receiverPrefix, name);
            if (enableLogging) { console.log("Publish to " + key); }
            if (!registry[key]) { return; }
            registry[key].forEach((x) => {
                setTimeout(() => {
                    x.call(null, arg);
                });
            }, 1);
        };

        const pub = async <T>(name: string, arg: any) => {
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

        getOffset().then((offset) => {
            ref.orderByChild("timestamp").startAt(Date.now() + offset).on("child_added", (snap) => {
                if (snap && snap.key) {
                    const val = snap.val() as IFirebasePush;
                    if (val.target === target) {
                        republish(val.name, val.arg);
                        republishT(val.name, val.arg);
                    }
                }
            });
        });

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

    return {
        DEBUGremoveAll,
        connect,
        getUniqueTrigger,
    };
}
