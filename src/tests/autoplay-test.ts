/* tslint:disable:only-arrow-functions */
// tslint:disable:no-console

import * as chai from "chai";
import * as battleShip from "../app/battleship";
import { IGameData, IPlayer, IStartGameData } from "../app/igamedata";
import { IMsgAttack, IMsgAttackResponse, IMsgUpdateUI } from "../app/imessages";
import * as dataStore from "../app/lib/data-store";
import * as PubSub from "../app/lib/pub-sub";
import { range } from "../app/lib/range";
import { colors } from "../app/lib/terminal-colors";
import * as pubSubMessages from "../app/pub-sub-name";
import * as battleShipTest from "./battleship-test";

const assert = chai.assert;
describe("Battleship Autoplay", function() {
    const getStartGameData = () => {
        const startGameData: IStartGameData = {
            boardHeight: 10,
            boardWidth: 15,
            playerList: [
                { name: "Darth Vader", id: "p1" },
                { name: "Luke Skywalker", id: "p2" },
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

    it("battleship object exists", function() {
        assert.ok(battleShip);
    });

    describe("testing battleship start game", function() {

        interface IPlayerTurn {
            x: number;
            y: number;
            isHit: boolean;
            isSink: boolean;
            isSuccess: boolean;
            sunkShip: number | undefined;
        }

        const player1Turns: IPlayerTurn[] = [
            { x: -1, y: -1, isSuccess: false, isHit: false, isSink: false, sunkShip: undefined },
            { x: 0, y: 0, isSuccess: true, isHit: true, isSink: false, sunkShip: undefined },
            { x: 0, y: 1, isSuccess: true, isHit: true, isSink: false, sunkShip: undefined },
        ];

        const player2Turns: IPlayerTurn[] = [
            { x: 2, y: 0, isSuccess: true, isHit: true, isSink: false, sunkShip: undefined },
            { x: 2, y: 1, isSuccess: true, isHit: true, isSink: false, sunkShip: undefined },
        ];

        let jjzCounter = 0;
        const attack = (
            attacker: IGameData,
            attackee: IGameData,
            done: () => void,
        ) => {
            jjzCounter++;
            // console.log(`***Attack Initiated: ${attacker.id} => ${attackee.id}`, `jjs:${jjzCounter}`);

            const turnList = (() => {
                if (attacker.id === attacker.startGameData.playerList[0].id) {
                    // console.log("turnList = player1", `jjs:${jjzCounter}`);
                    return player1Turns;
                } else {
                    // console.log("turnList = player2", `jjs:${jjzCounter}`);
                    return player2Turns;
                }
            })();

            // console.log(turnList);
            const action = turnList.shift();
            if (!action) {
                assert.strictEqual(0, player1Turns.length, "Player1 turn queue is not empty");
                assert.strictEqual(0, player2Turns.length, "Player2 turn queue is not empty");
                done();
                return;
            }

            // console.log("Action defined:", `jjs:${jjzCounter}`, action);
            let hasRunAttackResponse = false;
            let hasRunUpdateGui = false;

            PubSub.Sub(attacker.id, pubSubMessages.UPDATE_UI, (msg: IMsgUpdateUI) => {
                // console.log("UPDATE_UI", `jjs:${jjzCounter}`);
                if (hasRunUpdateGui) {
                    return;
                }
                hasRunUpdateGui = true;

                if (action.isSuccess) {
                    // console.log("Success-- counter attack", `jjs:${jjzCounter}`);
                    attack(attackee, attacker, done);
                } else {
                    // console.log("Fail -- try next attack in list", `jjs:${jjzCounter}`);
                    attack(attacker, attackee, done);
                }
            });

            PubSub.Sub(attacker.id, pubSubMessages.ATTACK_RESPONSE, (msg: IMsgAttackResponse) => {
                // console.log("ATTACK_RESPONSE", `jjs:${jjzCounter}`);
                if (!action) {
                    throw new Error("ATTACK_RESPONS - Action not OK");
                }

                // console.log(`hasRun: ${hasRunAttackResponse}`, `jjs:${jjzCounter}`);

                if (hasRunAttackResponse) {
                    return;
                }
                hasRunAttackResponse = true;

                // console.log(battleShipTest.boardToNodeString(attackee.data.shipBoard, attackee));
                assert.strictEqual(action.isSuccess, msg.isSuccess, "isSuccess");
                assert.strictEqual(action.isHit, msg.isHit, "isHit");
                assert.strictEqual(action.isSink, msg.isSink, "isSink");
                assert.strictEqual(action.sunkShip, msg.sunkShip, "sunkShip");
                assert.strictEqual(action.x, msg.x, "x");
                assert.strictEqual(action.y, msg.y, "y");
            });

            if (!action) {
                throw new Error("NO ACTION");
            }
            if (action) {
                const attackMessage: IMsgAttack = {
                    id: "attack",
                    sourcePlayerId: attacker.id,
                    targetPlayerId: attackee.id,
                    x: action.x,
                    y: action.y,
                };
                // console.log("??");
                // console.log(attackMessage);
                battleShip.processMessage(attackee.id, attackMessage);
            }
        };

        it("running game", function(done) {
            initGameTest().then((res) => {
                const [player1, player2] = res;
                attack(player1, player2, done);
            });
        });
    });

});
