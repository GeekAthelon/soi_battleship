import { firebaseNickJoiner } from "../lib/firebase-nick-joiner";
import { initFirebase } from "../lib/firebase-pub";
import * as postMessage from "../lib/post-message";
import { addPlayer, IPlayerInfo, removePlayer } from "./ui/player-list";

import swal from "sweetalert";

import "../style/ui.css";

const tryParse = (s: string) => {
    try {
        return JSON.parse(s);
    } catch (err) {
        return null;
    }
};

const messageHander = (e: MessageEvent) => {
    const msg = tryParse(e.data) as postMessage.MessageType;
    if (msg === null) {
        return;
    }

    switch (msg.type) {
        case "PING":
            postMessage.Pong(window.parent);
            break;
        case "INTIALIZEIFRAME":
            loginPlayer(msg);
            break;
        default:
            break;
    }
};

const loginPlayer = async (loginMessage: postMessage.IInitalizeIframe) => {

    const res = await swal("Do you care?");

    const willDelete = await swal({
        buttons: {
            cancel: {
                className: "",
                closeModal: true,
                text: "Cancel",
                value: null,
                visible: true,
            },
            confirm: {
                className: "",
                closeModal: true,
                text: "OK",
                value: true,
                visible: true,
            },
        },
        dangerMode: true,
        icon: "warning",
        text: "Once deleted, you will not be able to recover this imaginary file!",
        title: "Are you sure?",
    });

    alert("willDelete" + willDelete);
    if (willDelete) {
        await swal("Poof! Your imaginary file has been deleted!", {
            icon: "success",
        });
    } else {
        await swal("Your imaginary file is safe!");
    }

    const db = await initFirebase();

    const challengeOpponent = (opponent: IPlayerInfo) => {
        alert(opponent);
    };

    // There is weird race condition where when you refresh the page, the user can end up
    // knocked off the list, so make the name unique to combat that problem.
    const userInfo = JSON.stringify(
        {
            id: loginMessage.id,
            name: loginMessage.name,
        });
    const userOnlineReference = db.ref("online").child(userInfo + firebaseNickJoiner + new Date().getTime());
    userOnlineReference.set(true);
    userOnlineReference.onDisconnect().remove();

    const onlineLIifeReferenceObject = db.ref("online");

    onlineLIifeReferenceObject.on("child_added", (snap) => {
        if (snap && snap.key) {
            const json = snap.key.split(firebaseNickJoiner)[0];
            const playerInfo = JSON.parse(json) as IPlayerInfo;
            if (playerInfo.id !== loginMessage.id) {
                addPlayer(playerInfo, challengeOpponent);
            }
        }
    });

    onlineLIifeReferenceObject.on("child_removed", (snap) => {
        if (snap && snap.key) {
            const json = snap.key.split(firebaseNickJoiner)[0];
            const playerInfo = JSON.parse(json) as IPlayerInfo;
            if (playerInfo.id !== loginMessage.id) {
                removePlayer(playerInfo);
            }
        }
    });
};

window.addEventListener("message", messageHander, false);
