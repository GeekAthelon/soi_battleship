import * as dataStore from "../lib/data-store";
import { range } from "../lib/range";
import * as interui from "../lib/ui-pub-sub";
import { ZMessageTypes } from "./constants";
import * as IMessage from "./imessages";

export enum BoardCellType {
    // Numbers below 100 are for ships
    water = 100,
    ship = 101,
    hit = 102,
    miss = 103,
}

const generateBoard = (startGameData: IStartGameData) => {
    const board: number[][] = [];
    for (const x of range(0, startGameData.boardWidth - 1)) {
        board[x] = [];

        for (const y of range(0, startGameData.boardHeight - 1)) {
            board[x][y] = BoardCellType.water;
        }
    }
    return board;
};

export function tryPlaceShip(
    shipData: IShipData[],
    shipStatus: IShipStatus,
    shipNumber: number,
    x: number,
    y: number,
    direction: shipDirection,
    board: number[][]): boolean {

    const xRange = direction === "h" ? range(x, x + shipData[shipNumber].size - 1) : range(x, x);
    const yRange = direction === "v" ? range(y, y + shipData[shipNumber].size - 1) : range(y, y);

    for (x of xRange) {
        for (y of yRange) {
            if (!board[x]) {
                return false;
            }
            if (board[x][y] !== BoardCellType.water) {
                return false;
            }
        }
    }

    for (x of xRange) {
        for (y of yRange) {
            board[x][y] = shipNumber;
        }
    }

    shipStatus.x = x;
    shipStatus.y = y;
    shipStatus.shipDirection = direction;

    return true;
}

export function randomizeShips(gameData: IGameData) {
    function getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    let retryCount = 50;

    gameData.data.shipBoard = generateBoard(gameData.startGameData);

    gameData.startGameData.shipData.forEach((ship, idx) => {
        let isValid = false;
        while (!isValid) {
            retryCount--;
            if (retryCount === 0) {
                throw new Error("Unable to place ships");
            }

            const x = getRandomInt(0, gameData.startGameData.boardWidth);
            const y = getRandomInt(0, gameData.startGameData.boardHeight);
            const p: shipDirection = getRandomInt(0, 1) === 0 ? "h" : "v";

            isValid = tryPlaceShip(gameData.startGameData.shipData, gameData.data.shipStatus[idx],
                idx, x, y, p, gameData.data.shipBoard);
        }
    });
}

async function processAttackResponse(gameData: IGameData, gameMessage: IGameMessageAttackResponse) {
    if (!gameMessage.isSuccess) {
        return;
    }

    const cellValue = gameMessage.isHit ? BoardCellType.hit : BoardCellType.miss;
    gameData.data.targetBoard[gameMessage.x][gameMessage.y] = cellValue;
}

export async function processAttack(
    gameData: IGameData,
    gameMessage: IGameMessageAttack,
    player: IPlayerInfo,
    opponent: IPlayerInfo,
) {

    const cell = gameData.data.shipBoard[gameMessage.x] && gameData.data.shipBoard[gameMessage.x][gameMessage.y];

    const responseMessage: IGameMessageAttackResponse = {
        isHit: false,
        isSink: false,
        isSuccess: false,
        playerTurn: opponent.id,
        sunkShip: undefined,
        x: gameMessage.x,
        y: gameMessage.y,
    };

    if (cell < gameData.startGameData.shipData.length) {
        responseMessage.isSuccess = true;
        responseMessage.isHit = true;
        responseMessage.playerTurn = player.id;
        gameData.data.shipStatus[cell].hitPoints--;
        responseMessage.isSink = gameData.data.shipStatus[cell].hitPoints === 0;
        responseMessage.sunkShip = responseMessage.isSink ? cell : undefined;

        gameData.data.shipBoard[gameMessage.x][gameMessage.y] = BoardCellType.hit;
    } else if (cell === BoardCellType.water) {
        responseMessage.isSuccess = true;
        responseMessage.playerTurn = player.id;

        gameData.data.shipBoard[gameMessage.x][gameMessage.y] = BoardCellType.miss;
    } else {
        // Either hit a targetted spot alreada
        // Or, hit outside the game area
    }
    return responseMessage;
}

function sendUpateUI(gameData: IGameData, gameMessage: IGameMessageAttack, player: IPlayerInfo, opponent: IPlayerInfo) {
    const updateUiMessage: IMessage.IMsgUpdateUI = {
        gameData,
        id: "update-ui",
        sourcePlayerId: player.id,
        targetPlayerId: opponent.id,
    };
    interui.Pub(gameData.id, interui.MSG.UPDATE_UI, updateUiMessage);
}

export function initGame(startGameData: IStartGameData, networkChannel: INetworkChannel, playerID: string) {
    const shipStatus: IShipStatus[] = startGameData.shipData.map((s) => ({
        hitPoints: s.size,
        shipDirection: "y" as shipDirection,
        x: 0,
        y: 0,
    }));

    const gameData: IGameData = {
        data: {
            shipBoard: generateBoard(startGameData),
            shipStatus,
            targetBoard: generateBoard(startGameData),
        },
        id: playerID,
        startGameData,
    };

    const player = gameData.startGameData.playerList.filter((p) => p.id === playerID)[0];
    const opponent = gameData.startGameData.playerList.filter((p) => p.id !== playerID)[0];

    const attackReceiver = networkChannel.makeReceiver<IGameMessageAttack>
        (ZMessageTypes.attack);

    const attackResponseReceiver = networkChannel.makeReceiver<IGameMessageAttackResponse>
        (ZMessageTypes.attackResponse);

    attackResponseReceiver(async (gameMessage) => {
        const currentGameData = await dataStore.load(playerID);
        processAttackResponse(currentGameData, gameMessage);

        sendUpateUI(currentGameData, gameMessage, player, opponent);
        await dataStore.save(playerID, currentGameData);
    });

    attackReceiver(async (gameMessage) => {
        const attackReplySender = networkChannel.makeSender<IGameMessageAttackResponse>(ZMessageTypes.attackResponse);

        const currentGameData = await dataStore.load(playerID);
        const responseMessage = await processAttack(currentGameData, gameMessage, player, opponent);

        attackReplySender(responseMessage);

        await dataStore.save(playerID, currentGameData);
        sendUpateUI(currentGameData, gameMessage, player, opponent);
    });

    return gameData;
}
