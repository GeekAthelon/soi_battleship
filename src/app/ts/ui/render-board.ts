import SVG from "svgjs";
import { range } from "../../lib/range";
import * as battleShip from "../battleship";
import { IGameStatus } from "../main";

interface INodePrettyPrint {
    id: number;
    color: string;
}

const nodePrettyPrint: INodePrettyPrint[] = [
    { id: 0, color: "green" },
    { id: 1, color: "grey" },
    { id: 2, color: "yellow" },
    { id: 3, color: "orange" },
    { id: 4, color: "purple" },
    { id: battleShip.BoardCellType.water, color: "black" },
    { id: battleShip.BoardCellType.miss, color: "white" },
    { id: battleShip.BoardCellType.hit, color: "red" },
];
const def: INodePrettyPrint = { id: -1, color: "white" };

function $(selector: string) {
    return document.querySelector(selector) as HTMLElement;
}

function display(e: HTMLElement, mode: string) {
    e.style.display = mode;
}

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

function renderShipBoard(
    height: number,
    width: number,
    gridSize: number,
    gameData: IGameData,
    board: number[][],
    targetElement: HTMLElement) {

    const draw = SVG(targetElement).size(width, height);
    draw.viewbox(0, 0, width, height);

    renderGrid(gameData, board, gridSize, draw);
    renderShips(gameData, board, gridSize, draw);
    renderPegs(gameData, board, gridSize, draw);
}

function renderTargetBoard(
    height: number,
    width: number,
    gridSize: number,
    gameData: IGameData,
    board: number[][],
    targetElement: HTMLElement) {

    const draw = SVG(targetElement).size(width, height);
    draw.viewbox(0, 0, width, height);

    renderGrid(gameData, board, gridSize, draw);
    renderPegs(gameData, board, gridSize, draw);
}

function renderGrids(gameData: IGameData) {
    const targetElement = document.querySelector(".js-target-board") as HTMLElement;
    const shipElemnet = document.querySelector(".js-ship-board") as HTMLElement;

    targetElement.innerHTML = "";
    shipElemnet.innerHTML = "";

    (() => {
        if (window.screen.width) {
            const setViewport = {
                // bigger ones, be sure to set width to the needed and likely hardcoded width
                // of your site at large breakpoints
                other: "width=1045,user-scalable=yes",
                // smaller devices
                phone: "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no",
                // current browser width
                widthDevice: window.screen.width,
                // your css breakpoint for mobile, etc. non-mobile first
                widthMin: 560,
                // add the tag based on above vars and environment
                setMeta() {
                    const params = (this.widthDevice <= this.widthMin) ? this.phone : this.other;
                    const head = document.getElementsByTagName("head")[0];
                    const viewport = document.createElement("meta");
                    viewport.setAttribute("name", "viewport");
                    viewport.setAttribute("content", params);
                    head.appendChild(viewport);
                },
            };
            // call it
            setViewport.setMeta();
        }
    }).call(null);

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

    renderShipBoard(height, width, gridSize, gameData, gameData.data.shipBoard, shipElemnet);
    renderTargetBoard(height, width, gridSize, gameData, gameData.data.targetBoard, targetElement);
}

function showHidePlayerList(gameStatus: IGameStatus) {
    const mode = gameStatus.isPlaying ? "none" : "";
    [".js-playerlist", ".js-challengelist"].forEach((s) => display($(s), mode));
}

export function waitForPlayerReady(gameData: IGameData, gameStatus: IGameStatus) {
    return new Promise<void>((resolve, reject) => {
        const done = () => {
            resolve();
        };

        setReadyStatus(gameData, gameStatus, done);
    });
}

export function setReadyStatus(
    gameData: IGameData | null,
    gameStatus: IGameStatus,
    callback?: () => void) {
    const playerNotReadyElement = $(".js-player-not-ready");
    const opponentNotReady = $(".js-opponent-not-ready");

    display(playerNotReadyElement, "none");
    display(opponentNotReady, "none");

    if (!gameStatus.isPlaying) {
        return;
    }
    display(playerNotReadyElement, "");

    if (!gameStatus.opponentReady) {
        display(opponentNotReady, "");
    }

    if (callback) {
        const readyButton = $(".js-ready-button");
        const callDone = () => {
            callback();
            readyButton.removeEventListener("click", callDone);
        };

        readyButton.addEventListener("click", callDone);
    }
}

export function renderGame(gameData: IGameData | null, gameStatus: IGameStatus) {
    if (gameData) {
        renderGrids(gameData);
    }
    showHidePlayerList(gameStatus);
}
