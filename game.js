const mapElement = document.getElementById("game");
const messagesElement = document.getElementById("messages");

const fps = 10;

const defaultFg = "White";
const defaultBg = "Black";

function rand(min, max) {
    // Just in case they're not integers.
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randExclusive(min, max) {
    return rand(min, max - 1);
}

function clamp(x, min, max) {
    return Math.min(max, Math.max(x, min));
}

function message(text) {
    messagesElement.innerHTML += text + "<br>";

    // This somehow scrolls down to the bottom of the message log.
    messagesElement.scrollTop = messagesElement.scrollHeight;
}

message('<span style="color:purple">Welcome!</span>')

// Level is hoisted for quite a while, so the variable has to be declared here.
let level;

class Frame {
    // `character' defaults to no-break space because regular space breaks
    // everything.
    constructor(character="&#160", fg=defaultFg, bg=defaultBg) {
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
        return this.frames[this._frameIndex];
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
    // `animation' - either an Animation, a Frame, or a character.
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

    onStep(_entity) {
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

class Movable extends Tile {
    constructor(animation) {
        super(animation)

        this._x = 0;
        this._y = 0;
    }

    // True if this Movable can phase through walls.
    get phasing() {
        return false;
    }

    // True if this Movable doesn't trigger Tile::onStep() nor a level update.
    get dummy() {
        return false;
    }

    get level() {
        return level;
    }

    set level(_level) {
        // Placeholder.
    }

    get x() {
        return this._x;
    }

    set x(x) {
        if (this.level.isInBounds(x, 0)) {
            this._x = x;
        }
    }

    get y() {
        return this._y;
    }

    set y(y) {
        if (this.level.isInBounds(0, y)) {
            this._y = y;
        }
    }

    randomSpot() {
        let x, y = -1;

        while (this.collide(x, y)) {
            x = randExclusive(0, level.width);
            y = randExclusive(0, level.height);
        }

        return [x, y];
    }

    // Return true if you can't go through the tile at [x; y].
    collide(x=this.x, y=this.y) {
        if (this.level.isInBounds(x, y)) {
            return this.level.get(x, y).impassable;
        } else {
            return true;
        }
    }

    move(direction) {
        // String directions like N, S, NW, SE are viable, too.
        if (typeof direction == "string") {
            direction = directions[direction];
        }

        const dx = direction[0];
        const dy = direction[1];

        if (this.phasing
            || (!this.collide(this.x + dx, this.y + dy)
                && (!this.collide(this.x + dx, this.y)
                    || !this.collide(this.x, this.y + dy)))) {
            this.x += dx;
            this.y += dy;

            if (!this.dummy) {
                this.level.get(this.x, this.y).onStep(this);
            }

            return true;
        }

        return false;
    }
}

class Entity extends Movable {
    constructor(animation) {
        super(animation);

        this._hp = 100;
    }

    get hp() {
        return this._hp;
    }

    set hp(hp) {
        this._hp = hp;
    }

    damage(dmg) {
        this.hp -= dmg;

        // Hp before getting damaged must be positive in order to actually die.
        if (this.hp <= 0 && this.hp + dmg > 0) {
            this.onDeath();
            this.level.remove(this);
        }
    }

    heal(h) {
        this.hp += h;

        // Hp before healing is negative or zero if you're dead, of course.
        if (this.hp - h <= 0 && this.hp > 0) {
            this.onRevive();
        }
    }

    onDeath() {
        message('<span style="color:red">You are dead!</span>');
        return this.level.add(new Corpse(this));
    }

    onRevive() {
        message('<span style="color:green">You have come back to life!</span>');
    }

    onRemove() {
        // Override this.
    }

    onAdd() {
        // Override this.
    }
}

// "Dead animation" is just the first frame with a blood-covered background.
function getDeadAnimation(entity) {
    let frame = entity.animation.frames[0];
    return new Frame(frame.character, frame.fg, "DarkRed");
}

class Corpse extends Entity {
    constructor(entity) {
        super(getDeadAnimation(entity));

        // The entity still exists between the worlds, I guess.
        this.owner = entity;
    }

    onRevive() {
        this.level.add(this.owner);
        this.level.remove(this);

        this.owner.x = this.x;
        this.owner.y = this.y;
        this.owner.hp = this.hp;

        this.owner.onRevive();
    }

    onAdd() {
        this.x = this.owner.x;
        this.y = this.owner.y;
        this.hp = this.owner.hp;
    }

    move(dx, dy) {
        // Corpses can't move by themselves, unless they're zombies.
    }
}

class Camera extends Movable {
    constructor(level) {
        super(new Frame());

        this.anchorOn(level.player);
        this._radius = 10;
    }

    get phasing() {
        return true;
    }

    get dummy() {
        return true;
    }

    get radius() {
        return this._radius;
    }

    set radius(radius) {
        this._radius = radius;
    }

    get anchorX() {
        return this._anchorX;
    }

    set anchorX(anchorX) {
        this._anchorX = anchorX;
    }

    get anchorY() {
        return this._anchorY;
    }

    set anchorY(anchorY) {
        this._anchorY = anchorY;
    }

    anchorOn(movable) {
        this.anchorX = this.x = movable.x;
        this.anchorY = this.y = movable.y;
    }

    isInside(dx, dy) {
        dx += this.x - this.anchorX;
        dy += this.y - this.anchorY;

        return dx*dx + dy*dy <= this.radius * this.radius;
    }

    draw(dx, dy, frame) {
        dx += this.radius;
        dy += this.radius;

        if (!this.display[dy]) {
            this.display[dy] = [];
        }

        this.display[dy][dx] = frame;
    }

    toWorld(dx, dy) {
        return [this.x + dx, this.y + dy];
    }

    toCamera(x, y) {
        return [x - this.x, y - this.y];
    }

    crop() {
        this.display = [];

        for (let dy = -this.radius; dy <= this.radius; dy++) {
            for (let dx = -this.radius; dx <= this.radius; dx++) {
                const [x, y] = this.toWorld(dx, dy);

                if (this.level.isInBounds(x, y) && this.isInside(dx, dy)) {
                    this.draw(dx, dy, this.level.get(x, y).animation.nextFrame());
                } else {
                    this.draw(dx, dy, new Frame());
                }
            }
        }

        for (const entity of this.level.entities) {
            const [dx, dy] = this.toCamera(entity.x, entity.y);

            if (this.isInside(dx, dy)) {
                this.draw(dx, dy, entity.animation.nextFrame());
            }
        }

        return this.display;
    }
}

class Player extends Entity {
    constructor(color) {
        super(new Frame("@", color));
    }

    onDeath() {
        // Set the level's player to their own corpse.
        return this.level.player = super.onDeath();
    }

    onAdd() {
        [this.x, this.y] = this.randomSpot();
        this.level.player = this;
        this.level.camera = new Camera(this.level);
    }

    move(dx, dy) {
        if (super.move(dx, dy)) {
            // Anchor camera as well.
            this.level.camera.anchorOn(this);
            return true;
        } else {
            return false;
        }
    }
}

class Level {
    constructor(width, height) {
        this._width = width;
        this._height = height;

        this._map = [];

        this._entities = [];

        message('<span style="color:purple">Generating level...</span>')
        this.generate();
        message('<span style="color:purple">Done! Have fun!</span>')
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
    }

    update() {
        // TODO: make this do something.
    }

    generate() {
        const wallFrequency = 0.325;

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

        for (const row of level.camera.crop()) {
            table += "<tr>";

            for (const frame of row) {
                // Ugly, on-the-fly style generation.
                const style
                      = "font-family:monospace"
                      + ";color:" + frame.fg
                      + ";background:" + frame.bg
                      + ";border-spacing=0px"
                      + ";font-size: 1vw;";
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
        return entity;
    }

    remove(entity) {
        entity.onRemove();
        this.entities.splice(this.entities.indexOf(entity), 1);
    }

    insert(tile, x, y) {
        if (!this.map[y]) {
            this.map[y] = [];
        }

        this.map[y][x] = tile;
    }

    get(x, y) {
        // map[y][x] will throw an exception if map[y] is undefined.
        return this.map[y] ? this.map[y][x] : undefined;
    }

    isInBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
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
        // Very ugly, but this includes all walls in a 3x3 area around [x; y].
        const candidates = [[x - 1, y + 1],
                            [x + 0, y + 1],
                            [x + 1, y + 1],
                            [x - 1, y + 0],
                            [x + 0, y + 0],
                            [x + 1, y + 0],
                            [x - 1, y - 1],
                            [x + 0, y - 1],
                            [x + 1, y - 1]];

        let walls = 0;

        for (const position of candidates) {
            walls += this.isWall(...position)
        }

        return walls;
    }

    runCellularAutomation() {
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                // 4-5 rule.
                if (this.countWalls(x, y) >= 5) {
                    this.insert(new Wall(), x, y);
                }
            }
        }
    }

    generate() {
        super.generate();

        const iterations = 4;

        for (let i = 0; i < iterations; i++) {
            this.runCellularAutomation();
        }
    }
}

class GameState {
    constructor() {
        this.moving = this.level.player;
    }

    get moving() {
        return this._moving;
    }

    set moving(moving) {
        this._moving = moving;
    }

    get level() {
        return level;
    }

    move(direction) {
        const ret = this.moving.move(direction);
        return this.moving.dummy ? false : ret;
    }
}

level = new CaveLevel(80, 80);
level.add(new Player("Gray"));

let state = new GameState();

document.addEventListener('keydown', function(event) {
    movement = {
        "1": "sw",
        "2": "s",
        "3": "se",
        "4": "w",
        "6": "e",
        "7": "nw",
        "8": "n",
        "9": "ne"
    };

    const key = event.key

    let moved = false;

    if (key == "l") {
        state.moving = level.camera;
        message('<span style="color:gray">Looking around</span>')
    } else if (key == "Escape") {
        state.moving = level.player;
        level.camera.anchorOn(level.player);
        message('<span style="color:gray">Back to the game</span>')
    }

    if (key in movement) {
        moved = state.move(movement[key]);
    }

    if (key == "5" || moved) {
        level.update();
    }
});

setInterval(function() { level.render() }, 1000 / fps);
