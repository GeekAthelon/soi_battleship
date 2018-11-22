import swal from "sweetalert";

export async function askAcceptChallenge(gameMessage: IGameMessageChallenge) {
    const willAccept = await swal({
        buttons: {
            cancel: {
                className: "",
                closeModal: true,
                text: "Decline",
                value: null,
                visible: true,
            },
            confirm: {
                className: "",
                closeModal: true,
                text: "Accept",
                value: true,
                visible: true,
            },
        },
        dangerMode: false,
        icon: "",
        text: `${gameMessage.name} has challenged you to a game.`,
        title: "You have been challenged!",
    });

    return !!willAccept;
}
