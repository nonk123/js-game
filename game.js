let div = document.getElementById("game");

var counter = 1

function tick() {
    div.innerHTML = "<tr><th>Ticked " + counter++ + "</th></tr>"
}

tick()
setInterval(tick, 500)
