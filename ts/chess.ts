// Everything is contained here!
// In a larger-scale project, I'd definitely modularize my project into folders!
// However, due to limits with import/export in pure HTML/CSS/JS, the source code is all on one file.


// Types
type AvailableChessboardSizes = 8 | 10 | 12
type TeamSide = "white" | "black"
type Position = [number, number]
type Board = (string | null)[][]


type ChessPieceType = {
    name: string;
    description: string;
    getAvailablePositions: (board: Chessboard, position: Position) => Position[];
}

type ChessPieceOnPlay = ChessPieceType & {
    id: string;
    position: Position;
    side: "white" | "black";
    isCaptured: boolean;
}

type ChessboardData = {
    movesLog: string[];
    xbyx: AvailableChessboardSizes;
    pieces: ChessPieceOnPlay[];
}


// Utilities
const randomIdGenerator = () => Math.random().toString(36).substring(2, 8);


// Classes
class Chessboard {
    public board: Board;
    public turn: TeamSide = "white";
    public movesLog: string[] = [];
    public winner: TeamSide | "draw" | null = null;

    constructor(
        public xbyx: AvailableChessboardSizes,
        public pieces: ChessPieceOnPlay[]
    ) {
        this.board = Array.from({ length: this.xbyx }, () => Array(this.xbyx).fill(null));

        this.pieces.forEach(piece => {
            this.setPositionOnBoard(piece.position, piece.id);
        })
    }

    getSideMoves() {
        const counter = this.turn === "white" ? 0 : 1;
        return this.movesLog.filter((_, index) => index % 2 === counter);
    }

    getPieceById(pieceId: string): ChessPieceOnPlay | undefined {
        return this.pieces.find(piece => piece.id === pieceId);
    }

    peekBoardPosition(pos: Position) {
        return this.board[pos[0]][pos[1]];
    }

    private setPositionOnBoard(pos: Position, setTo: string | null) {
        this.board[pos[0]][pos[1]] = setTo;
    }

    private changeTurn() {
        this.turn = this.turn === "white" ? "black" : "white";
    }

    private blindMove(piece: ChessPieceOnPlay, newPos: Position) {
        this.setPositionOnBoard(piece.position, null);
        piece.position = newPos;
        this.setPositionOnBoard(piece.position, piece.id);
    }

    private logMove(piece: ChessPieceOnPlay, newPos: Position) {
        const asString = `${piece.name}-${this.asAlgebraicNotation(newPos)}`;
        this.movesLog.push(asString);
    }

    private replacePiece(id: string, newPiece: ChessPieceOnPlay): void {
        const index = this.pieces.findIndex(p => p.id === id);
        if (index !== -1) {
            this.pieces[index] = newPiece;
        }

        this.setPositionOnBoard(newPiece.position, newPiece.id);
    }

    private getAllPossibleMoves(side: TeamSide) {
        const oppPieces = this.pieces.filter(piece => piece.side === side && !piece.isCaptured);
        let possibleMoves = []
        for (const piece of oppPieces) {
            const moves = piece.getAvailablePositions(this, piece.position);
            possibleMoves = [...possibleMoves, ...moves]
        }
        return possibleMoves;
    }

    private castling(pieceSelected: ChessPieceOnPlay, newPos: Position) {
        if (
            pieceSelected.name === "King"
            && Math.abs(newPos[0] - pieceSelected.position[0]) > 1
        ) {
            const kingRow = pieceSelected.position[1];
            const isKingside = newPos[0] > pieceSelected.position[0];
            const rookStartCol = isKingside ? this.xbyx - 1 : 0;
            const rookNewCol = isKingside
                ? newPos[0] - 1
                : newPos[0] + 1;

            const rookId = this.peekBoardPosition([rookStartCol, kingRow]); if (!rookId) return;
            const rook = this.getPieceById(rookId); if (!rook || rook.name !== "Rook") return;

            // Moves the Rook
            this.blindMove(rook, [rookNewCol, kingRow])

            // Log castling move
            this.movesLog.push("Castle");
            this.movesLog.push(isKingside ? "O-O-O" : "O-O");
        }
    }

