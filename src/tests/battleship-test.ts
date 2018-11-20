/* tslint:disable:only-arrow-functions */

import * as chai from "chai";
import * as dataStore from "../app/lib/data-store";
import { range } from "../app/lib/range";
import * as sameProcessPubSub from "../app/lib/same-process-pub-sub";
import { colors } from "../app/lib/terminal-colors";
import * as interui from "../app/lib/ui-pub-sub";
import * as battleShip from "../app/ts/battleship";
import { ZMessageTypes } from "../app/ts/constants";
import { IMsgUpdateUI } from "../app/ts/imessages";

const networkPubSub = sameProcessPubSub.init();

const assert = chai.assert;

export const boardToNodeString = (board: number[][], gameData: IGameData) => {
    interface INodePrettyPrint {
        id: number;
        color: string;
        symbol: string;
    }

    const nodePrettyPrint: INodePrettyPrint[] = [
        { id: 0, color: colors.FgGreen, symbol: "o" },
        { id: 1, color: colors.FgMagenta, symbol: "o" },
        { id: 2, color: colors.Bright + colors.FgGreen, symbol: "o" },
        { id: 3, color: colors.FgYellow, symbol: "o" },
        { id: 4, color: colors.Bright + colors.FgBlack, symbol: "o" },
        { id: battleShip.BoardCellType.water, color: colors.Bright + colors.FgBlack, symbol: "~" },
        { id: battleShip.BoardCellType.miss, color: colors.Bright + colors.FgWhite, symbol: "o" },
        { id: battleShip.BoardCellType.hit, color: colors.Bright + colors.FgRed, symbol: "x" },
    ];
    const def: INodePrettyPrint = { id: -1, color: colors.Bright + colors.FgWhite, symbol: "?" };

    let out = "";

    for (const y of range(0, gameData.startGameData.boardHeight - 1)) {
        for (const x of range(0, gameData.startGameData.boardWidth - 1)) {
            const cell = board[x][y];
            const fmt = nodePrettyPrint.find((p) => p.id === cell);
            if (fmt) {
                out += fmt.color + fmt.symbol;
            } else {
                out += def.color + `<${cell}>`;
            }
        }
        out += "\r\n";
    }

    out += colors.Reset;

    for (const i of range(1, board[0].length)) {
        out += "-";
    }
    return out;
};

