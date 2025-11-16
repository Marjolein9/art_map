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
    // Calculate size - starts from a point (0), grows larger
    var progress = (i + 240) / 420;
    var sizeMultiplier = progress;

    // Debug: log first few values
    if (frames === 1 && i >= -240 && i <= -238) {
      console.log('i:', i, 'progress:', progress, 'sizeMultiplier:', sizeMultiplier);
    }

    ctx.strokeStyle = "hsla(" + (180+i) + ",75%,75%,.5)";
    var t = i * rad;
    var z = 50 * t;
    x = cx + r*t * sizeMultiplier * Math.cos(6 * t - angle);
    y = cy + .5*r *t * sizeMultiplier * Math.sin(6 * t - angle) * Math.sin(i * rad) - z;
    drawBezier(x, y, t, sizeMultiplier);
  }
  requestId = window.requestAnimationFrame(Draw);
}
requestId = window.requestAnimationFrame(Draw);

function drawBezier(x0, y0, t, sizeMultiplier) {
  var size = 50 * sizeMultiplier;
  var x1 = x0 - size * Math.cos(t - 20 * rad);
  var y1 = y0 - size * Math.sin(t - 20 * rad);
  var x2 = x0 + size * Math.cos(t + 20 * rad);
  var y2 = y0 + size * Math.sin(t + 20 * rad);
  var x3 = x0 + (size * 2) * Math.cos(t);
  var y3 = y0 + (size * 2) * Math.cos(t);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
  ctx.stroke();
}