/* tslint:disable:only-arrow-functions */

import * as chai from "chai";
const assert = chai.assert;
import { describe } from "mocha";
import * as battleShip from "../app/battleship";
import { IGameData, IPlayer, IStartGameData } from "../app/igamedata";

const getStartGameData = () => {
    const startGameData: IStartGameData = {
        boardHeight: 10,
        boardWidth: 15,
        player1Id: "dv",
        player1Name: "Darth VAder",
        player2Id: "LK",
        player2Name: "Luke Skywalker",
    };
    return startGameData;
};

const testBoardValid = (board: number[][], gameData: IGameData, shouldContain: number = -1) => {
    assert.equal(board.length, gameData.boardWidth, "Game Width");

    for (const line of board) {
        assert.equal(line.length, gameData.boardHeight, "Game Height");

        for (const cell of line) {
            if (shouldContain !== -1) {
                assert.strictEqual(shouldContain, cell);
            } else {
                assert.notStrictEqual(undefined, cell, "Game cell");
            }
        }
    }
};

const testPlayerData = (player: IPlayer, gameData: IGameData) => {
    assert.ok(player.shipHitPoints.length);
    player.shipHitPoints.forEach((sp) => assert.ok(sp, "Ship hit points"));
    testBoardValid(player.shipBoard, gameData);
    testBoardValid(player.targetBoard, gameData);
};

describe("testing battleship start game", function() {
    it("battleship object exists", function() {
        assert.ok(battleShip);
    });

    it("player1 data is created", function() {
        const startGameData = getStartGameData();
        const gameData = battleShip.initGame(startGameData);

        assert.equal(startGameData.player1Id, gameData.player1.id);
        assert.equal(startGameData.player1Name, gameData.player1.name);
        testPlayerData(gameData.player1, gameData);
    });

    it("player2 data is created", function() {
        const startGameData = getStartGameData();
        const gameData = battleShip.initGame(startGameData);

        assert.equal(startGameData.player2Id, gameData.player2.id);
        assert.equal(startGameData.player2Name, gameData.player2.name);
        testPlayerData(gameData.player1, gameData);
    });
});

describe("Testing tryPlaceShip", function() {
    describe("testing on empty board", function() {
        it("horizontal - exactly enough room for the ship", function() {
            const shipNumber = 0;
            const startGameData = getStartGameData();

            startGameData.boardHeight = 1;
            startGameData.boardWidth = battleShip.shipData[shipNumber].size;
            const gameData = battleShip.initGame(startGameData);

            const isValid = battleShip.tryPlaceShip(shipNumber, 0, 0, "h", gameData.player1.shipBoard);
            assert.ok(isValid, "isValid");
            testBoardValid(gameData.player1.shipBoard, gameData, shipNumber);
        });
    });

    describe("testing on empty board", function() {
        it("vert - exactly enough room for the ship", function() {
            const shipNumber = 0;
            const startGameData = getStartGameData();

            startGameData.boardHeight = battleShip.shipData[shipNumber].size;
            startGameData.boardWidth = 1;
            const gameData = battleShip.initGame(startGameData);

            const isValid = battleShip.tryPlaceShip(shipNumber, 0, 0, "v", gameData.player1.shipBoard);
            assert.ok(isValid, "isValid");
            testBoardValid(gameData.player1.shipBoard, gameData, shipNumber);
        });
    });

    interface ITestLoop {
        x: number;
        y: number;
        p: "h" | "v";
        result: boolean;
    }

    describe("testing collisions", function() {
        it("ship hits the water", function() {
            const shipNumber = 0;
            const startGameData = getStartGameData();

            startGameData.boardHeight = battleShip.shipData[shipNumber].size;
            startGameData.boardWidth = battleShip.shipData[shipNumber].size;

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
                const gameData = battleShip.initGame(startGameData);

                const {x, y, p, result} = t;
                const isValid = battleShip.tryPlaceShip(shipNumber, x, y, p, gameData.player1.shipBoard);

              //  console.log(`isValid ${x}, ${y}:${result}  [${isValid}]`);
              //  console.table(gameData.player1.shipBoard);
                assert.equal(result, isValid, `isValid ${x}, ${y}:${result} [${isValid}]`);

                if (result === false) {
                    testBoardValid(gameData.player1.shipBoard, gameData, battleShip.BoardCellType.water);
                } else {
                    testBoardValid(gameData.player1.shipBoard, gameData);
                }
            });
        });
    });
});
