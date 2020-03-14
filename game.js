let mapElement = document.getElementById("game");

let defaultFg = "white";
let defaultBg = "black";

class Tile {
    constructor(character, impassable=false, fg=defaultFg, bg=defaultBg) {
        this._character = character;
        this._impassable = impassable;
        this._fg = fg;
        this._bg = bg;
    }

    get character() {
        return this._character;
    }

    set character(character) {
        this._character = character;
    }

    get impassable() {
        return this._impassable;
    }

    set impassable(impassable) {
        this._impassable = impassable;
    }

    get fg() {
        return this._fg;
    }

    set fg(fg) {
        this._fg = fg;
    }

    get bg() {
        return this._bg;
    }

    set bg(bg) {
        this._bg = bg;
    }
}

class Floor extends Tile {
    constructor(color=defaultFg) {
        super(".", false, color);
    }
}

class Wall extends Tile {
    constructor(color=defaultFg) {
        super("#", true, color);
    }
}

class Level {
    constructor(width, height) {
        this._width = width;
        this._height = height;

        this._map = Array(this.height);

        for (var y = 0; y < this.height; y++) {
            this._map[y] = Array(this.width);
        }

        this._entities = [];

        this.generate();
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get map() {
        return this._map;
    }

    get entities() {
        return this._entities;
    }

    generate() {
        let wallFrequency = 0.4;

        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                if (x == 0 || y == 0
                    || x == this.width - 1 || y == this.height - 1
                    || Math.random() <= wallFrequency) {
                    this.insert(new Wall(), x, y);
                } else {
                    this.insert(new Floor(), x, y);
                }
            }
        }
    }

    insert(tile, x, y) {
        this.map[y][x] = tile;
    }

    get(x, y) {
        return this.map[y][x];
    }
}

class CaveLevel extends Level {
    constructor(width, height) {
        super(width, height);
    }

    isWall(x, y) {
        return this.get(x, y) instanceof Wall;
    }

    countWalls(x, y) {
        let candidates = [this.get(x - 1, y + 1),
                          this.get(x + 0, y + 1),
                          this.get(x + 1, y + 1),
                          this.get(x - 1, y + 0),
                          this.get(x + 0, y + 0),
                          this.get(x + 1, y + 0),
                          this.get(x - 1, y - 1),
                          this.get(x + 0, y - 1),
                          this.get(x + 1, y - 1)];

        var walls = 0;

        for (var candidate of candidates) {
            walls += candidate instanceof Wall;
        }

        return walls;
    }

    runCellularAutomation() {
        for (var y = 1; y < this.height - 1; y++) {
            for (var x = 0; x < this.width - 1; x++) {
                if (this.countWalls(x, y) >= 5 && !this.isWall(x, y)) {
                    this.insert(new Wall(), x, y);
                }
            }
        }
    }

    generate() {
        super.generate();

        let iterations = 5;

        for (var i = 0; i < iterations; i++) {
            this.runCellularAutomation();
        }
    }
}

let level = new CaveLevel(50, 50);

function tick() {
    var table = "";

    for (row of level.map) {
        table += "<tr>";

        for (tile of row) {
            style = "font-family:monospace;color:" + tile.fg + ";background:"
                + tile.bg + ";border-spacing=0px";
            table += "<td style=\"" + style + "\">" + tile.character + "</td>";
        }

        table += "</tr>";
    }

    mapElement.innerHTML = table;
}

tick();
setInterval(tick, 500);
