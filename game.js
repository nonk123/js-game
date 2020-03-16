const mapElement = document.getElementById("game");

const defaultFg = "white";
const defaultBg = "black";

function rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randExclusive(min, max) {
    return rand(min, max - 1);
}

let level;

class Tile {
    constructor(character, fg=defaultFg, bg=defaultBg) {
        this._character = character;
        this._fg = fg;
        this._bg = bg;
    }

    get character() {
        return this._character;
    }

    set character(character) {
        this._character = character;
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

    get impassable() {
        return false;
    }

    onStep(entity) {
        // Override this.
    }
}

class Floor extends Tile {
    constructor(color=defaultFg) {
        super(".", color);
    }
}

class Wall extends Tile {
    constructor(color=defaultFg) {
        super("#", color);
    }

    get impassable() {
        return true;
    }
}

directions = {
    "w":  [-1,  0],
    "e":  [ 1,  0],
    "n":  [ 0, -1],
    "s":  [ 0,  1],
    "nw": [-1, -1],
    "ne": [ 1, -1],
    "sw": [-1,  1],
    "se": [ 1,  1]
};

class Entity extends Tile {
    constructor(x, y, character, color) {
        super(character, color);

        this._x = x;
        this._y = y;
    }

    get level() {
        return level;
    }

    set level(_level) {
        // Unused.
    }

    get x() {
        return this._x;
    }

    set x(x) {
        if (x >= 0 && x < this.level.width) {
            this._x = x;
        }
    }

    get y() {
        return this._y;
    }

    set y(y) {
        if (y >= 0 && y < this.level.height) {
            this._y = y;
        }
    }

    onAdd() {
        // Override this.
    }

    collide(x=this.x, y=this.y) {
        if (x >= 0 && x < this.level.width
            && y >= 0 && y < this.level.height) {
            return this.level.get(x, y).impassable;
        } else {
            return true;
        }
    }

    move(direction) {
        if (typeof direction == "string") {
            direction = directions[direction];
        }

        const dx = direction[0];
        const dy = direction[1];

        if (!this.collide(this.x + dx, this.y + dy)
            && (!this.collide(this.x + dx, this.y)
                || !this.collide(this.x, this.y + dy))) {
            this.x += dx;
            this.y += dy;
            this.level.get(this.x + dx, this.y + dy).onStep(this);
            return true;
        }

        return false;
    }
}

class Player extends Entity {
    constructor(color) {
        super(0, 0, "@", color);
    }

    onAdd() {
        let x = -1;
        let y = -1;

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

        for (let y = 0; y < this.height; y++) {
            this._map[y] = [];
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

    get player() {
        return this._player;
    }

    set player(player) {
        this._player = player;
        this.add(player);
    }

    update() {
        console.log("Updated");
    }

    generate() {
        const wallFrequency = 0.4;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (Math.random() <= wallFrequency) {
                    this.insert(new Wall(), x, y);
                } else {
                    this.insert(new Floor(), x, y);
                }
            }
        }
    }

    render() {
        let table = "";

        const display = [];

        for (const [y, row] of this.map.entries()) {
            display[y] = [];
            for (const [x, tile] of row.entries()) {
                display[y][x] = new Tile(tile.character, tile.fg, tile.bg);
            }
        }

        for (const entity of this.entities) {
            display[entity.y][entity.x] = new Tile(entity.character,
                                                   entity.fg,
                                                   entity.bg);
        }

        for (const row of display) {
            table += "<tr>";

            for (const tile of row) {
                const style = "font-family:monospace;color:" + tile.fg
                      + ";background:" + tile.bg + ";border-spacing=0px";
                table += "<td style=\"" + style + "\">" + tile.character + "</td>";
            }

            table += "</tr>";
        }

        mapElement.innerHTML = table;
    }

    add(entity) {
        entity._level = this;
        this.entities.push(entity);
        entity.onAdd();
        this.get(entity.x, entity.y).onStep(entity);
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
        const candidates = [this.get(x - 1, y + 1),
                            this.get(x + 0, y + 1),
                            this.get(x + 1, y + 1),
                            this.get(x - 1, y + 0),
                            this.get(x + 0, y + 0),
                            this.get(x + 1, y + 0),
                            this.get(x - 1, y - 1),
                            this.get(x + 0, y - 1),
                            this.get(x + 1, y - 1)];

        let walls = 0;

        for (const candidate of candidates) {
            walls += candidate instanceof Wall;
        }

        return walls;
    }

    runCellularAutomation() {
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                if (this.countWalls(x, y) >= 5 && !this.isWall(x, y)) {
                    this.insert(new Wall(), x, y);
                }
            }
        }
    }

    generate() {
        super.generate();

        const iterations = 3;

        for (let i = 0; i < iterations; i++) {
            this.runCellularAutomation();
        }
    }
}

level = new CaveLevel(50, 50);
level.player = new Player("green");

document.addEventListener('keydown', function(event) {
    movement = {
        97:  "sw", // Numpad 1
        98:  "s",  // Numpad 2
        99:  "se", // Numpad 3
        100: "w",  // Numpad 4
        102: "e",  // Numpad 6
        103: "nw", // Numpad 7
        104: "n",  // Numpad 8
        105: "ne"  // Numpad 9
    };

    let moved = false;

    if (event.keyCode in movement) {
        moved = level.player.move(movement[event.keyCode]);
    }

    // Numpad 5
    if (event.keyCode == 101 || moved) {
        level.update();
    }

    level.render();
});

level.render();
