
var c = document.createElement("canvas");
c.style.display="block";
c.style.margin = "0 auto";
var ctx = c.getContext("2d");

var cw = c.width = 600;
var ch = c.height = 600;
var cx = cw / 2;
var frames = 0;
var rad = Math.PI / 180;

document.body.appendChild(c);

// match head coordinates
var matchX = cx;
var matchY = ch - 90;

// smoke size near match
var baseSmokeWidth = 5;   // very tight at origin
var maxSmokeWidth = 800;     // expands as it rises

ctx.lineWidth = 0.6;

//=======================================================
// MAIN LOOP
//=======================================================
function Draw() {
  frames++;
  ctx.clearRect(0, 0, cw, ch);

  // draw the match head itself
  drawMatchHead();

  // smoke range: i maps to height ABOVE the match head
  for (var i = 0; i < 350; i += 1) {

    // height above match head
    let h = i;

    // width increases only with height
    let spread = baseSmokeWidth + (h * 0.25); 
    if (spread > maxSmokeWidth) spread = maxSmokeWidth;

    // smoke grey color + randomness
    let grey = 140 + Math.random() * 80;
    let alpha = 0.03 + Math.random() * 0.07;
    ctx.strokeStyle = `rgba(${grey},${grey},${grey},${alpha})`;

    // slight horizontal wobble as it rises
    let angle = frames * 0.01 + i * 0.02;
    let x = matchX + Math.sin(angle) * (spread * 0.3);

    let y = matchY - h; // smoke rises upward from match

    drawBezier(x, y, i);
  }

  requestAnimationFrame(Draw);
}
requestAnimationFrame(Draw);

//=======================================================
// MATCH HEAD
//=======================================================
function drawMatchHead() {
  // glow from ember
  let g = ctx.createRadialGradient(matchX, matchY, 1, matchX, matchY, 15);
  g.addColorStop(0, "rgba(255,100,40,0.7)");
  g.addColorStop(1, "rgba(255,100,40,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(matchX, matchY, 14, 0, Math.PI * 2);
  ctx.fill();

  // match tip itself
  ctx.fillStyle = "rgb(160,50,40)";
  ctx.beginPath();
  ctx.arc(matchX, matchY, 3, 0, Math.PI * 2);
  ctx.fill();
}

//=======================================================
// SMOKE CURVES (shape only)
//=======================================================
function drawBezier(x0, y0, t) {

  // tighter curves at the bottom — wider as it rises
  let curveSpread = 10 + t * 0.1;

  var x1 = x0 - curveSpread * Math.cos(t * 0.01);
  var y1 = y0 - curveSpread * Math.sin(t * 0.01);

  var x2 = x0 + curveSpread * Math.cos(t * 0.01 + 1.5);
  var y2 = y0 + curveSpread * Math.sin(t * 0.01 + 1.5);

  var x3 = x0 + (curveSpread * 0.4) * Math.sin(t * 0.02);
  var y3 = y0 - (curveSpread * 0.5);

  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
  ctx.stroke();
}
