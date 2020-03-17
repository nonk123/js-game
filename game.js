const mapElement = document.getElementById("game");

const fps = 10;

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

class Frame {
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
}

class Animation {
    constructor(...frames) {
        this._frames = frames;
        this._frameIndex = 0;
    }

    get frames() {
        return this._frames;
    }

    get currentFrame() {
        return this._frames[this._frameIndex];
    }

    nextFrame() {
        let frame = this.frames[this._frameIndex++];

        if (this._frameIndex >= this.frames.length) {
            this._frameIndex = 0;
        }

        return frame;
    }
}

class Tile {
    constructor(animation) {
        if (animation instanceof Animation) {
            this._animation = animation;
        } else if (animation instanceof Frame) {
            this._animation = new Animation(animation);
        } else {
            this._animation = new Animation(new Frame(animation));
        }
    }

    get animation() {
        return this._animation;
    }

    set animation(animation) {
        this._animation = animation;
    }

    get impassable() {
        return false;
    }

    update() {
        // Override this.
    }

    onStep(entity) {
        // Override this.
    }
}

class Floor extends Tile {
    constructor(color=defaultFg) {
        super(new Frame(".", color));
    }
}

class Wall extends Tile {
    constructor(color=defaultFg) {
        super(new Frame("#", color));
    }

    get impassable() {
        return true;
    }
}

class AnimationTest extends Tile {
    constructor() {
        super(new Animation(new Frame("|"),
                            new Frame("/"),
                            new Frame("-"),
                            new Frame("\\")))
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
    constructor(animation) {
        super(animation);

        this._x = -1;
        this._y = -1;
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
            this.level.get(this.x, this.y).onStep(this);
            return true;
        }

        return false;
    }
}

class Player extends Entity {
    constructor(color) {
        super(new Frame("@", color));
    }

    onAdd() {
        while (this.collide(this.x, this.y)) {
            this.x = randExclusive(0, level.width);
            this.y = randExclusive(0, level.height);
        }
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
        // TODO: make this do something.
    }

    generate() {
        const wallFrequency = 0.3;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (Math.random() <= wallFrequency) {
                    this.insert(new Wall(), x, y);
                } else {
                    this.insert(new Floor(), x, y);
                }
            }
        }

        this.insert(new AnimationTest(), this.width / 2, this.height / 2);
    }

    render() {
        let table = "";

        const display = [];

        for (const [y, row] of this.map.entries()) {
            display[y] = [];
            for (const [x, tile] of row.entries()) {
                display[y][x] = tile.animation.nextFrame();
            }
        }

        for (const entity of this.entities) {
            display[entity.y][entity.x] = entity.animation.nextFrame();
        }

        for (const row of display) {
            table += "<tr>";

            for (const frame of row) {
                const style = "font-family:monospace;color:" + frame.fg
                      + ";background:" + frame.bg + ";border-spacing=0px";
                table += "<td style=\"" + style + "\">" + frame.character + "</td>";
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
            for (let x = 1; x < this.width - 1; x++) {
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

level = new CaveLevel(10, 10);
level.player = new Player("gray");

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
});

setInterval(function() { level.render() }, 1000 / fps);
