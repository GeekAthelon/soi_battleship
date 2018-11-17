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

export function connect(source: string, target: string): INetworkPubSub {
    const enableLogging = false;
    const senderPrefix = `${source}:${target}:`;
    const receiverPrefix = `${target}:${source}:`;

    const makeKeyName = (id: string, name: string) => `${id}:${name}`;

    const pub = (name: string, arg: any) => {
        const key = makeKeyName(senderPrefix, name);
        if (enableLogging) { console.log("Publish to " + key); }
        if (!registry[key]) { return; }
        registry[key].forEach((x) => {
            setTimeout(() => {
                x.call(null, arg);
            });

        }, 20);
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
        pub,
        sub,
        unsub,
    };
}
