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

function renderGrid(gameData: IGameData, board: number[][], gridSize: number, draw: SVG.Doc) {
    for (const y of range(0, gameData.startGameData.boardHeight - 1)) {
        for (const x of range(0, gameData.startGameData.boardWidth - 1)) {
            const cell = board[x][y];
            const fmt = nodePrettyPrint.filter((p) => p.id === cell)[0] || def;

            const px = gridSize * x;
            const py = gridSize * y;

            draw.rect(gridSize, gridSize)
                .stroke("white")
                .move(px, py)
                .click(() => {
                    alert("You clicked on the board");
                });
        }
    }
}

function renderShips(gameData: IGameData, board: number[][], gridSize: number, draw: SVG.Doc) {
    gameData.data.shipStatus.forEach((ship, idx) => {
        const fmt = nodePrettyPrint.filter((p) => p.id === idx)[0] || def;
        const shipSize = gameData.startGameData.shipData[idx].size;
        const shipThicknes = 0.55;

        let x1: number;
        let y1: number;

        if (ship.shipDirection === "h") {
            x1 = ship.x - shipSize + 1;
            y1 = ship.y;
        } else {
            x1 = ship.x;
            y1 = ship.y - shipSize + 1;
        }

        const px = gridSize * x1;
        const py = gridSize * y1;

        const l = ((ship.shipDirection === "h" ? shipSize : shipThicknes) * gridSize);
        const h = ((ship.shipDirection === "v" ? shipSize : shipThicknes) * gridSize);

        const thicknessOffset = (gridSize - (gridSize * shipThicknes)) / 2;
        const ox = ((ship.shipDirection === "h" ? 0 : thicknessOffset));
        const oy = ((ship.shipDirection === "v" ? 0 : thicknessOffset));

        draw.rect(l, h)
            .stroke(fmt.color)
            .fill({ color: fmt.color, opacity: 1 })
            .radius(gridSize)
            .move(px + ox, py + oy);
    });
}

function renderPegs(gameData: IGameData, board: number[][], gridSize: number, draw: SVG.Doc) {
    for (const y of range(0, gameData.startGameData.boardHeight - 1)) {
        for (const x of range(0, gameData.startGameData.boardWidth - 1)) {
            const cell = board[x][y];
            const fmt = nodePrettyPrint.filter((p) => p.id === cell)[0] || def;

            const px = gridSize * x;
            const py = gridSize * y;

            draw.circle(gridSize * .5)
                .fill(fmt.color)
                .center(px + (gridSize / 2), py + (gridSize / 2))
                .click(() => {
                    alert("You clicked on a peg");
                });
        }
    }
}

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

    renderGrid(gameData, board, gridSize, draw);
    renderShips(gameData, board, gridSize, draw);
    renderPegs(gameData, board, gridSize, draw);
}

export function renderBoard(gameData: IGameData) {
    const targetElement = document.querySelector(".js-target-board") as HTMLElement;
    const shipElemnet = document.querySelector(".js-ship-board") as HTMLElement;

    renderOne(gameData, gameData.data.shipBoard, shipElemnet);
}
