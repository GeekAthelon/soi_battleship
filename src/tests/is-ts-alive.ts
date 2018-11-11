import * as chai from "chai";
const assert = chai.assert;
import * as battleShip from "../app/battleship";

describe("is typescript alive", () => {
    it("should be alive", () => {
        assert.ok(true);
    });
    it("battleship object exists", () => {
        assert.ok(battleShip);
    });
});