    private promotion(pieceSelected: ChessPieceOnPlay, newPos: Position) {
        const endRank = this.turn === "white" ? this.xbyx - 1 : 0;

        if (
            pieceSelected.name === "Pawn"
            && newPos[1] === endRank
        ) {

            const promotedPiece: ChessPieceOnPlay = {
                ...queenPiece,
                id: pieceSelected.id,
                position: newPos,
                isCaptured: false,
                side: this.turn
            };

            this.replacePiece(pieceSelected.id, promotedPiece);

            // Log promotion move
            this.movesLog.push("Promotion");
            this.movesLog.push("To Queen");
        }
    }

    private isInCheck(sideToCheck: TeamSide) {
        const king = this.pieces.find(piece => piece.name === "King" && piece.side === sideToCheck);

        const opponentSide = sideToCheck === "white" ? "black" : "white";
        const attacks = this.getAllPossibleMoves(opponentSide);

        return attacks.some(([x, y]) => x === king.position[0] && y === king.position[1]);
    }

    private checkForWin() {}

    movePiece(pieceId: string, newPos: Position) {
        // Get Piece form board
        const pieceSelected = this.getPieceById(pieceId); if (!pieceSelected) return;

        // Check if move is legal
        const availableMoves = pieceSelected.getAvailablePositions(this, pieceSelected.position);
        if (availableMoves.some(([x, y]) => x === newPos[0] && y === newPos[1])) {

            // Cache's last move
            let oldPos = pieceSelected.position;
            let previousId = this.peekBoardPosition(newPos);

            // Simulates move on the board
            this.blindMove(pieceSelected, newPos);
            let previousPiece = this.capturePiece(previousId) || null;

            // We'll run a few tests here
            

            // Now let's actually make the move!
            this.castling(pieceSelected, newPos);
            this.promotion(pieceSelected, newPos);
            this.logMove(pieceSelected, newPos);
            this.checkForWin();

            this.changeTurn();
        }
    }

    capturePiece(pieceId: string | null): ChessPieceOnPlay | null {
        if (!pieceId) return;
        const capturedPiece = this.getPieceById(pieceId); if (!capturedPiece) return;
        capturedPiece.isCaptured = true;
        return capturedPiece;
    }

    asAlgebraicNotation(pos: Position): string {
        let chars = "abcdefghijklmnop";
        return `${chars[pos[0]]}${pos[1] + 1}`;
    }

    static flipPosition(pos: Position, xbyx: AvailableChessboardSizes): Position {
        const flipper = (num: number) => xbyx - num - 1;
        return pos.map(p => flipper(p)) as Position;
    }

    // Saving and Loading
    getSaveGameData(): ChessboardData {
        return {
            movesLog: this.movesLog,
            xbyx: this.xbyx,
            pieces: this.pieces
        }
    }

    static loadGame(data: ChessboardData) {
        const chessboard = new Chessboard(data.xbyx, data.pieces);
        chessboard.movesLog = data.movesLog;
        chessboard.turn = data.movesLog.length % 2 === 0 ? "white" : "black";
        return chessboard;
    }
}


// Pieces

//Built-In Utilities
const sameTeamPosTaken = (board: Chessboard, pos: Position) => {
    const loc = board.peekBoardPosition(pos);
    if (!loc) return false;
    
    const piece = board.getPieceById(loc);
    if (piece?.side === board.turn) return true;
    return false;
}

const oppositeTeamPosTaken = (board: Chessboard, pos: Position) => {
    const loc = board.peekBoardPosition(pos);
    if (!loc) return false;
    
    const piece = board.getPieceById(loc);
    if (piece?.side !== board.turn) return true;
    return false
}

const withinBoard = (board: Chessboard, pos: Position) => {
    let [x, y] = pos;
    return x >= 0 && x < board.xbyx && y >= 0 && y < board.xbyx;
}

const pieceHasMoved = (board: Chessboard, piece: ChessPieceOnPlay) => {
    return board.getSideMoves().some(move => move.includes(piece.name));
}

