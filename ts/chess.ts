// Everything is contained here!
// In a larger-scale project, I'd definitely modularize my project into folders!

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


// Utilities
const randomIdGenerator = () => Math.random().toString(36).substring(2, 8);


// Classes
class Chessboard {
    public board: Board;
    public turn: TeamSide = "white";
    public movesLog: string[] = [];

    constructor(
        public xbyx: AvailableChessboardSizes,
        public pieces: ChessPieceOnPlay[]
    ) {
        this.board = Array.from({ length: this.xbyx }, () => Array(this.xbyx).fill(null));

        this.pieces.forEach(piece => {
            this.setPositionOnBoard(piece.position, piece.id);
        })
    }

    private setPositionOnBoard(pos: Position, setTo: string | null) {
        this.board[pos[0]][pos[1]] = setTo;
    }

    private changeTurn() {
        this.turn = this.turn === "white" ? "black" : "white";
    }

    private blindMove(piece: ChessPieceOnPlay, newPos: Position, logMove: boolean = false) {
        this.setPositionOnBoard(piece.position, null);
        piece.position = newPos;
        this.setPositionOnBoard(piece.position, piece.id);

        // Log Piece
        if (logMove) this.movesLog.push(`${piece.name}-${this.asAlgebraicNotation(newPos)}`);
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

    movePiece(pieceId: string, newPos: Position) {
        // Get Piece form board
        const pieceSelected = this.getPieceById(pieceId); if (!pieceSelected) return;

        // Check if move is legal
        const availableMoves = pieceSelected.getAvailablePositions(this, pieceSelected.position);
        if (availableMoves.some(pos => pos[0] === newPos[0] && pos[1] === newPos[1])) {
            // Captures piece
            const pieceCapturedId = this.peekBoardPosition(newPos);
            if (pieceCapturedId) this.capturePiece(pieceCapturedId);

            // For cases of castling
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
                this.movesLog.push(isKingside ? "O-O" : "O-O-O");
            }

            // Swaps positions on the board
            this.blindMove(pieceSelected, newPos, true);

            // Changes team
            this.changeTurn();
        }
    }

    capturePiece(pieceId: string) {
        const capturePiece = this.getPieceById(pieceId); if (!capturePiece) return;
        capturePiece.isCaptured = true;
    }

    asAlgebraicNotation(pos: Position): string {
        let chars = "abcdefghijklmnop";
        return `${chars[pos[0]]}${pos[1] + 1}`;
    }

    static flipPosition(pos: Position, xbyx: AvailableChessboardSizes): Position {
        const flipper = (num: number) => xbyx - num - 1;
        return pos.map(p => flipper(p)) as Position;
    }
}


    // Mounds the Chessboard logic onto an HTML Template
class ChessboardHTML extends Chessboard {
    private chessboardContainerDiv: HTMLElement;
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
            pieceImage.src = `../assets/${piece.name.toLowerCase()}_${piece.side}.png`;
            pieceImage.alt = piece.name;
            pieceImage.classList.add("chess-piece");

            if (this.turn === piece.side) {
                pieceImage.addEventListener('click', () => {
                    this.setSelectedPiece(piece.id);
                })
            }

            square.appendChild(pieceImage);
        }

    }

    updateState() {
        this.displayBoard();
        this.displayPieces();
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
        if (pieceHasMoved(board, kingPiece)) return possibleMoves; // Returns moves if King hasn't moved

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
    private gameModeSelectionDiv: HTMLElement | null = document.getElementById("gameModeSelection");
    private gameModes: GameModeSelection[] = [
        {
            name: "Classic",
            description: "The standard, most classic way of playing Chess!",
            setUp: setUpClassicGame
        }
    ]
    private opponents: OpponentSelection[] = [
        {
            name: "AI",
            setUp: () => {}
        },
        {
            name: "Multiplayer",
            setUp: () => {}
        }
    ]

    constructor() {
        this.displayUI();
    }

    displayUI() {
        this.gameModes.forEach((mode) => {
            const button = document.createElement("button");
            button.innerText = mode.name;
            button.title = mode.description;

            button.addEventListener("click", () => {
                if (!this.gameModeSelectionDiv) return;
                const piecesSetUp = mode.setUp();
                new ChessboardHTML(8, piecesSetUp, "chessboardContainer");
                this.gameModeSelectionDiv.innerHTML = "";
            });

            if (!this.gameModeSelectionDiv) return;
            this.gameModeSelectionDiv.appendChild(button);
        });
    }
}


// Finally! Time to run the app!
document.addEventListener("DOMContentLoaded", () => {
    new App();
});
