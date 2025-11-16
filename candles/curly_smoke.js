var c = document.createElement("canvas");
c.style.display="block";
c.style.margin = "0 auto";
var ctx = c.getContext("2d");

var cw = c.width = 600,
  cx = cw / 2;
var ch = c.height = 600,
  cy = ch / 2;
var frames = 0;
var rad = (Math.PI / 180);
var r=50, x, y, z, a = 0;
ctx.lineWidth = .5;

document.body.appendChild(c);

function Draw() {
  frames += 1; 
  var angle = frames * rad;
  ctx.clearRect(0, 0, cw, ch);
  for (var i = -240; i < 180; i += .5) {
    ctx.strokeStyle = "hsla(" + (180+i) + ",75%,75%,.5)";
    var t = i * rad;
    var z = 50 * t;
    x = cx + r*t * Math.cos(6 * t - angle);
    y = cy + .5*r *t * Math.sin(6 * t - angle) * Math.sin(i * rad) - z;
    drawBezier(x, y, t);
  }
  requestId = window.requestAnimationFrame(Draw);
}
requestId = window.requestAnimationFrame(Draw);

function drawBezier(x0, y0, t) {
  var x1 = x0 - 50 * Math.cos(t - 20 * rad);
  var y1 = y0 - 50 * Math.sin(t - 20 * rad);
  var x2 = x0 + 50 * Math.cos(t + 20 * rad);
  var y2 = y0 + 50 * Math.sin(t + 20 * rad);
  var x3 = x0 + 100 * Math.cos(t);
  var y3 = y0 + 100 * Math.cos(t);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
  ctx.stroke();
}