// Pawn
const pawnPiece: ChessPieceType = {
    name: "Pawn",
    description: "Moves forward, protecting the team!",
    getAvailablePositions: (board: Chessboard, pos: Position) => {
        const direction = board.turn === "white" ? 1 : -1; // White moves up, Black moves down
        const startRow = board.turn === "white" ? 1 : board.xbyx - 2;
        let possibleMoves: Position[] = [];

        const oneStep: Position = [pos[0], pos[1] + direction];
        if (!sameTeamPosTaken(board, oneStep) && !oppositeTeamPosTaken(board, oneStep)) {
            possibleMoves.push(oneStep);
        
            // First move has two steps forward
            if (pos[1] === startRow) {
                const twoStep: Position = [pos[0], pos[1] + 2 * direction];
                if (!sameTeamPosTaken(board, twoStep) && !oppositeTeamPosTaken(board, twoStep)) {
                    possibleMoves.push(twoStep);
                }
            }
        };

        // Pawns can capture pieces diagonally
        [
            [pos[0] - 1, pos[1] + direction] as Position, 
            [pos[0] + 1, pos[1] + direction] as Position
        ].forEach(capturePos => {
            if (withinBoard(board, capturePos) && oppositeTeamPosTaken(board, capturePos)) {
                possibleMoves.push(capturePos);
            }
        })

        // Ensure all moves stay within board limits
        return possibleMoves.filter((p) => withinBoard(board, p));
    }
}

// Knight
const knightPiece: ChessPieceType = {
    name: "Knight",
    description: "Moves in L-shape",
    getAvailablePositions: (board: Chessboard, pos: Position) => {
        const knightMoves: Position[] = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];

        return knightMoves
            .map(([dx, dy]) => [pos[0] + dx, pos[1] + dy] as Position)
            .filter(p => withinBoard(board, p))
            .filter((pos) => !sameTeamPosTaken(board, pos))
    }
}

// King
const kingPiece: ChessPieceType = {
    name: "King",
    description: "Moves one square in any direction",
    getAvailablePositions: (board: Chessboard, pos: Position) => {
        const kingMovesAvailable: Position[] = [
            [1, 0], [1, 1], [0, 1], [-1, 1],
            [-1, 0], [-1, -1], [0, -1], [1, -1]
        ]

        let possibleMoves = kingMovesAvailable
            .map(([dx, dy]) => [pos[0] + dx, pos[1] + dy] as Position)
            .filter(pos => withinBoard(board, pos))
            .filter((pos) => !sameTeamPosTaken(board, pos));
        
        // Add castling moves
        const kingId = board.peekBoardPosition(pos); if (!kingId) return possibleMoves;
        const kingPiece = board.getPieceById(kingId); if (!kingPiece) return possibleMoves;
        if (pieceHasMoved(board, kingPiece)) return possibleMoves; // Returns moves if King already moved

        const team = kingPiece.side;
        const col = pos[1];

        const tryCastle = (rookRow: number, pathRows: number[], targetRow: number) => {
            const rookId = board.peekBoardPosition([rookRow, col]); if (!rookId) return;
            const rook = board.getPieceById(rookId);
            if (
                !rook
                || rook.name !== "Rook"
                || rook.side !== team
                || pieceHasMoved(board, rook)
            ) return;

            // Checks if all spaces between King and Rook are empty
            for (const row of pathRows) {
                if (!!board.peekBoardPosition([row, col])) return;
            }

            possibleMoves.push([targetRow, col]);
        };

        // Kingside castling
        tryCastle(7, [4, 5, 6], 5);

        // Queenside castling
        tryCastle(0, [1, 2], 1);
        
        return possibleMoves;
    }
}

// Rook
const rookPiece: ChessPieceType = {
    name: "Rook",
    description: "Moves horizontally and vertically",
    getAvailablePositions: (board: Chessboard, pos: Position) => {
        let availablePos: Position[] = [];

        const directions: Position[] = [
            [1, 0], [-1, 0],
            [0, -1], [0, 1]
        ];

        for (const [dx, dy] of directions) {
            let [x, y] = pos;

            while (true) {
                x += dx;
                y += dy;
                if (!withinBoard(board, [x, y])) break;

                let newPos: Position = [x, y];

                if (sameTeamPosTaken(board, newPos)) break;
                availablePos.push(newPos);
                if (oppositeTeamPosTaken(board, newPos)) break;
            }
        }

        return availablePos;
    }
}

// Bishop
const bishopPiece: ChessPieceType = {
    name: "Bishop",
    description: "Moves diagonally",
    getAvailablePositions: (board: Chessboard, pos: Position) => {
        let availablePos: Position[] = [];

        const directions: Position[] = [
            [1, 1], [-1, -1],
            [1, -1], [-1, 1]
        ];

        for (const [dx, dy] of directions) {
            let [x, y] = pos;

            while (true) {
                x += dx;
                y += dy;
                if (!withinBoard(board, [x, y])) break;

                let newPos: Position = [x, y];

                if (sameTeamPosTaken(board, newPos)) break;
                availablePos.push(newPos);
                if (oppositeTeamPosTaken(board, newPos)) break;
            }
        }

        return availablePos;
    }
}

