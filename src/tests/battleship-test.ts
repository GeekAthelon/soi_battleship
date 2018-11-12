/* tslint:disable:only-arrow-functions */

import * as chai from "chai";
const assert = chai.assert;
import * as battleShip from "../app/battleship";
import { IGameData, IPlayer, IStartGameData } from "../app/igamedata";
import { range } from "../app/lib/range";

const getStartGameData = () => {
    const startGameData: IStartGameData = {
        boardHeight: 10,
        boardWidth: 10,
        player1Id: "dv",
        player1Name: "Darth VAder",
        player2Id: "LK",
        player2Name: "Luke Skywalker",
    };
    return startGameData;
};

const testBoardValid = (board: number[][], gameData: IGameData) => {
    assert.equal(board.length, gameData.boardHeight, "Game Height");

    for (const line of board) {
        assert.equal(line.length, gameData.boardWidth, "Game width");

        for (const cell of line) {
            assert.ok(cell, "Game cell");
        }
    }
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
        testBoardValid(gameData.player1.shipBoard, gameData);
        testBoardValid(gameData.player1.targetBoard, gameData);
    });

    it("player2 data is created", function() {
        const startGameData = getStartGameData();
        const gameData = battleShip.initGame(startGameData);

        assert.equal(startGameData.player2Id, gameData.player2.id);
        assert.equal(startGameData.player2Name, gameData.player2.name);
        testBoardValid(gameData.player1.shipBoard, gameData);
        testBoardValid(gameData.player1.targetBoard, gameData);
    });
});
