export function $(selector: string) {
    return document.querySelector(selector) as HTMLElement;
}

export function display(e: HTMLElement, mode: string) {
    e.style.display = mode;
}

export const calculateGridData = (gameData: IGameData) => {
    const w = Math.max(document.documentElement!.clientWidth, window.innerWidth || 0);
    const h = Math.max(document.documentElement!.clientHeight, window.innerHeight || 0);

    const smallestDim = Math.min(w * .45, h);

    const width = smallestDim;
    const height = smallestDim;
    const t1 = Math.max(
        gameData.startGameData.boardHeight,
        gameData.startGameData.boardWidth,
    );

    const t2 = Math.min(height, width);

    const gridSize = Math.floor(t2 / t1);
    return { height, width, gridSize };
};
