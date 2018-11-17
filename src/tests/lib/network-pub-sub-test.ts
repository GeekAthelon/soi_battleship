// tslint:disable:only-arrow-functions
import * as chai from "chai";
import * as networkPubSub from "../../app/lib/network-pub-sub";

const assert = chai.assert;

describe.only("network-pub-sub", function() {
    const stack1 = networkPubSub.connect("P1", "P2");
    const stack2 = networkPubSub.connect("P2", "P1");

    it("exists", () => {
        assert.ok(stack1);
        assert.ok(stack2);
    });

    it("triggers", (done) => {
        const eventName = networkPubSub.getUniqueTrigger();

        stack2.sub(eventName, (arg) => {
            done();
        });

        const foo = () => {
            stack1.pub(eventName, "test1");
        };

        setTimeout(foo, 10);
    });

    it("multiple triggers", (done) => {
        const eventName = networkPubSub.getUniqueTrigger();

        let received = 0;

        const testData: any[] = [
            true,
            "Circle",
            { prop: true },
        ];

        stack2.sub(eventName, (arg: any) => {
            assert.deepEqual(testData[received], arg);
            received++;
            if (received === testData.length) {
                done();
            }
        });

        testData.forEach((d) => {
            setTimeout(() => {
                stack1.pub(eventName, d);
            }, 1);
        });
    });

    it("unsub", (done) => {
        const eventName = networkPubSub.getUniqueTrigger();
        const doneTriggerName = networkPubSub.getUniqueTrigger();
        let counter = 0;

        const subF = (arg: any) => {
            counter++;
        };

        stack2.sub(eventName, subF);
        stack1.pub(eventName, "a");
        stack2.unsub(eventName, subF);
        stack1.pub(eventName, "b");
        stack2.sub(doneTriggerName, () => {
            assert.equal(1, counter);
            done();
        });
        stack1.pub(doneTriggerName, true);
    });
});
