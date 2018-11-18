export interface IPlayerInfo {
    id: string;
    name: string;
    callback?: (opponent: IPlayerInfo) => void;
}

const comparePlayerInfo = (a: IPlayerInfo, b: IPlayerInfo) => {
    if (a.name === b.name) {
        return 0;
    } else if (a.name > b.name) {
        return 1;
    } else {
        return -1;
    }
};

const playerList: IPlayerInfo[] = [];

const refreshPlayerList = () => {
    const cleanList: IPlayerInfo[] = [];

    playerList.forEach((player) => {
        const innerList = cleanList.filter((p) => p.name === player.name);

        if (innerList.length === 0) {
            cleanList.push(player);
        }
    });

    cleanList.sort(comparePlayerInfo);
    const ul = document.querySelector(".js-playerlist") as HTMLUListElement;

    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }

    cleanList.forEach((player) => {
        const button = document.createElement("button");
        const li = document.createElement("li");
        const innerList = playerList.filter((p) => p.name === player.name);

        li.dataset.playerName = player.name;
        li.dataset.PlayerId = player.id;
        li.textContent = `${player.name} [${player.id}] x${innerList.length}`;

        button.type = "button";
        button.textContent = "challenge";
        button.addEventListener("click", () => player.callback!(player));

        li.appendChild(button);
        ul.appendChild(li);
    });
};

export function addPlayer(playerInfo: IPlayerInfo, callback: (opponent: IPlayerInfo) => void) {
    playerInfo.callback = callback;
    playerList.push(playerInfo);
    refreshPlayerList();
}

export function removePlayer(playerInfo: IPlayerInfo) {
    let deleteIdx = -1;
    playerList.forEach((p, idx) => {
        if (p.id === playerInfo.id && p.name === playerInfo.name) {
            deleteIdx = idx;
        }
    });

    if (deleteIdx !== -1) {
        playerList.splice(deleteIdx, 1);
    }
    refreshPlayerList();
}
