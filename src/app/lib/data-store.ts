interface IDictionary {
    [name: string]: IGameData;
}

const registry: IDictionary = {};

export async function save(id: string, data: IGameData) {
    registry[id] = data;
}

export async function load(id: string) {
    return registry[id];
}

export async function erase(id: string) {
    delete registry[id];
}
