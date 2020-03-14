let mapElement = document.getElementById("game");

let mapWidth = 35;
let mapHeight = 20;

let map = Array(mapHeight);

for (y = 0; y < mapHeight; y++) {
    map[y] = Array(mapWidth);
}

let defaultFg = "white"
let defaultBg = "black"

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
}

function insertTileAt(tile, x, y) {
    if (tile instanceof Tile) {
        map[Math.floor(y)][Math.floor(x)] = tile;
    } else {
        console.log("Not a tile");
    }
}

function fillMap(tile) {
    for (y = 0; y < mapHeight; y++) {
        for (x = 0; x < mapWidth; x++) {
            insertTileAt(tile, x, y);
        }
    }
}

function tick() {
    var table = "";

    for (row of map) {
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

fillMap(new Tile("."));
insertTileAt(new Tile("@"), mapWidth / 2, mapHeight / 2);

tick();
setInterval(tick, 500);
