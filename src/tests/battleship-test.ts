/* tslint:disable:only-arrow-functions */

import * as chai from "chai";
import * as battleShip from "../app/battleship";
import { IGameData, IPlayer, IStartGameData } from "../app/igamedata";
import { IMsgAttack, IMsgAttackResponse } from "../app/imessages";
import * as dataStore from "../app/lib/data-store";
import * as PubSub from "../app/lib/pub-sub";
import { range } from "../app/lib/range";
import { colors } from "../app/lib/terminal-colors";
import * as pubSubMessages from "../app/pub-sub-name";

const assert = chai.assert;
describe("Main BattleShip Engine", function() {
    interface ITestLoop {
        x: number;
        y: number;
        p: "h" | "v";
        result: boolean;
    }
    const boardToNodeString = (board: number[][], gameData: IGameData) => {
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
            assert.ok(player.shipHitPoints.length);
            player.shipHitPoints.forEach((sp) => assert.ok(sp, "Ship hit points"));
            testBoardValid(player.shipBoard, gameData);
            testBoardValid(player.targetBoard, gameData);
        };

        it("player1 data is created", function() {
            const startGameData = getStartGameData();
            const gameData = battleShip.initGame(startGameData, startGameData.playerList[0].id);

            assert.equal(startGameData.playerList[0].id, gameData.id);
            testPlayerData(gameData.data, gameData);
        });
    });

    describe("Testing tryPlaceShip", function() {
        describe("testing on empty board", function() {
            it("horizontal - exactly enough room for the ship", function() {
                const shipNumber = 0;
                const startGameData = getStartGameData();

                startGameData.boardHeight = 1;
                startGameData.boardWidth = startGameData.shipData[shipNumber].size;
                const gameData = battleShip.initGame(startGameData, startGameData.playerList[0].id);

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

                startGameData.boardHeight = startGameData.shipData[shipNumber].size;
                startGameData.boardWidth = 1;
                const gameData = battleShip.initGame(startGameData, startGameData.playerList[0].id);

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
                    { x: 0, y: 0, p: "h", result: true },
                    { x: 0, y: 1, p: "h", result: true },
                    { x: 0, y: -1, p: "h", result: false },
                    { x: 1, y: 1, p: "h", result: false },
                    { x: 1, y: 0, p: "h", result: false },
                    { x: 1, y: -1, p: "h", result: false },
                    { x: -1, y: 0, p: "h", result: false },
                    { x: -1, y: 1, p: "h", result: false },
                    { x: -1, y: -1, p: "h", result: false },

                    { x: 0, y: 0, p: "v", result: true },
                    { x: 0, y: 1, p: "v", result: false },
                    { x: 0, y: -1, p: "v", result: false },
                    { x: 1, y: 1, p: "v", result: false },
                    { x: 1, y: 0, p: "v", result: true },
                    { x: 1, y: -1, p: "v", result: false },
                    { x: -1, y: 0, p: "v", result: false },
                    { x: -1, y: 1, p: "v", result: false },
                    { x: -1, y: -1, p: "v", result: false },
                ];

                tests.forEach((t) => {
                    const gameData = battleShip.initGame(startGameData, startGameData.playerList[0].id);

                    const { x, y, p, result } = t;
                    const isValid = battleShip.tryPlaceShip(
                        gameData.startGameData.shipData, shipNumber, x, y, p, gameData.data.shipBoard);

                    assert.equal(result, isValid, `isValid ${x}, ${y}:${result} [${isValid}]`);

                    if (result === false) {
                        testBoardValid(gameData.data.shipBoard, gameData, battleShip.BoardCellType.water);
                    } else {
                        testBoardValid(gameData.data.shipBoard, gameData);
                    }

                    // console.log(boardToNodeString(gameData.player1.shipBoard,gameData))
                });
            });
        });

        describe("randomzing locations", function() {
            it("should place all ships", function() {
                for (const i of range(1, 20)) {
                    const startGameData = getStartGameData();

                    const gameData = battleShip.initGame(startGameData, startGameData.playerList[0].id);
                    battleShip.randomizeShips(gameData);
                    testBoardValid(gameData.data.shipBoard, gameData);

                    // console.log(boardToNodeString(gameData.player1.shipBoard, gameData));

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

        describe.only("IMsgAttack", function() {
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
                    const gameData1 = battleShip.initGame(startGameData, startGameData.playerList[0].id);
                    const gameData2 = battleShip.initGame(startGameData, startGameData.playerList[1].id);

                    manuallyPlaceShips(gameData1);
                    manuallyPlaceShips(gameData2);

                    // console.log(boardToNodeString(gameData1.data.shipBoard, gameData1));

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

            this.beforeEach(() => {
                PubSub.UnsubAll();
            });

            it("Attacking outside the board unsuccessful", function(done) {
                initGameTest().then((res) => {
                    const [gameData1, gameData2] = res;

                    const attackMessage: IMsgAttack = {
                        id: "attack",
                        sourcePlayerId: gameData1.startGameData.playerList[0].id,
                        targetPlayerId: gameData2.startGameData.playerList[1].id,
                        x: -1,
                        y: -1,
                    };

                    PubSub.Sub(pubSubMessages.ATTACK_RESPONSE, (msg: IMsgAttackResponse) => {
                        assert.strictEqual(false, msg.isSuccess);
                        done();
                    });

                    battleShip.processMessage(attackMessage);
                });
            });
        });
    });
});
