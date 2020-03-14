let div = document.getElementById("game");

let mapWidth = 35;
let mapHeight = 20;

let map = Array(mapHeight);

for (y = 0; y < mapHeight; y++) {
    map[y] = Array(mapWidth);
}

function insertTileAt(tile, x, y) {
    map[Math.floor(y)][Math.floor(x)] = tile;
}

function fillMap(tile) {
    for (row of map) {
        row.fill(tile);
    }
}

function tick() {
    var table = "";

    for (row of map) {
        table += "<tr>";

        for (col of row) {
            style = "font-family:monospace";
            table += "<td style=\"" + style + "\">" + col + "</td>";
        }

        table += "</tr>";
    }

    div.innerHTML = table;
}

fillMap(".");
insertTileAt("@", mapWidth / 2, mapHeight / 2)

tick();
setInterval(tick, 500);
