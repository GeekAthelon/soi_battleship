import { PubSub } from "../../app/lib/pub-sub";

import * as chai from "chai";
const assert = chai.assert;

describe("typescript-pubsub", () => {
    const ID = "id";

    it("exists", () => {
        assert.ok(PubSub);
    });

    it("triggers", (done) => {
        const eventName = "trig1";

        PubSub.Sub(ID, eventName, (...args: any[]) => {
            done();
        });

        const foo = () => {
            PubSub.Pub(ID, eventName, "a", "b");
        };

        setTimeout(foo, 10);
    });

    it("multiple triggers", (done) => {
        const eventName = "trig2";

        let received = 0;

        const testData: any[] = [
            true,
            "Circle",
            { prop: true },
        ];

        PubSub.Sub(ID, eventName, (...args: any[]) => {
            assert.deepEqual([testData[received]], args);
            received++;
        });

        testData.forEach((d) => {
            setTimeout(() => {
                PubSub.Pub(ID, eventName, d);
            }, 1);

        });

        setTimeout(() => {
            done();
        }, 1);
    });

    it("unsub", (done) => {
        const eventName = "trig3";
        let counter = 0;

        const subF = (...args: any[]) => {
            counter++;
        };

        PubSub.Sub(ID, eventName, subF);
        PubSub.Pub(ID, eventName, "a", "b");
        PubSub.Unsub(ID, eventName, subF);
        PubSub.Pub(ID, eventName, "a", "b");

        setTimeout(() => {
            assert.equal(1, counter);
            done();
        }, 1);
    });

    it("unsubAll", (done) => {
        const eventName = "trig3";
        let counter = 0;

        const subF = (...args: any[]) => {
            counter++;
        };

        PubSub.Sub(ID, eventName, subF);
        PubSub.Pub(ID, eventName, "a", "b");
        PubSub.UnsubAll();
        PubSub.Pub(ID, eventName, "a", "b");

        setTimeout(() => {
            assert.equal(1, counter);
            done();
        }, 1);
    });

});
