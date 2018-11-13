type ISubscription = (...args: any[]) => void;

interface IDictionary {
    [name: string]: ISubscription[];
}

const registry: IDictionary = {
};

export const Pub = (name: string, ...args: any[]) => {
    if (!registry[name]) { return; }
    registry[name].forEach((x) => {
        x.apply(null, args);
    });
};

export const Sub = (name: string, fn: ISubscription) => {
    if (!registry[name]) {
        registry[name] = [fn];
    } else {
        registry[name].push(fn);
    }
};

export const Unsub = (name: string, fn: ISubscription) => {
    const list = registry[name];
    if (!list) {
        return;
    }

    const idx = list.indexOf(fn);
    if (idx !== -1) {
        list.splice(idx, 1);
    }
    if (!list.length) {
        delete registry[name];
    }
};

export const UnsubAll = () => {
    Object.keys(registry).forEach((key) => delete registry[key]);
};
