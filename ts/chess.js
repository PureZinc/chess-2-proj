// Everything is contained here!
// In a larger-scale project, I'd definitely modularize my project into folders!
// However, due to limits with import/export in pure HTML/CSS/JS, the source code is all on one file.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// Utilities
var randomIdGenerator = function () { return Math.random().toString(36).substring(2, 8); };
// Classes
var Chessboard = /** @class */ (function () {
    function Chessboard(xbyx, pieces) {
        var _this = this;
        this.xbyx = xbyx;
        this.pieces = pieces;
        this.turn = "white";
        this.movesLog = [];
        this.board = Array.from({ length: this.xbyx }, function () { return Array(_this.xbyx).fill(null); });
        this.pieces.forEach(function (piece) {
            _this.setPositionOnBoard(piece.position, piece.id);
        });
    }
    Chessboard.prototype.setPositionOnBoard = function (pos, setTo) {
        this.board[pos[0]][pos[1]] = setTo;
    };
    Chessboard.prototype.changeTurn = function () {
        this.turn = this.turn === "white" ? "black" : "white";
    };
    Chessboard.prototype.blindMove = function (piece, newPos, logMove) {
        if (logMove === void 0) { logMove = false; }
        this.setPositionOnBoard(piece.position, null);
        piece.position = newPos;
        this.setPositionOnBoard(piece.position, piece.id);
        // Log Piece
        if (logMove)
            this.movesLog.push("".concat(piece.name, "-").concat(this.asAlgebraicNotation(newPos)));
    };
    Chessboard.prototype.getSideMoves = function () {
        var counter = this.turn === "white" ? 0 : 1;
        return this.movesLog.filter(function (_, index) { return index % 2 === counter; });
    };
    Chessboard.prototype.getPieceById = function (pieceId) {
        return this.pieces.find(function (piece) { return piece.id === pieceId; });
    };
    Chessboard.prototype.peekBoardPosition = function (pos) {
        return this.board[pos[0]][pos[1]];
    };
    Chessboard.prototype.movePiece = function (pieceId, newPos) {
        // Get Piece form board
        var pieceSelected = this.getPieceById(pieceId);
        if (!pieceSelected)
            return;
        // Check if move is legal
        var availableMoves = pieceSelected.getAvailablePositions(this, pieceSelected.position);
        if (availableMoves.some(function (pos) { return pos[0] === newPos[0] && pos[1] === newPos[1]; })) {
            // Captures piece
            var pieceCapturedId = this.peekBoardPosition(newPos);
            if (pieceCapturedId)
                this.capturePiece(pieceCapturedId);
            // For cases of castling
            if (pieceSelected.name === "King"
                && Math.abs(newPos[0] - pieceSelected.position[0]) > 1) {
                var kingRow = pieceSelected.position[1];
                var isKingside = newPos[0] > pieceSelected.position[0];
                var rookStartCol = isKingside ? this.xbyx - 1 : 0;
                var rookNewCol = isKingside
                    ? newPos[0] - 1
                    : newPos[0] + 1;
                var rookId = this.peekBoardPosition([rookStartCol, kingRow]);
                if (!rookId)
                    return;
                var rook = this.getPieceById(rookId);
                if (!rook || rook.name !== "Rook")
                    return;
                // Moves the Rook
                this.blindMove(rook, [rookNewCol, kingRow]);
                // Log castling move
                this.movesLog.push("Castle");
                this.movesLog.push(isKingside ? "O-O" : "O-O-O");
            }
            // Swaps positions on the board
            this.blindMove(pieceSelected, newPos, true);
            // Changes team
            this.changeTurn();
        }
    };
    Chessboard.prototype.capturePiece = function (pieceId) {
        var capturePiece = this.getPieceById(pieceId);
        if (!capturePiece)
            return;
        capturePiece.isCaptured = true;
    };
    Chessboard.prototype.asAlgebraicNotation = function (pos) {
        var chars = "abcdefghijklmnop";
        return "".concat(chars[pos[0]]).concat(pos[1] + 1);
    };
    Chessboard.flipPosition = function (pos, xbyx) {
        var flipper = function (num) { return xbyx - num - 1; };
        return pos.map(function (p) { return flipper(p); });
    };
    // Saving and Loading
    Chessboard.prototype.getSaveGameData = function () {
        return {
            movesLog: this.movesLog,
            xbyx: this.xbyx,
            pieces: this.pieces
        };
    };
    Chessboard.loadGame = function (data) {
        var chessboard = new Chessboard(data.xbyx, data.pieces);
        chessboard.movesLog = data.movesLog;
        chessboard.turn = data.movesLog.length % 2 === 0 ? "white" : "black";
        return chessboard;
    };
    return Chessboard;
}());
// Pieces
//Built-In Utilities
var sameTeamPosTaken = function (board, pos) {
    var loc = board.peekBoardPosition(pos);
    if (!loc)
        return false;
    var piece = board.getPieceById(loc);
    if ((piece === null || piece === void 0 ? void 0 : piece.side) === board.turn)
        return true;
    return false;
};
var oppositeTeamPosTaken = function (board, pos) {
    var loc = board.peekBoardPosition(pos);
    if (!loc)
        return false;
    var piece = board.getPieceById(loc);
    if ((piece === null || piece === void 0 ? void 0 : piece.side) !== board.turn)
        return true;
    return false;
};
var withinBoard = function (board, pos) {
    var x = pos[0], y = pos[1];
    return x >= 0 && x < board.xbyx && y >= 0 && y < board.xbyx;
};
var pieceHasMoved = function (board, piece) {
    return board.getSideMoves().some(function (move) { return move.includes(piece.name); });
};
// Pawn
var pawnPiece = {
    name: "Pawn",
    description: "Moves forward, protecting the team!",
    getAvailablePositions: function (board, pos) {
        var direction = board.turn === "white" ? 1 : -1; // White moves up, Black moves down
        var startRow = board.turn === "white" ? 1 : board.xbyx - 2;
        var possibleMoves = [];
        var oneStep = [pos[0], pos[1] + direction];
        if (!sameTeamPosTaken(board, oneStep) && !oppositeTeamPosTaken(board, oneStep)) {
            possibleMoves.push(oneStep);
            // First move has two steps forward
            if (pos[1] === startRow) {
                var twoStep = [pos[0], pos[1] + 2 * direction];
                if (!sameTeamPosTaken(board, twoStep) && !oppositeTeamPosTaken(board, twoStep)) {
                    possibleMoves.push(twoStep);
                }
            }
        }
        ;
        // Pawns can capture pieces diagonally
        [
            [pos[0] - 1, pos[1] + direction],
            [pos[0] + 1, pos[1] + direction]
        ].forEach(function (capturePos) {
            if (withinBoard(board, capturePos) && oppositeTeamPosTaken(board, capturePos)) {
                possibleMoves.push(capturePos);
            }
        });
        // Ensure all moves stay within board limits
        return possibleMoves.filter(function (p) { return withinBoard(board, p); });
    }
};
// Knight
var knightPiece = {
    name: "Knight",
    description: "Moves in L-shape",
    getAvailablePositions: function (board, pos) {
        var knightMoves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];
        return knightMoves
            .map(function (_a) {
            var dx = _a[0], dy = _a[1];
            return [pos[0] + dx, pos[1] + dy];
        })
            .filter(function (p) { return withinBoard(board, p); })
            .filter(function (pos) { return !sameTeamPosTaken(board, pos); });
    }
};
// King
var kingPiece = {
    name: "King",
    description: "Moves one square in any direction",
    getAvailablePositions: function (board, pos) {
        var kingMovesAvailable = [
            [1, 0], [1, 1], [0, 1], [-1, 1],
            [-1, 0], [-1, -1], [0, -1], [1, -1]
        ];
        var possibleMoves = kingMovesAvailable
            .map(function (_a) {
            var dx = _a[0], dy = _a[1];
            return [pos[0] + dx, pos[1] + dy];
        })
            .filter(function (pos) { return withinBoard(board, pos); })
            .filter(function (pos) { return !sameTeamPosTaken(board, pos); });
        // Add castling moves
        var kingId = board.peekBoardPosition(pos);
        if (!kingId)
            return possibleMoves;
        var kingPiece = board.getPieceById(kingId);
        if (!kingPiece)
            return possibleMoves;
        if (pieceHasMoved(board, kingPiece))
            return possibleMoves; // Returns moves if King already moved
        var team = kingPiece.side;
        var col = pos[1];
        var tryCastle = function (rookRow, pathRows, targetRow) {
            var rookId = board.peekBoardPosition([rookRow, col]);
            if (!rookId)
                return;
            var rook = board.getPieceById(rookId);
            if (!rook
                || rook.name !== "Rook"
                || rook.side !== team
                || pieceHasMoved(board, rook))
                return;
            // Checks if all spaces between King and Rook are empty
            for (var _i = 0, pathRows_1 = pathRows; _i < pathRows_1.length; _i++) {
                var row = pathRows_1[_i];
                if (!!board.peekBoardPosition([row, col]))
                    return;
            }
            possibleMoves.push([targetRow, col]);
        };
        // Kingside castling
        tryCastle(7, [4, 5, 6], 5);
        // Queenside castling
        tryCastle(0, [1, 2], 1);
        return possibleMoves;
    }
};
// Rook
var rookPiece = {
    name: "Rook",
    description: "Moves horizontally and vertically",
    getAvailablePositions: function (board, pos) {
        var availablePos = [];
        var directions = [
            [1, 0], [-1, 0],
            [0, -1], [0, 1]
        ];
        for (var _i = 0, directions_1 = directions; _i < directions_1.length; _i++) {
            var _a = directions_1[_i], dx = _a[0], dy = _a[1];
            var x = pos[0], y = pos[1];
            while (true) {
                x += dx;
                y += dy;
                if (!withinBoard(board, [x, y]))
                    break;
                var newPos = [x, y];
                if (sameTeamPosTaken(board, newPos))
                    break;
                availablePos.push(newPos);
                if (oppositeTeamPosTaken(board, newPos))
                    break;
            }
        }
        return availablePos;
    }
};
// Bishop
var bishopPiece = {
    name: "Bishop",
    description: "Moves diagonally",
    getAvailablePositions: function (board, pos) {
        var availablePos = [];
        var directions = [
            [1, 1], [-1, -1],
            [1, -1], [-1, 1]
        ];
        for (var _i = 0, directions_2 = directions; _i < directions_2.length; _i++) {
            var _a = directions_2[_i], dx = _a[0], dy = _a[1];
            var x = pos[0], y = pos[1];
            while (true) {
                x += dx;
                y += dy;
                if (!withinBoard(board, [x, y]))
                    break;
                var newPos = [x, y];
                if (sameTeamPosTaken(board, newPos))
                    break;
                availablePos.push(newPos);
                if (oppositeTeamPosTaken(board, newPos))
                    break;
            }
        }
        return availablePos;
    }
};
// Queen
var queenPiece = {
    name: "Queen",
    description: "Moves in any direction that Bishop's and Knights do",
    getAvailablePositions: function (board, pos) {
        var bishopMoves = bishopPiece.getAvailablePositions(board, pos);
        var rookMoves = rookPiece.getAvailablePositions(board, pos);
        return __spreadArray(__spreadArray([], bishopMoves, true), rookMoves, true);
    }
};
// All Pieces
var chessPieces = [
    pawnPiece, rookPiece, knightPiece, bishopPiece,
    queenPiece, kingPiece,
];
// Games available
var setUpClassicGame = function () {
    var positionMap = {
        "Pawn": Array.from({ length: 8 }, function (_, i) { return [i, 1]; }),
        "Rook": [[0, 0], [7, 0]],
        "Knight": [[1, 0], [6, 0]],
        "Bishop": [[2, 0], [5, 0]],
        "Queen": [[4, 0]],
        "King": [[3, 0]]
    };
    var pieceLayout = [];
    for (var _i = 0, chessPieces_1 = chessPieces; _i < chessPieces_1.length; _i++) {
        var piece = chessPieces_1[_i];
        var positions = positionMap[piece.name];
        // White Pieces
        for (var _a = 0, positions_1 = positions; _a < positions_1.length; _a++) {
            var pos = positions_1[_a];
            var pieceId = randomIdGenerator();
            pieceLayout.push(__assign(__assign({}, piece), { id: pieceId, position: pos, isCaptured: false, side: "white" }));
        }
        // Black Pieces
        for (var _b = 0, positions_2 = positions; _b < positions_2.length; _b++) {
            var pos = positions_2[_b];
            var pieceId = randomIdGenerator();
            // Makes sure that the queen & king are on the same column.
            var flippedPos = void 0;
            if (piece.name === "King" || piece.name === "Queen") {
                flippedPos = [pos[0], 8 - pos[1] - 1];
            }
            else {
                flippedPos = Chessboard.flipPosition(pos, 8);
            }
            pieceLayout.push(__assign(__assign({}, piece), { id: pieceId, position: flippedPos, isCaptured: false, side: "black" }));
        }
    }
    return pieceLayout;
};
// class Router {
//     private routes: Map<string, PageComponent> = new Map();
//     private root: HTMLElement;
//     constructor(rootId: string) {
//         const rootEl = document.getElementById(rootId);
//         if (!rootEl) throw new Error(`Root element '${rootId}' not found`);
//         this.root = rootEl;
//         window.addEventListener("popstate", () => this.render(location.pathname));
//     }
//     register(path: string, component: PageComponent) {
//         this.routes.set(path, component);
//     }
//     navigate(path: string) {
//         history.pushState({}, "", path);
//         this.render(path);
//     }
//     render(path: string) {
//         this.root.innerHTML = ""; // clear page
//         const component = this.routes.get(path);
//         if (!component) {
//             this.root.innerHTML = "<h1>404 - Page Not Found</h1>";
//             return;
//         }
//         component();
//     }
// }
var MainScreen = /** @class */ (function () {
    function MainScreen() {
        this.gameModes = [
            {
                name: "Classic",
                description: "The standard, most classic way of playing Chess!",
                setUp: setUpClassicGame
            }
        ];
        this.rootDiv = document.getElementById("root");
        this.displayUI();
    }
    MainScreen.prototype.displayUI = function () {
        var _a;
        var gameModeSelectionDiv = document.createElement("div");
        gameModeSelectionDiv.className = "main-container";
        var title = document.createElement("p");
        title.innerText = "Choose Game Mode";
        gameModeSelectionDiv.appendChild(title);
        var gameModeSelection = document.createElement("div");
        gameModeSelection.id = "gameModeSelection";
        this.gameModes.forEach(function (mode) {
            var button = document.createElement("button");
            button.innerText = mode.name;
            button.title = mode.description;
            button.addEventListener("click", function () {
                var piecesSetUp = mode.setUp();
                new ChessboardHTML(8, piecesSetUp, "chessboardContainer");
                gameModeSelectionDiv.remove();
            });
            gameModeSelection.appendChild(button);
        });
        gameModeSelectionDiv.appendChild(gameModeSelection);
        (_a = this.rootDiv) === null || _a === void 0 ? void 0 : _a.appendChild(gameModeSelectionDiv);
    };
    return MainScreen;
}());
var ChessboardHTML = /** @class */ (function (_super) {
    __extends(ChessboardHTML, _super);
    function ChessboardHTML(xbyx, pieces, elmId) {
        if (elmId === void 0) { elmId = "chessboardContainer"; }
        var _this = _super.call(this, xbyx, pieces) || this;
        _this.xbyx = xbyx;
        _this.pieces = pieces;
        _this.rootDiv = document.getElementById("root");
        _this.getPieceDesign = function (piece) { return "../assets/".concat(piece.name.toLowerCase(), "_").concat(piece.side, ".png"); };
        var checkDiv = document.getElementById(elmId);
        if (!checkDiv) {
            console.error("Div with id '".concat(elmId, "' doesn't exist"));
            return _this;
        }
        ;
        _this.chessboardContainerDiv = checkDiv;
        _this.updateState();
        return _this;
    }
    ChessboardHTML.prototype.getCapturedHTML = function (side) {
        var _this = this;
        return this.pieces
            .filter(function (p) { return p.isCaptured && p.side === side; })
            .map(function (p) { return "<img src=\"".concat(_this.getPieceDesign(p), "\" alt=\"").concat(p.name, "\">"); })
            .join("");
    };
    ChessboardHTML.prototype.displayBoard = function () {
        var _this = this;
        if (!this.chessboardContainerDiv)
            return;
        this.chessboardContainerDiv.innerHTML = "";
        var chessboardDiv = document.createElement('div');
        chessboardDiv.id = "chessboard";
        var availableMoves = this.selectedPieceAvailableMoves();
        var _loop_1 = function (col) {
            var _loop_2 = function (row) {
                var square = document.createElement("div");
                square.classList.add("square");
                square.id = "pos-".concat(row, "-").concat(col);
                if (availableMoves.some(function (pos) { return pos[0] === row && pos[1] === col; })) {
                    square.classList.add("available");
                    square.addEventListener('click', function () {
                        if (!_this.selectedPieceId)
                            return;
                        _this.movePiece(_this.selectedPieceId, [row, col]);
                    });
                }
                else if ((row + col) % 2 === 0) {
                    square.classList.add("white");
                }
                else {
                    square.classList.add("black");
                }
                chessboardDiv.appendChild(square);
            };
            for (var row = 0; row < this_1.xbyx; row++) {
                _loop_2(row);
            }
        };
        var this_1 = this;
        for (var col = this.xbyx - 1; col >= 0; col--) {
            _loop_1(col);
        }
        this.chessboardContainerDiv.appendChild(chessboardDiv);
    };
    ChessboardHTML.prototype.displayPieces = function () {
        var _this = this;
        var _loop_3 = function (piece) {
            if (piece.isCaptured)
                return "continue";
            var square = document.getElementById("pos-".concat(piece.position[0], "-").concat(piece.position[1]));
            if (!square)
                return "continue";
            var pieceImage = document.createElement("img");
            pieceImage.src = this_2.getPieceDesign(piece);
            pieceImage.alt = piece.name;
            pieceImage.classList.add("chess-piece");
            if (this_2.turn === piece.side) {
                pieceImage.addEventListener('click', function () {
                    _this.setSelectedPiece(piece.id);
                });
            }
            square.appendChild(pieceImage);
        };
        var this_2 = this;
        for (var _i = 0, _a = this.pieces; _i < _a.length; _i++) {
            var piece = _a[_i];
            _loop_3(piece);
        }
    };
    ChessboardHTML.prototype.displayDetails = function () {
        if (this.gameDetailsDiv)
            this.gameDetailsDiv.remove();
        var details = document.createElement("div");
        details.id = "chessboard-details";
        // Turn Indicator
        var turnIndicator = document.createElement("div");
        turnIndicator.classList.add("details-block");
        turnIndicator.innerHTML = "<strong>Turn:</strong> <span id=\"turn-color\">".concat(this.turn, "</span>");
        details.appendChild(turnIndicator);
        // Move Log
        var moveLog = document.createElement("div");
        moveLog.classList.add("details-block");
        moveLog.innerHTML = "<strong>Moves:</strong><ul id=\"move-list\">".concat(this.movesLog.map(function (m) { return "<li>".concat(m, "</li>"); }).join(""), "</ul>");
        details.appendChild(moveLog);
        // Captured Pieces
        var capturedDiv = document.createElement("div");
        capturedDiv.classList.add("details-block");
        capturedDiv.innerHTML = "\n            <strong>Captured:</strong>\n            <div class=\"captured-row\"><span>White:</span> ".concat(this.getCapturedHTML("white"), "</div>\n            <div class=\"captured-row\"><span>Black:</span> ").concat(this.getCapturedHTML("black"), "</div>\n        ");
        details.appendChild(capturedDiv);
        this.gameDetailsDiv = details;
        this.chessboardContainerDiv.appendChild(details);
    };
    ChessboardHTML.prototype.updateState = function () {
        this.displayBoard();
        this.displayPieces();
        this.displayDetails();
    };
    ChessboardHTML.prototype.selectedPieceAvailableMoves = function () {
        if (!this.selectedPieceId)
            return [];
        var selPiece = this.getPieceById(this.selectedPieceId);
        return (selPiece === null || selPiece === void 0 ? void 0 : selPiece.getAvailablePositions(this, selPiece.position)) || [];
    };
    ChessboardHTML.prototype.setSelectedPiece = function (id) {
        if (!this.getPieceById(id))
            return;
        this.selectedPieceId = this.selectedPieceId === id ? null : id;
        this.updateState();
    };
    ChessboardHTML.prototype.movePiece = function (pieceId, newPos) {
        _super.prototype.movePiece.call(this, pieceId, newPos);
        this.setSelectedPiece(pieceId);
    };
    return ChessboardHTML;
}(Chessboard));
var App = /** @class */ (function () {
    function App() {
        this.displayUI();
    }
    App.prototype.displayUI = function () {
        new MainScreen();
    };
    return App;
}());
// Finally! Time to run the app!
document.addEventListener("DOMContentLoaded", function () {
    new App();
});
