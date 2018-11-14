// This code uses a two-part key
// the 'ID' and the 'Name'.
//
// The unit tests start two instances of the game to make a two-player gamme.
// the ID makes sure that messages are routed to the correct place.
//
// I made the ID separate so that constant values could be used for
// the name.

type ISubscription = (...args: any[]) => void;

interface IDictionary {
    [name: string]: ISubscription[];
}

const registry: IDictionary = {
};

const makeKeyName = (id: string, name: string) => `${id}:${name}`;

export const Pub = (id: string, name: string, ...args: any[]) => {
    const key = makeKeyName(id, name);
    if (!registry[key]) { return; }
    registry[key].forEach((x) => {
        x.apply(null, args);
    });
};

export const Sub = (id: string, name: string, fn: ISubscription) => {
    const key = makeKeyName(id, name);
    if (!registry[key]) {
        registry[key] = [fn];
    } else {
        registry[key].push(fn);
    }
};

export const Unsub = (id: string, name: string, fn: ISubscription) => {
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

export const UnsubAll = () => {
    Object.keys(registry).forEach((key) => delete registry[key]);
};
