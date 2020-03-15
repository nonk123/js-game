let mapElement = document.getElementById("game");

let defaultFg = "white";
let defaultBg = "black";

function rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randExclusive(min, max) {
    return rand(min, max - 1);
}

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

class Entity extends Tile {
    constructor(level, x, y, character, color) {
        super(character, true, color);

        this._level = level;
        this._x = x;
        this._y = y;

        level.add(this)
    }

    get level() {
        return this._level;
    }

    set level(level) {
        this._level = level;
    }

    get x() {
        return this._x;
    }

    set x(x) {
        this._x = x;
    }

    get y() {
        return this._y;
    }

    set y(y) {
        this._y = y;
    }

    collide(x=this.x, y=this.y) {
        return this.level.get(x, y).impassable;
    }
}

class Player extends Entity {
    constructor(level, color) {
        super(level, 0, 0, "@", color);

        var x = 0;
        var y = 0;

        while (this.collide(x, y)) {
            x = randExclusive(0, level.width);
            y = randExclusive(0, level.height);
        }

        this.x = x;
        this.y = y;
    }
}

class Level {
    constructor(width, height) {
        this._width = width;
        this._height = height;

        this._map = [];

        for (var y = 0; y < this.height; y++) {
            this._map[y] = [];
        }

        this._entities = [];

        this.generate();

        this._player = new Player(this, "green");
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

    add(entity) {
        this.entities.push(entity);
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

    let display = [];

    for (row of level.map) {
        display.push(row);
    }

    for (entity of level.entities) {
        display[entity.y][entity.x] = entity;
    }

    for (row of display) {
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
