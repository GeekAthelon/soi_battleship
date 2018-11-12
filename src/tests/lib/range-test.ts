import { range } from "../../app/lib/range";

import * as chai from "chai";
const assert = chai.assert;

describe("range", () => {
    it("exists", () => {
        assert.ok(range);
    });

    it("counts to 10", () => {
        let c = 0;

        for (const i of range(1, 10)) {
            c++;
        }
        assert.equal(10, c);
    });

    it("generates numbers in the right order", () => {
        const r = Array.from(range(1, 10));
        assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], r);
    });
});
