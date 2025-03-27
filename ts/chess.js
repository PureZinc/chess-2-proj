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
var randomIdGenerator = function () { return Math.random().toString(36).substring(2, length + 2); };
var Chessboard = /** @class */ (function () {
    function Chessboard(xbyx, pieces) {
        var _this = this;
        this.xbyx = xbyx;
        this.pieces = pieces;
        this.turn = "white";
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
            // Swaps positions on the board
            this.setPositionOnBoard(pieceSelected.position, null);
            pieceSelected.position = newPos;
            this.setPositionOnBoard(pieceSelected.position, pieceSelected.id);
            // Log move
            this.movesLog.push("".concat(pieceSelected.name).concat(this.asAlgebraicNotation(newPos)));
        }
    };
    Chessboard.prototype.capturePiece = function (pieceId) {
        var capturePiece = this.getPieceById(pieceId);
        if (!capturePiece)
            return;
        capturePiece.isCaptured = false;
    };
    Chessboard.prototype.asAlgebraicNotation = function (pos) {
        var chars = "abcdefghijklmnop";
        return "".concat(chars[pos[0]]).concat(pos[1] + 1);
    };
    Chessboard.flipPosition = function (pos, xbyx) {
        var flipper = function (num) { return xbyx - num - 1; };
        return pos.map(function (p) { return flipper(p); });
    };
    return Chessboard;
}());
var ChessboardHTML = /** @class */ (function (_super) {
    __extends(ChessboardHTML, _super);
    function ChessboardHTML(xbyx, pieces, elmId) {
        if (elmId === void 0) { elmId = "chessboard"; }
        var _this = _super.call(this, xbyx, pieces) || this;
        _this.xbyx = xbyx;
        _this.pieces = pieces;
        var checkDiv = document.getElementById(elmId);
        if (!checkDiv) {
            console.error("Div with id '".concat(elmId, "' doesn't exist"));
            return _this;
        }
        ;
        _this.chessboardDiv = checkDiv;
        _this.displayBoard();
        _this.displayPieces();
        return _this;
    }
    ChessboardHTML.prototype.displayBoard = function () {
        if (!this.chessboardDiv)
            return;
        var _loop_1 = function (row) {
            var _loop_2 = function (col) {
                var square = document.createElement("div");
                square.classList.add("square");
                square.id = "pos-".concat(row, "-").concat(col);
                if (this_1.selectedPieceAvailableMoves().some(function (pos) { return pos[0] === row && pos[1] === col; })) {
                    square.classList.add("available");
                }
                else if ((row + col) % 2 === 0) {
                    square.classList.add("white");
                }
                else {
                    square.classList.add("black");
                }
                this_1.chessboardDiv.appendChild(square);
            };
            for (var col = 0; col < 8; col++) {
                _loop_2(col);
            }
        };
        var this_1 = this;
        for (var row = 7; row >= 0; row--) {
            _loop_1(row);
        }
    };
    ChessboardHTML.prototype.displayPieces = function () {
        for (var _i = 0, _a = this.pieces; _i < _a.length; _i++) {
            var piece = _a[_i];
            if (piece.isCaptured)
                continue;
            var square = document.getElementById("pos-".concat(piece.position[1], "-").concat(piece.position[0]));
            if (!square)
                continue;
            var pieceImage = document.createElement("img");
            pieceImage.src = "../assets/".concat(piece.name.toLowerCase(), "_").concat(piece.side, ".png");
            pieceImage.alt = piece.name;
            pieceImage.classList.add("chess-piece");
            square.appendChild(pieceImage);
        }
    };
    ChessboardHTML.prototype.selectedPieceAvailableMoves = function () {
        if (!this.selectedPieceId)
            return [];
        var selPiece = this.getPieceById(this.selectedPieceId);
        return (selPiece === null || selPiece === void 0 ? void 0 : selPiece.getAvailablePositions(this, selPiece.position)) || [];
    };
    ChessboardHTML.prototype.movePiece = function (pieceId, newPos) {
        _super.prototype.movePiece.call(this, pieceId, newPos);
        this.displayPieces();
    };
    return ChessboardHTML;
}(Chessboard));
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
// Pawn
var pawnPiece = {
    name: "Pawn",
    description: "Moves forward, protecting the team!",
    getAvailablePositions: function (board, pos) { return [[0, 0]]; }
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
            .filter(function (_a) {
            var x = _a[0], y = _a[1];
            return x >= 0 && x < board.xbyx && y >= 0 && y < board.xbyx;
        })
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
        return kingMovesAvailable.map(function (_a) {
            var dx = _a[0], dy = _a[1];
            return [pos[0] + dx, pos[1] + dy];
        })
            .filter(function (_a) {
            var x = _a[0], y = _a[1];
            return x >= 0 && x < board.xbyx && y >= 0 && y < board.xbyx;
        })
            .filter(function (pos) { return !sameTeamPosTaken(board, pos); });
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
                if (x < 0 || x >= board.xbyx || y < 0 || y >= board.xbyx)
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
                if (x < 0 || x >= board.xbyx || y < 0 || y >= board.xbyx)
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
document.addEventListener("DOMContentLoaded", function () {
    var classicGame = setUpClassicGame();
    new ChessboardHTML(8, classicGame, "chessboard");
});
