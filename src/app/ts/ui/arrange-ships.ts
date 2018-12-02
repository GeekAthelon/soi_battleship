import SVG from "svgjs";
import { range } from "../../lib/range";
import * as battleShip from "../battleship";
import { IGameStatus, IPoint, STATE } from "../main";
import * as render from "./render";
import { $, calculateGridData, display } from "./render-utils";

export function processShipyard(
    gameData: IGameData,
) {
    const targetElement = document.querySelector(".js-shipyard") as HTMLElement;
    targetElement.innerHTML = "";

    const gridInfo = calculateGridData(gameData);

    const draw = SVG(targetElement).size(gridInfo.width, gridInfo.height);
    draw.viewbox(0, 0, gridInfo.width, gridInfo.height);

    display($(".js-shipyard"), "");
    render.renderTargetBoard(gameData, gameData.data.targetBoard, undefined, undefined);

    const renderShipYard = (dir: shipDirection) => {
        const newStatus = gameData.startGameData.shipData.map((ship, idx) => {
            if (dir === "h") {
                const hstatus: IShipStatus = {
                    hitPoints: ship.size,
                    shipDirection: "h",
                    x: gameData.startGameData.boardWidth - 1,
                    y: idx,
                };

                return hstatus;

            }

            const vstatus: IShipStatus = {
                hitPoints: ship.size,
                shipDirection: "v",
                x: idx,
                y: gameData.startGameData.boardHeight - 1,
            };

            return vstatus;
        });

        render.renderShips(
            newStatus,
            gameData.startGameData.shipData,
            gridInfo.gridSize,
            draw,
        );
    };

    renderShipYard("v");
}
