// tslint:disable:only-arrow-functions
import * as chai from "chai";
import * as sameProcessnetworkPubSub from "../../app/lib/same-process-pub-sub";

const assert = chai.assert;

function setupTests(desc: string, networkPubSub: INetworkPubSub) {
    describe(`network-pub-sub [${desc}]`, function() {
        const channel1 = networkPubSub.connect("P1", "P2");
        const channel2 = networkPubSub.connect("P2", "P1");

        it("exists", () => {
            assert.ok(channel1);
            assert.ok(channel2);
        });

        it("triggers", (done) => {
            const eventName = networkPubSub.getUniqueTrigger();

            channel2.sub(eventName, (arg) => {
                done();
            });

            const foo = () => {
                channel1.pub(eventName, "test1");
            };

            setTimeout(foo, 10);
        });

        it("triggers the generics", (done) => {
            const eventName = networkPubSub.getUniqueTrigger();

            channel2.subT<boolean>(eventName, (arg) => {
                done();
            });

            const foo = () => {
                channel1.pubT<boolean>(eventName, true);
            };

            setTimeout(foo, 10);
        });

        it("receiver and sender", (done) => {
            const eventName = networkPubSub.getUniqueTrigger();

            const booleanSender = channel2.makeReceiver<boolean>(eventName);
            const booleanReceiver = channel1.makeSender(eventName);

            booleanSender((value) => {
                assert.equal(true, value);
                done();
            });

            const foo = () => {
                booleanReceiver(true);
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

            channel2.sub(eventName, (arg: any) => {
                assert.deepEqual(testData[received], arg);
                received++;
                if (received === testData.length) {
                    done();
                }
            });

            testData.forEach((d) => {
                setTimeout(() => {
                    channel1.pub(eventName, d);
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

            channel2.sub(eventName, subF);
            channel1.pub(eventName, "a");
            channel2.unsub(eventName, subF);
            channel1.pub(eventName, "b");
            channel2.sub(doneTriggerName, () => {
                assert.equal(1, counter);
                done();
            });
            channel1.pub(doneTriggerName, true);
        });
    });
}

describe(`sameProcessnetworkPubSub`, function() {
    it(`Runs tests`, function() {
        setupTests("sameProcessnetworkPubSub", sameProcessnetworkPubSub.init());
    });
});
