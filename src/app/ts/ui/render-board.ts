import SVG from "svgjs";
import { range } from "../../lib/range";
import * as battleShip from "../battleship";

interface INodePrettyPrint {
    id: number;
    color: string;
    symbol: string;
}

const nodePrettyPrint: INodePrettyPrint[] = [
    { id: 0, color: "green", symbol: "o" },
    { id: 1, color: "grey", symbol: "o" },
    { id: 2, color: "yellow", symbol: "o" },
    { id: 3, color: "orange", symbol: "o" },
    { id: 4, color: "purple", symbol: "o" },
    { id: battleShip.BoardCellType.water, color: "cyan", symbol: "~" },
    { id: battleShip.BoardCellType.miss, color: "white", symbol: "o" },
    { id: battleShip.BoardCellType.hit, color: "red", symbol: "x" },
];
const def: INodePrettyPrint = { id: -1, color: "white", symbol: "?" };


function renderOne(gameData: IGameData, board: number[][], targetElement: HTMLElement) {
    // define document width and height
    const width = 450;
    const height = 300;

    const t1 = Math.max(
        gameData.startGameData.boardHeight,
        gameData.startGameData.boardWidth,
    );

    const t2 = Math.min(height, width);

    const gridSize = Math.floor(t2 / t1);

    // create SVG document and set its size
    const draw = SVG(targetElement).size(width, height);
    draw.viewbox(0, 0, width, height);


    for (const y of range(0, gameData.startGameData.boardHeight - 1)) {
        for (const x of range(0, gameData.startGameData.boardWidth - 1)) {
            const cell = board[x][y];
            const fmt = nodePrettyPrint.filter((p) => p.id === cell)[0] || def;

            const px = gridSize * x;
            const py = gridSize * y;

            draw.rect(gridSize, gridSize)
                .stroke("white")
                .move(px, py);

            draw.circle(gridSize * .5)
                .fill(fmt.color)
                .center(px + (gridSize / 2), py + (gridSize / 2));
        }
    }
}

export function renderBoard(gameData: IGameData) {
    const targetElement = document.querySelector(".js-target-board") as HTMLElement;
    const shipElemnet = document.querySelector(".js-ship-board") as HTMLElement;

    renderOne(gameData, gameData.data.shipBoard, shipElemnet);
}
