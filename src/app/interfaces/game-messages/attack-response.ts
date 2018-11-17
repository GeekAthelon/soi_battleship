interface IGameMessageAttackResponse {
    // If the target was something invalid --
    // Outside the board, or a location targetted already,
    // set isSuccess to false.
    isSuccess: boolean;

    // Was ship hit?
    isHit: boolean;

    // Was a ship sunk?
    isSink: boolean;

    // What ship was sunk?
    sunkShip: number | undefined;

    // Whose turn?
    playerTurn: string;

    // The coordinates of the attack
    x: number;
    y: number;
}
