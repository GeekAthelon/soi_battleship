import SVG from "svgjs";
import { range } from "../../lib/range";
import * as battleShip from "../battleship";
import { IGameStatus, IPoint, STATE } from "../main";
import { $, calculateGridData, display } from "./render-utils";

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

function renderGrid(gameData: IGameData, board: number[][], gridSize: number, draw: SVG.Doc) {
    for (const y of range(0, gameData.startGameData.boardHeight - 1)) {
        for (const x of range(0, gameData.startGameData.boardWidth - 1)) {
            const cell = board[x][y];
            const fmt = nodePrettyPrint.filter((p) => p.id === cell)[0] || def;

            const px = gridSize * x;
            const py = gridSize * y;

            const r = draw.rect(gridSize, gridSize)
                .stroke("white")
                .move(px, py);
        }
    }
}

function renderTargetingOverlay(
    gameData: IGameData,
    board: number[][],
    gridSize: number,
    draw: SVG.Doc,
    cb: (point: IPoint) => void,
) {
    for (const y of range(0, gameData.startGameData.boardHeight - 1)) {
        for (const x of range(0, gameData.startGameData.boardWidth - 1)) {
            const cell = board[x][y];
            const fmt = nodePrettyPrint.filter((p) => p.id === cell)[0] || def;

            const px = gridSize * x;
            const py = gridSize * y;

            const r = draw.rect(gridSize, gridSize)
                .stroke("white")
                .fill("#f03")
                .opacity(0)
                .move(px, py);

            r.on("mouseover", () => {
                r.attr({ opacity: "1" });
            });

            r.on("mouseout", () => {
                r.attr({ opacity: "0" });
            });

            r.on("click", () => {
                cb({ x, y });
            });

        }
    }
}

export function renderShips(
    shipStatus: IShipStatus[],
    shipData: IShipData[],
    gridSize: number,
    draw: SVG.Doc,
) {
    const svgs = shipStatus.map((ship, idx) => {
        const fmt = nodePrettyPrint.filter((p) => p.id === idx)[0] || def;
        const shipSize = shipData[idx].size;
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

        const rect = draw.rect(l, h)
            .stroke(fmt.color)
            .fill({ color: fmt.color, opacity: 1 })
            .radius(gridSize)
            .move(px + ox, py + oy);

        return rect;
    });

    return svgs;
}

function renderPegs(
    gameData: IGameData,
    board: number[][],
    gridSize: number,
    draw: SVG.Doc,
    lastPoint?: IPoint,
) {
    for (const y of range(0, gameData.startGameData.boardHeight - 1)) {
        for (const x of range(0, gameData.startGameData.boardWidth - 1)) {
            const cell = board[x][y];
            const fmt = nodePrettyPrint.filter((p) => p.id === cell)[0] || def;

            const px = gridSize * x;
            const py = gridSize * y;

            const drawCircle = (color: string) => {
                return draw.circle(gridSize * .5)
                    .fill(color)
                    .center(px + (gridSize / 2), py + (gridSize / 2));
            };

            const blink = () => {
                const c = drawCircle(fmt.color);

                c.animate(200, ">", 100).attr({ fill: fmt.color }).after(() => {
                    c.remove();
                    setTimeout(blink, 100);
                });
            };

            if (lastPoint && x === lastPoint.x && y === lastPoint.y) {
                blink();
            } else {
                drawCircle(fmt.color);
            }
        }
    }
}

export function renderShipBoard(
    gameData: IGameData,
    board: number[][],
    lastPoint?: IPoint,
) {
    const targetElement = document.querySelector(".js-ship-board") as HTMLElement;
    targetElement.innerHTML = "";

    const gridInfo = calculateGridData(gameData);

    const draw = SVG(targetElement).size(gridInfo.width, gridInfo.height);
    draw.viewbox(0, 0, gridInfo.width, gridInfo.height);

    renderGrid(gameData, board, gridInfo.gridSize, draw);
    renderShips(
        gameData.data.shipStatus,
        gameData.startGameData.shipData,
        gridInfo.gridSize,
        draw,
    );

    renderPegs(gameData, board, gridInfo.gridSize, draw, lastPoint);
}

export function renderTargetBoard(
    gameData: IGameData,
    board: number[][],
    lastPoint?: IPoint,
    cb?: (p: IPoint) => void,
) {
    const targetElement = document.querySelector(".js-target-board") as HTMLElement;
    targetElement.innerHTML = "";

    const gridInfo = calculateGridData(gameData);

    const draw = SVG(targetElement).size(gridInfo.width, gridInfo.height);
    draw.viewbox(0, 0, gridInfo.width, gridInfo.height);

    renderGrid(gameData, board, gridInfo.gridSize, draw);
    renderPegs(gameData, board, gridInfo.gridSize, draw, lastPoint);
    if (cb) {
        renderTargetingOverlay(gameData, board, gridInfo.gridSize, draw, cb);
    }
}

export function renderGrids(
    gameData: IGameData,
    lastPointAttacker?: IPoint,
    lastPointAttackee?: IPoint,
    cb?: (p: IPoint) => void,
) {
    renderShipBoard(gameData, gameData.data.shipBoard, lastPointAttackee);
    renderTargetBoard(gameData, gameData.data.targetBoard, lastPointAttacker, cb);
}

export function showHidePlayerList(gameStatus: IGameStatus) {
    const mode = gameStatus.isPlaying ? "none" : "";
    [".js-playerlist", ".js-challengelist"].forEach((s) => display($(s), mode));
}

export function setTargettingMessages(gameData: IGameData, gameStatus: IGameStatus) {
    const targetting = $(".js-targetting");
    const targetted = $(".js-targetted");

    display(targetted, gameStatus.state === STATE.TARGETTED ? "" : "none");
    display(targetting, gameStatus.state === STATE.TARGETTING ? "" : "none");
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
    if (!gameStatus.playerReady) {
        display(playerNotReadyElement, "");
    }

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
