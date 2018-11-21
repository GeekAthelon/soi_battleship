// tslint:disable:only-arrow-functions
import * as chai from "chai";
import { initFirebase } from "../../app/lib/firebase-pub";
import * as firebasePubSub from "../../app/lib/firebase-pub-sub";
import * as sameProcessnetworkPubSub from "../../app/lib/same-process-pub-sub";

const assert = chai.assert;

function setupTests(
    desc: string,
    networkPubSub: INetworkPubSub,
    channel1: INetworkChannel,
    channel2: INetworkChannel) {
    describe(`network-pub-sub [${desc}]`, function() {
        this.timeout(10 * 1000);

        it("exists", () => {
            assert.ok(channel1);
            assert.ok(channel2);
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
    });
}

describe(`sameProcessnetworkPubSub`, function() {
    it(`Runs tests`, function() {
        const p1 = sameProcessnetworkPubSub.init();
        const channel1 = p1.connect("p1", "p2");
        const channel2 = p1.connect("p2", "p1");

        setupTests("sameProcessnetworkPubSub", p1, channel1, channel2);
    });
});

describe.skip(`firebasePubSub`, function() {
    this.timeout(5 * 1000);
    it(`Runs tests`, function(done) {
        initFirebase().then((db) => {

            const p1 = firebasePubSub.init(db);
            const p2 = firebasePubSub.init(db);

            const channel1 = p1.connect("p1", "p2");
            const channel2 = p2.connect("p2", "p1");

            setupTests("sameProcessnetworkPubSub", p1, channel1, channel2);
            done();
        });
    });
});