// Queen
const queenPiece: ChessPieceType = {
    name: "Queen",
    description: "Moves in any direction that Bishop's and Knights do",
    getAvailablePositions: (board: Chessboard, pos: Position) => {
        const bishopMoves = bishopPiece.getAvailablePositions(board, pos);
        const rookMoves = rookPiece.getAvailablePositions(board, pos);
        return [...bishopMoves, ...rookMoves];
    }
}


// All Pieces
const chessPieces: ChessPieceType[] = [
    pawnPiece, rookPiece, knightPiece, bishopPiece,
    queenPiece, kingPiece,
]

// Games available
const setUpClassicGame = () => {
    const positionMap = {
        "Pawn": Array.from({ length: 8 }, (_, i) => [i, 1]),
        "Rook": [[0, 0], [7, 0]],
        "Knight": [[1, 0], [6, 0]],
        "Bishop": [[2, 0], [5, 0]],
        "Queen": [[4, 0]],
        "King": [[3, 0]]
    }

    let pieceLayout: ChessPieceOnPlay[] = [];
    for (const piece of chessPieces) {
        const positions: Position[] = positionMap[piece.name];

        // White Pieces
        for (const pos of positions) {
            const pieceId = randomIdGenerator();
            pieceLayout.push({
                ...piece,
                id: pieceId,
                position: pos,
                isCaptured: false,
                side: "white"
            })
        }

        // Black Pieces
        for (const pos of positions) {
            const pieceId = randomIdGenerator();

            // Makes sure that the queen & king are on the same column.
            let flippedPos: Position;
            if (piece.name === "King" || piece.name === "Queen") {
                flippedPos = [pos[0], 8 - pos[1] - 1]
            } else {
                flippedPos = Chessboard.flipPosition(pos, 8);
            }

            pieceLayout.push({
                ...piece,
                id: pieceId,
                position: flippedPos,
                isCaptured: false,
                side: "black"
            })
        }
    }
    return pieceLayout;
}


// Build Classes for Each Page & Component
class MainScreen {
    private gameModeSelectionDiv: HTMLElement | null;
    private gameModes: GameModeSelection[] = [
        {
            name: "Classic",
            description: "The standard, most classic way of playing Chess!",
            setUp: setUpClassicGame
        }
    ]
    public rootDiv = document.getElementById("root");

    constructor() {
        this.displayUI();
    }

    displayUI() {
        const gameModeSelectionDiv = document.createElement("div");
        gameModeSelectionDiv.className = "main-container";

        const title = document.createElement("h1");
        title.innerText = "Welcome to Chess 2!";
        gameModeSelectionDiv.appendChild(title);

        const gameModeTitle = document.createElement("h3");
        gameModeTitle.innerText = "Choose Game Mode";
        gameModeSelectionDiv.appendChild(gameModeTitle);

        const gameModeSelection = document.createElement("div");
        gameModeSelection.id = "gameModeSelection";

        this.gameModes.forEach((mode) => {
            const button = document.createElement("button");
            button.innerText = mode.name;
            button.title = mode.description;

            button.addEventListener("click", () => {
                const piecesSetUp = mode.setUp();
                new ChessboardHTML(8, piecesSetUp, "chessboardContainer");
                gameModeSelectionDiv.remove();
            });

            gameModeSelection.appendChild(button);
        });

        gameModeSelectionDiv.appendChild(gameModeSelection);

        this.rootDiv?.appendChild(gameModeSelectionDiv);
    }
}


class ChessboardHTML extends Chessboard {
    public rootDiv = document.getElementById("root");
    private chessboardContainerDiv: HTMLElement;
    private gameDetailsDiv: HTMLElement;

    private selectedPieceId: string | null;

    constructor(
        public xbyx: AvailableChessboardSizes,
        public pieces: ChessPieceOnPlay[],
        elmId: string = "chessboardContainer"
    ) {
        super(xbyx, pieces);
        let checkDiv = document.getElementById(elmId);
        if (!checkDiv) {
            console.error(`Div with id '${elmId}' doesn't exist`);
            return;
        };
        this.chessboardContainerDiv = checkDiv;

        this.updateState();
    }

    private getPieceDesign = (piece: ChessPieceOnPlay) => `../assets/${piece.name.toLowerCase()}_${piece.side}.png`;

