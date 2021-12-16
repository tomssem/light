const canvasSketch = require('canvas-sketch');
import {random} from "canvas-sketch-util"
var _ = require("lodash");

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true
};

const cyberColours = ["aqua", "violet", "coral", "cyan", "crimson",
                      "darkmagenta", "darkorange", "darkorchid", "darkviolet", "deeppink",
                      "darkturquoise", "deepskyblue", "dodgerblue", "goldenrod", "indigo",
                      "magenta", "mediumturquoise", "midnightblue", "orange", "orangered", "purple", "red",
                      "steelblue", "violet"]

const params = {
  velocityX: 300,
  velocityY: 200,
  lineWidth: 20,
  lineSharpness: 1
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

    this.linePoints = [];
  }

  drawLines(context) {
    context.save()
    context.strokeStyle = this.colour;
    for(let i = 1; i < params.lineWidth; ++i) {
      context.globalAlpha = 1 / params.lineWidth;
      context.lineWidth = i**params.lineSharpness;
      context.beginPath();
      context.moveTo(this.linePoints[0].x, this.linePoints[0].y);
      this.linePoints.forEach((el, idx) => {
        context.lineTo(el.x, el.y);
      });
      context.lineTo(this.pos.x, this.pos.y);
      context.stroke();
    }
    context.restore();
  }

  draw(context) {
    context.save();
    context.fillStyle = this.colour;
    context.beginPath();
    context.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI)
    context.fill();

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
    console.log(colour);

    const theta = (2 * Math.PI) * (i / number);
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);

    circles.push(new Ball(new Vector(x, y), new Vector(params.velocityX, params.velocityY), ballRadius, colour, colider))
  }

  return circles;
}

let lastTime = 0;

const circles = createCircleOfCircles(7, 100, 20, new SquareColider(...settings.dimensions));

const sketch = () => {
  return ({ context, width, height, time }) => {
    const delta = time - lastTime;
    lastTime = time;
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    context.lineWidth = 6;

    context.save();

    context.translate(width / 2, height / 2);

      circles.forEach(element => {
        if(time > 1) {
          element.update(delta);
          element.drawLines(context);
          element.draw(context);
        }
      });

    context.restore();
  };
};

canvasSketch(sketch, settings);
