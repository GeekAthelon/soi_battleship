import SVG from "svgjs";
import { range } from "../../lib/range";
import * as battleShip from "../battleship";
import { IGameStatus, IPoint, STATE } from "../main";
import * as render from "./render";
import { $, calculateGridData, display } from "./render-utils";

const targetElement = document.querySelector(".js-shipyard") as HTMLElement;
const commandsElement = $(".js-shipyard-commands");

export function hideShipYard() {
    display(targetElement, "none");
    display(commandsElement, "none");
}

export function processShipyard(
    gameData: IGameData,
) {
    const renderShipYard = (dir: shipDirection) => {
        targetElement.innerHTML = "";
        display(targetElement, "");

        const gridInfo = calculateGridData(gameData);

        const draw = SVG(targetElement).size(gridInfo.width, gridInfo.height);
        draw.viewbox(0, 0, gridInfo.width, gridInfo.height);

        render.renderShipBoard(gameData, gameData.data.shipBoard);

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

        const nextDirection = dir === "h" ? "v" : "h";
        const button = document.createElement("button");
        button.innerText = "Rotate";
        button.addEventListener("click", () => renderShipYard(nextDirection));

        display(commandsElement, "");
        commandsElement.innerHTML = "";
        commandsElement.appendChild(button);
    };

    renderShipYard("v");
}
