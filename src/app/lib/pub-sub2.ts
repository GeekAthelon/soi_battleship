// tslint:disable:no-console

// This code uses a two-part key
// the 'ID' and the 'Name'.
//
// The unit tests start two instances of the game to make a two-player gamme.
// the ID makes sure that messages are routed to the correct place.
//
// I made the ID separate so that constant values could be used for
// the name.

const enableLogging = false;
const makeKeyName = (id: string, name: string) => `${id}:${name}`;

type ISubscription = (...args: any[]) => void;

interface IDictionary {
    [name: string]: ISubscription[];
}

export const init = (() => {
    const registry: IDictionary = {
    };

    const Pub = (id: string, name: string, ...args: any[]) => {
        const key = makeKeyName(id, name);
        if (enableLogging) { console.log("Publish to " + key); }
        if (!registry[key]) { return; }
        registry[key].forEach((x) => {
            x.apply(null, args);
        });
    };

    const Sub = (id: string, name: string, fn: ISubscription) => {
        const key = makeKeyName(id, name);
        if (enableLogging) { console.log("Subscribing to " + key); }
        if (!registry[key]) {
            registry[key] = [fn];
        } else {
            registry[key].push(fn);
        }
    };

    const Unsub = (id: string, name: string, fn: ISubscription) => {
        const key = makeKeyName(id, name);
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

    const UnsubByName = (id: string, name: string) => {
        const key = makeKeyName(id, name);
        delete registry[key];
    };

    const UnsubAll = () => {
        Object.keys(registry).forEach((key) => delete registry[key]);
    };

    return {
        Pub,
        Sub,
        Unsub,
        UnsubAll,
        UnsubByName,
    };
});
