const canvasSketch = require('canvas-sketch');
import {random} from "canvas-sketch-util"
var _ = require("lodash");

const width = 1080;
const height = 1080;

const settings = {
  dimensions: [ width, height ],
  animate: true
};

const cyberColours = ["aqua", "violet", "coral", "cyan", "crimson",
                      "darkmagenta", "darkorange", "darkorchid", "darkviolet", "deeppink",
                      "darkturquoise", "deepskyblue", "dodgerblue", "goldenrod", "indigo",
                      "magenta", "mediumturquoise", "midnightblue", "orange", "orangered", "purple", "red",
                      "steelblue", "violet"]

const params = {
  velocityX: 500,
  velocityY: 650,
  lineWidth: 10,
  lineSharpness: 1,
  numCircles: 10,
  numPoints: 20
}

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Colider {
  hasColision(circle) {
    return false;
  }

  colide(circle) {
    return vel;
  }
}

class SquareColider extends Colider {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;

    this.x0 = -width / 2;
    this.y0 = -height / 2;
    this.x1 = width / 2;
    this.y1 = height / 2;
  }

  hasColision(circle) {
    return (circle.pos.x - circle.radius) < this.x0 || (circle.pos.x + circle.radius) > this.x1
              || (circle.pos.y - circle.radius) < this.y0 || (circle.pos.y + circle.radius) > this.y1;
  }

  colide(circle) {
    let newVelocity = new Vector(circle.vel.x, circle.vel.y);
    let newPos = new Vector(circle.pos.x, circle.pos.y);
    if((circle.pos.x - circle.radius) < this.x0) {
      newVelocity.x = -circle.vel.x;
      newPos.x = this.x0 + circle.radius;
    }
    if((circle.pos.x + circle.radius) > this.x1) {
      newVelocity.x = -circle.vel.x;
      newPos.x = this.x1 - circle.radius;
    }
    if((circle.pos.y - circle.radius) < this.y0) {
      newVelocity.y = -circle.vel.y;
      newPos.y = this.y0 + circle.radius;
    }
    if((circle.pos.y + circle.radius) > this.y1) {
      newVelocity.y = -circle.vel.y;
      newPos.y = this.y1 - circle.radius;
    }

    return [newPos, newVelocity];
  }
}

const dotProd = (a, b) => {
  return a.x * b.x + a.y * b.y;
}

const isInLine = (a, b, c) => {
  const x = new Vector(a.x - b.x, a.y - b.y);
  const y = new Vector(b.x - c.x, b.y - c.y);

  return dotProd(x, y) < 0.9;
}

class Ball {
  constructor(pos, vel, radius, colour, colider) {
    this.pos = pos;
    this.vel = vel;

    this.radius = radius;
    this.colour = colour;

    if(colider === undefined) {
      colider = new Colider();
    }
    this.colider = colider;

    this.linePoints = [new Vector(this.pos.x, this.pos.y)];
  }

  drawLines(context) {
    if(this.linePoints.length > 1) {
      context.save()
      context.strokeStyle = this.colour;
      const p1 = this.linePoints[this.linePoints.length - 2];
      const p2 = this.linePoints[this.linePoints.length - 1];
      for(let i = 0; i < params.lineWidth; ++i) {
        context.globalAlpha = 1 / params.lineWidth;
        context.lineWidth = i**params.lineSharpness;
        context.beginPath();
        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p2.y);
        context.stroke();
      }
      context.restore();
    }
  }

  draw(context) {
    context.save();
    context.globalAlpha = 1 / (params.numCircles - 1);
    context.fillStyle = this.colour;
    context.beginPath();
    for(let i = 1; i < params.numCircles; ++i) {
      const radius = this.radius * (i / params.numCircles)**0.7;
      context.arc(this.pos.x, this.pos.y, radius, 0, 2 * Math.PI)
      context.fill();
    }

    context.restore();
  }

  update(delta) {
    this.pos.x += delta * this.vel.x;
    this.pos.y += delta * this.vel.y;

    if(this.colider.hasColision(this)) {
      [this.pos, this.vel] = this.colider.colide(this);
    }
    this.linePoints.push(new Vector(this.pos.x, this.pos.y));
  }
};

const createCircleOfCircles = (number, radius, ballRadius, colider) => {
  let circles = [];

  for(let i = 0; i < number; ++i) {
    const colour = random.pick(cyberColours);

    const theta = (2 * Math.PI) * (i / number);
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);

    circles.push(new Ball(new Vector(x, y), new Vector(params.velocityX, params.velocityY), ballRadius, colour, colider))
  }

  return circles;
}

const canvas = document.createElement("canvas");
canvas.width = settings.dimensions[0];
canvas.height = settings.dimensions[1];
const bufferContext = canvas.getContext("2d");
bufferContext.fillStyle = 'black';
bufferContext.fillRect(0, 0, width, height);

let lastTime = 0;

const circles = createCircleOfCircles(params.numPoints, 100, 20, new SquareColider(...settings.dimensions));

const sketch = () => {
  return ({ context, width, height, time }) => {
    const delta = time - lastTime;
    lastTime = time;

    context.lineWidth = 6;

    context.save();

    circles.forEach((element, idx) => {
      element.update(delta);
    });

    bufferContext.translate(width / 2, height / 2);
    circles.forEach((element, idx) => {
      element.drawLines(bufferContext);
    });

    bufferContext.translate(-width / 2, -height / 2);
    context.drawImage(canvas, 0, 0);

    context.translate(width / 2, height / 2);
    circles.forEach((element, idx) => {
      element.draw(context);
    });


    context.restore();
  };
};

canvasSketch(sketch, settings);