describe("Main BattleShip Engine", function() {
    interface ITestLoop {
        x: number;
        y: number;
        direction: shipDirection;
        result: boolean;
    }

    const getStartGameData = () => {
        const startGameData: IStartGameData = {
            boardHeight: 10,
            boardWidth: 15,
            playerList: [
                { name: "Darth Vader", id: "dv" },
                { name: "Luke Skywalker", id: "sk" },
            ],
            shipData: [
                { name: "Carrier", size: 5 },
                { name: "Battleship", size: 4 },
                { name: "Cruiser", size: 3 },
                { name: "Submarine", size: 3 },
                { name: "Destroyer", size: 2 },
                { name: "One Hit Wonder", size: 1 },
            ],
        };
        return startGameData;
    };

    const testBoardValid = (board: number[][], gameData: IGameData, shouldContain: number = -1) => {
        assert.equal(board.length, gameData.startGameData.boardWidth, "Game Width");

        for (const line of board) {
            assert.equal(line.length, gameData.startGameData.boardHeight, "Game Height");

            for (const cell of line) {
                if (shouldContain !== -1) {
                    assert.strictEqual(shouldContain, cell);
                } else {
                    assert.notStrictEqual(undefined, cell, "Game cell");
                }
            }
        }
    };

    it("battleship object exists", function() {
        assert.ok(battleShip);
    });

    describe("testing battleship start game", function() {
        const testPlayerData = (player: IPlayer, gameData: IGameData) => {
            assert.ok(player.shipStatus.length);
            player.shipStatus.forEach((sp) => assert.ok(sp.hitPoints, "Ship hit points"));
            testBoardValid(player.shipBoard, gameData);
            testBoardValid(player.targetBoard, gameData);
        };

        it("player1 data is created", function() {
            const startGameData = getStartGameData();
            const networkChannel = networkPubSub.connect
                (startGameData.playerList[0].id, startGameData.playerList[1].id);

            const gameData = battleShip.initGame(startGameData, networkChannel, startGameData.playerList[0].id);

            assert.equal(startGameData.playerList[0].id, gameData.id);
            testPlayerData(gameData.data, gameData);
        });
    });

    describe("Testing tryPlaceShip", function() {
        describe("testing on empty board", function() {
            it("horizontal - exactly enough room for the ship", function() {
                const shipNumber = 0;
                const startGameData = getStartGameData();
                const networkChannel = networkPubSub.connect
                    (startGameData.playerList[0].id, startGameData.playerList[1].id);

                startGameData.boardHeight = 1;
                startGameData.boardWidth = startGameData.shipData[shipNumber].size;
                const gameData = battleShip.initGame(startGameData, networkChannel, startGameData.playerList[0].id);

                const isValid = battleShip.tryPlaceShip(
                    gameData.startGameData.shipData, shipNumber, 0, 0, "h", gameData.data.shipBoard);
                assert.ok(isValid, "isValid");
                testBoardValid(gameData.data.shipBoard, gameData, shipNumber);
            });
        });

        describe("testing on empty board", function() {
            it("vert - exactly enough room for the ship", function() {
                const shipNumber = 0;
                const startGameData = getStartGameData();
                const networkChannel = networkPubSub.connect
                    (startGameData.playerList[0].id, startGameData.playerList[1].id);

                startGameData.boardHeight = startGameData.shipData[shipNumber].size;
                startGameData.boardWidth = 1;
                const gameData = battleShip.initGame(startGameData, networkChannel, startGameData.playerList[0].id);

                const isValid = battleShip.tryPlaceShip(
                    gameData.startGameData.shipData, shipNumber, 0, 0, "v", gameData.data.shipBoard);
                assert.ok(isValid, "isValid");
                testBoardValid(gameData.data.shipBoard, gameData, shipNumber);
            });
        });

        describe("testing collisions", function() {
            it("ship hits the water", function() {
                const shipNumber = 0;
                const startGameData = getStartGameData();

                startGameData.boardHeight = startGameData.shipData[shipNumber].size;
                startGameData.boardWidth = startGameData.shipData[shipNumber].size;

                const tests: ITestLoop[] = [
                    { x: 0, y: 0, direction: "h", result: true },
                    { x: 0, y: 1, direction: "h", result: true },
                    { x: 0, y: -1, direction: "h", result: false },
                    { x: 1, y: 1, direction: "h", result: false },
                    { x: 1, y: 0, direction: "h", result: false },
                    { x: 1, y: -1, direction: "h", result: false },
                    { x: -1, y: 0, direction: "h", result: false },
                    { x: -1, y: 1, direction: "h", result: false },
                    { x: -1, y: -1, direction: "h", result: false },

                    { x: 0, y: 0, direction: "v", result: true },
                    { x: 0, y: 1, direction: "v", result: false },
                    { x: 0, y: -1, direction: "v", result: false },
                    { x: 1, y: 1, direction: "v", result: false },
                    { x: 1, y: 0, direction: "v", result: true },
                    { x: 1, y: -1, direction: "v", result: false },
                    { x: -1, y: 0, direction: "v", result: false },
                    { x: -1, y: 1, direction: "v", result: false },
                    { x: -1, y: -1, direction: "v", result: false },
                ];

                tests.forEach((t) => {
                    const networkChannel = networkPubSub.connect
                        (startGameData.playerList[0].id, startGameData.playerList[1].id);
                    const gameData = battleShip.initGame(startGameData, networkChannel, startGameData.playerList[0].id);

                    const { x, y, direction, result } = t;
                    const isValid = battleShip.tryPlaceShip(
                        gameData.startGameData.shipData, shipNumber, x, y, direction, gameData.data.shipBoard);

                    assert.equal(result, isValid, `isValid ${x}, ${y}:${result} [${isValid}]`);

                    if (result === false) {
                        testBoardValid(gameData.data.shipBoard, gameData, battleShip.BoardCellType.water);
                    } else {
                        testBoardValid(gameData.data.shipBoard, gameData);
                    }
                });
            });
        });

        describe("randomzing locations", function() {
            it("should place all ships", function() {
                for (const i of range(1, 20)) {
                    const startGameData = getStartGameData();
                    const networkChannel = networkPubSub.connect
                        (startGameData.playerList[0].id, startGameData.playerList[1].id);

                    const gameData = battleShip.initGame(startGameData, networkChannel, startGameData.playerList[0].id);
                    battleShip.randomizeShips(gameData);
                    testBoardValid(gameData.data.shipBoard, gameData);

                    const found = new Map();
                    for (const x of range(0, startGameData.boardWidth - 1)) {
                        for (const y of range(0, startGameData.boardHeight - 1)) {
                            const cell = gameData.data.shipBoard[x][y];
                            const counter = found.get(cell) || 0;
                            found.set(cell, counter + 1);
                        }
                    }

                    startGameData.shipData.forEach((ship, idx) => {
                        const counter = found.get(idx) || 0;
                        assert.equal(ship.size, counter, `Ship: ${ship.name} incomplete.`);
                    });
                }
            });
        });

        describe("Attacking", function() {
            const manuallyPlaceShips = (gameData: IGameData) => {
                for (let i = 0; i < gameData.startGameData.shipData.length; i++) {
                    const isValid = battleShip.tryPlaceShip(
                        gameData.startGameData.shipData, i, i * 2, 0, "v", gameData.data.shipBoard);
                    if (!isValid) {
                        throw new Error("Could not manually place ships.");
                    }
                }
            };

            const initGameTest = () => {
                return new Promise<IGameData[]>((resolve, reject) => {
                    const startGameData = getStartGameData();

                    const networkChannel1 = networkPubSub.connect
                        (startGameData.playerList[0].id, startGameData.playerList[1].id);

                    const networkChannel2 = networkPubSub.connect
                        (startGameData.playerList[1].id, startGameData.playerList[0].id);

                    const gameData1 = battleShip.initGame(startGameData, networkChannel1,
                        startGameData.playerList[0].id);
                    const gameData2 = battleShip.initGame(startGameData, networkChannel2,
                        startGameData.playerList[1].id);

                    manuallyPlaceShips(gameData1);
                    manuallyPlaceShips(gameData2);

                    Promise.all([
                        dataStore.save(gameData1.id, gameData1),
                        dataStore.save(gameData2.id, gameData2),
                    ]).then(() => {
                        resolve([
                            gameData1,
                            gameData2,
                        ]);
                    });
                });
            };

            this.afterEach(() => {
                networkPubSub.DEBUGremoveAll();
                interui.UnsubAll();
            });

            this.beforeEach(() => {
                networkPubSub.DEBUGremoveAll();
                interui.UnsubAll();
            });

            let player1AttackResponse: (fn: INetworkPubSubSubscriptionT<IGameMessageAttackResponse>) => void;
            let player1Attack: (arg: IGameMessageAttack) => void;

            const subUiUpdate = (id: string, callback: (msg: IMsgUpdateUI) => void) => {
                interui.Sub(id, interui.MSG.UPDATE_UI, (msg: IMsgUpdateUI) => {
                    callback(msg);
                });
            };

            this.beforeEach(() => {
                const startGameData = getStartGameData();

                const channel1 = networkPubSub.connect
                    (startGameData.playerList[0].id, startGameData.playerList[1].id);

                const stack2 = networkPubSub.connect
                    (startGameData.playerList[1].id, startGameData.playerList[0].id);

                player1AttackResponse = channel1.makeReceiver<IGameMessageAttackResponse>(ZMessageTypes.attackResponse);
                player1Attack = channel1.makeSender<IGameMessageAttack>(ZMessageTypes.attack);
            });

            it("Attacking outside the board unsuccessful", function() {
                return new Promise((resolve, reject) => {
                    (async () => {
                        const [gameData1, gameData2] = await initGameTest();

                        const x = -1;
                        const y = -2;

                        player1AttackResponse((msg) => {
                            assert.strictEqual(false, msg.isSuccess);
                            assert.strictEqual(gameData1.id, msg.playerTurn);
                            assert.strictEqual(x, msg.x);
                            assert.strictEqual(y, msg.y);

                            resolve();
                        });

                        player1Attack({ x, y });
                    })();
                });
            });

            it("Attacking water is returns correct response and sets target board", function() {
                return new Promise((resolve, reject) => {
                    (async () => {
                        const [attacker, attackee] = await initGameTest();

                        const x = attackee.startGameData.boardWidth - 1;
                        const y = attackee.startGameData.boardHeight - 1;

                        let neededEventCount = 3;

                        const isDone = () => {
                            neededEventCount--;
                            if (neededEventCount < 0) {
                                throw new Error("ACK... isDone called too many times");
                            }
                            if (neededEventCount === 0) {
                                resolve();
                            }
                        };

                        subUiUpdate(attackee.id, (msg: IMsgUpdateUI) => {
                            const loadedData2 = msg.gameData;
                            const cell2 = loadedData2.data.shipBoard[x][y];

                            assert.strictEqual(battleShip.BoardCellType.miss, cell2, "cell2");
                            isDone();
                        });

                        subUiUpdate(attacker.id, (msg: IMsgUpdateUI) => {
                            const loadedData1 = msg.gameData;
                            const cell1 = loadedData1.data.targetBoard[x][y];

                            assert.strictEqual(battleShip.BoardCellType.miss, cell1, "cell1");
                            isDone();
                        });

                        player1AttackResponse((msg) => {
                            assert.strictEqual(true, msg.isSuccess, "isSuccess");
                            assert.strictEqual(false, msg.isHit, "isHit");
                            assert.strictEqual(false, msg.isSink, "isSink");
                            assert.strictEqual(undefined, msg.sunkShip, "sunkShip");
                            assert.strictEqual(attackee.id, msg.playerTurn, "playerTurn");
                            assert.strictEqual(x, msg.x, "x");
                            assert.strictEqual(y, msg.y, "y");

                            isDone();
                        });

                        player1Attack({ x, y });
                    })();
                });
            });

            it("Attacking a ship is returns correct response and sets target board", function() {
                return new Promise((resolve, reject) => {
                    (async () => {
                        const [attacker, attackee] = await initGameTest();

                        const x = 0;
                        const y = 0;

                        let neededEventCount = 3;

                        const isDone = () => {
                            neededEventCount--;
                            if (neededEventCount < 0) {
                                throw new Error("ACK... isDone called too many times");
                            }
                            if (neededEventCount === 0) {
                                resolve();
                            }
                        };

                        subUiUpdate(attackee.id, (msg: IMsgUpdateUI) => {
                            const loadedData2 = msg.gameData;
                            const cell2 = loadedData2.data.shipBoard[x][y];

                            const startGameData = getStartGameData();

                            // console.log(boardToNodeString(loadedData2.data.shipBoard, loadedData2));

                            assert.strictEqual(battleShip.BoardCellType.hit, cell2, "cell2");
                            assert.notStrictEqual(
                                startGameData.shipData[0].size,
                                loadedData2.data.shipStatus[0].hitPoints);
                            isDone();
                        });

                        subUiUpdate(attacker.id, (msg: IMsgUpdateUI) => {
                            const loadedData1 = msg.gameData;
                            const cell1 = loadedData1.data.targetBoard[x][y];

                            assert.strictEqual(battleShip.BoardCellType.hit, cell1, "cell1");
                            isDone();
                        });

                        player1AttackResponse((msg) => {
                            assert.strictEqual(true, msg.isSuccess, "isSuccess");
                            assert.strictEqual(true, msg.isHit, "isHit");
                            assert.strictEqual(false, msg.isSink, "isSink");
                            assert.strictEqual(undefined, msg.sunkShip, "sunkShip");
                            assert.strictEqual(attackee.id, msg.playerTurn, "playerTurn");
                            assert.strictEqual(x, msg.x, "x");
                            assert.strictEqual(y, msg.y, "y");

                            isDone();
                        });

                        player1Attack({ x, y });
                    })();
                });
            });

            it("Attacking (and sinking) a ship is returns correct response and sets target board", function() {
                return new Promise((resolve, reject) => {
                    (async () => {
                        const [attacker, attackee] = await initGameTest();

                        const x = 10;
                        const y = 0;

                        let neededEventCount = 3;

                        const isDone = () => {
                            neededEventCount--;
                            if (neededEventCount < 0) {
                                throw new Error("ACK... isDone called too many times");
                            }
                            if (neededEventCount === 0) {
                                resolve();
                            }
                        };

                        subUiUpdate(attackee.id, (msg: IMsgUpdateUI) => {
                            const loadedData2 = msg.gameData;
                            const cell2 = loadedData2.data.shipBoard[x][y];

                            const startGameData = getStartGameData();

                            // console.log(boardToNodeString(loadedData2.data.shipBoard, loadedData2));

                            assert.strictEqual(battleShip.BoardCellType.hit, cell2, "cell2");
                            assert.strictEqual(0, loadedData2.data.shipStatus[5].hitPoints, "ship hit points");
                            isDone();
                        });

                        subUiUpdate(attacker.id, (msg: IMsgUpdateUI) => {
                            const loadedData1 = msg.gameData;
                            const cell1 = loadedData1.data.targetBoard[x][y];

                            assert.strictEqual(battleShip.BoardCellType.hit, cell1, "cell1");
                            isDone();
                        });

                        player1AttackResponse((msg) => {
                            assert.strictEqual(true, msg.isSuccess, "isSuccess");
                            assert.strictEqual(true, msg.isHit, "isHit");
                            assert.strictEqual(true, msg.isSink, "isSink");
                            assert.strictEqual(5, msg.sunkShip, "sunkShip");
                            assert.strictEqual(attackee.id, msg.playerTurn, "playerTurn");
                            assert.strictEqual(x, msg.x, "x");
                            assert.strictEqual(y, msg.y, "y");

                            isDone();
                        });

                        player1Attack({ x, y });
                    })();
                });
            });

        });
    });
});