    private getCapturedHTML(side: TeamSide) {
        return this.pieces
            .filter(p => p.isCaptured && p.side === side)
            .map(p => `<img src="${this.getPieceDesign(p)}" alt="${p.name}">`)
            .join("");
    }

    displayBoard() {
        if (!this.chessboardContainerDiv) return;
        this.chessboardContainerDiv.innerHTML = "";

        let chessboardDiv = document.createElement('div');
        chessboardDiv.id = "chessboard";

        const availableMoves = this.selectedPieceAvailableMoves();

        for (let col = this.xbyx - 1; col >= 0; col--) {
            for (let row = 0; row < this.xbyx; row++) {  
                const square = document.createElement("div");
                square.classList.add("square");
                square.id = `pos-${row}-${col}`;
                if (availableMoves.some(pos => pos[0] === row && pos[1] === col)) {
                    square.classList.add("available");
                    square.addEventListener('click', () => {
                        if (!this.selectedPieceId) return;
                        this.movePiece(this.selectedPieceId, [row, col]);
                    })
                } else if ((row + col) % 2 === 0) {
                    square.classList.add("white");
                } else {
                    square.classList.add("black");
                }
                chessboardDiv.appendChild(square);
            }
        }

        this.chessboardContainerDiv.appendChild(chessboardDiv);
    }

    displayPieces() {
        for (const piece of this.pieces) {
            if (piece.isCaptured) continue;

            const square = document.getElementById(`pos-${piece.position[0]}-${piece.position[1]}`);
            if (!square) continue;

            const pieceImage = document.createElement("img");
            pieceImage.src = this.getPieceDesign(piece);
            pieceImage.alt = piece.name;
            pieceImage.classList.add("chess-piece");

            if (this.turn === piece.side) {
                pieceImage.classList.add("turn-side")
                pieceImage.addEventListener('click', () => {
                    this.setSelectedPiece(piece.id);
                })
            }

            square.appendChild(pieceImage);
        }

    }

    displayDetails() {
        if (this.gameDetailsDiv) this.gameDetailsDiv.remove();

        const details = document.createElement("div");
        details.id = "chessboard-details";

        // Turn Indicator
        const turnIndicator = document.createElement("div");
        turnIndicator.classList.add("details-block");
        turnIndicator.innerHTML = `<strong>Turn:</strong> <span id="turn-color">${this.turn}</span>`;
        details.appendChild(turnIndicator);

        // Move Log
        const moveLog = document.createElement("div");
        moveLog.classList.add("details-block");
        moveLog.innerHTML = `<strong>Moves:</strong><ul id="move-list">${this.movesLog.map(m => `<li>${m}</li>`).join("")}</ul>`;
        details.appendChild(moveLog);

        // Captured Pieces
        const capturedDiv = document.createElement("div");
        capturedDiv.classList.add("details-block");
        capturedDiv.innerHTML = `
            <strong>Captured:</strong>
            <div class="captured-row"><span>White:</span> ${this.getCapturedHTML("white")}</div>
            <div class="captured-row"><span>Black:</span> ${this.getCapturedHTML("black")}</div>
        `;
        details.appendChild(capturedDiv);

        // Save Button

        this.gameDetailsDiv = details;
        this.chessboardContainerDiv.appendChild(details);
    }

    updateState() {
        this.displayBoard();
        this.displayPieces();
        this.displayDetails();
    }

    selectedPieceAvailableMoves() {
        if (!this.selectedPieceId) return [];
        const selPiece = this.getPieceById(this.selectedPieceId);

        return selPiece?.getAvailablePositions(this, selPiece.position) || [];
    }

    setSelectedPiece(id: string) {
        if (!this.getPieceById(id)) return;
        this.selectedPieceId = this.selectedPieceId === id ? null : id;
        this.updateState();
    }

    movePiece(pieceId: string, newPos: Position): void {
        super.movePiece(pieceId, newPos);
        this.setSelectedPiece(pieceId);
    }
}


// Now let's build the entire App!
type GameModeSelection = {
    name: string,
    description: string,
    setUp: () => ChessPieceOnPlay[]
}
type OpponentSelection = {
    name: string,
    setUp: () => void;
}
class App {
    constructor() {
        this.displayUI();
    }

    displayUI() {
        new MainScreen();
    }
}


// Finally! Time to run the app!
document.addEventListener("DOMContentLoaded", () => {
    new App();
});
