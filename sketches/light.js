const canvasSketch = require('canvas-sketch');
import {random} from "canvas-sketch-util"
import { subtract } from "lodash";
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
  radiusOfGroup: 20,
  velocityX: 1000,
  velocityY: 400,
  lineWidth: 30,
  numLines: 10,
  lineSharpness: 2,
  numCircles: 1,
  numPoints: 40,
  segmentLength: 200
}

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

const distance = (v1, v2) => {
  return Math.sqrt((v1.x - v2.x)**2 + (v1.y - v2.y)**2);
}

const fromToVector = (from, to) => {
  return new Vector(to.x - from.x, to.y - from.y);
}

const scalarMult = (c, v) => {
  return new Vector(c * v.x,c * v.y);
}

class Colider {
  hasColision(circle) {
    return false;
  }

  colide(circle) {
    return [pos, vel];
  }
}

const dotProd = (a, b) => {
  return (a.x + b.x)**2 + (a.y + b.y)**2;
}

const normalize = (v) => {
  const magnitude = Math.sqrt(v.x**2 + v.y**2);

  return scalarMult(1 / magnitude, v);
}

const sub = (a, b) => {
  return new Vector(a.x - b.x, a.y - b.y);
}

/**
 * reflect the vector `v` in the normal `n`
 */
const reflect = (v, n) => {
  // r = v - 2(v.n)n
  const dp = dotProd(v, n);
  return sub(v, scalarMult(2 * dp, n))

}

class CircleColider extends Colider {
  constructor(center, readius) {
    this.center = center;
    this.radius = radius;
  }

  hasColision(circle) {
    return distance(this.center, circle.pos) <= this.radius;
  }

  calcColisionOnRadius(point) {
    const centerToPoint = fromToVector(this.center, v);
    const distanceToCenter = distance(point, this.center);
    const scalingFactor = this.radius / distanceToCenter;

    return scalarMult(scalingFactor, centerToPoint);
  }

  tangentAtPoint(point) {
    // gradient of radius in y over change in x
    const radiusGradient = (point.y - this.center.y) / (point.x - this.center.y);
    // dot product of radius and tangent is zero
    const tangentGradient = -(1 / radiusGradient);

    // intercept from y = mx + c, c = y - mx
    const intercept = point.y - (tangentGradient * point.x);

    // vector equation of line is (mx/c, y/c);
    return scalarMult(1 / intercept, new Vector(tangentGradient * point.x, point.y));
  }

  colideTangent(point) {
    // calculate where point strikes circle (snap back to edge along radius)
    const colisionPoint = this.calcColisionOnRadius(point)

    // calculate eqaution of tangent at that point
    const tangentAtPoint = this.tangentAtPoint(colisionPoint);

    // put point back in circle
    return [point.pos, point.vel];
  }

  colideRadial(point) {
    // calculate where point strikes circle (snap back to edge along radius)
    const colisionPoint = this.calcColisionOnRadius(point)

    // calculate vector from center to colision point
    const toRadius = fromToVector(this.center, colisionPoint);
    // calculcate vector from colision point to center
    const toCenter = scalarMult(-1, toRadius);
    // create internal normal vector
    const normVector = normalize(toCenter);

    // reflect velocity in tangent
    const newVel = reflect(point.vel, normVector);

    // move point within circle
    const pointDistanceBeyondEdge = distance(colisionPoint, point);
    const lengthBeyondEdge = pointDistanceBeyondEdge - this.radius;
    const fractionToMoveInCircle = 1 - (lengthBeyondEdge / this.radius);
    const pointUpdate = scalarMult(fromToVector(fractionToMoveInCircle, toRadius));
  }

  colide(point) {
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
    if(this.linePoints.length > params.segmentLength) {
      context.save()
      context.lineJoin = "round";
      context.strokeStyle = this.colour;
      const begin = this.linePoints[this.linePoints.length - (params.segmentLength + 1)];
      const end = this.linePoints[this.linePoints.length - 1];
        context.globalAlpha = 1 / params.lineWidth;
      for(let l = 0; l < params.numLines; ++l) {
        context.lineWidth = params.lineWidth * ((l + 1) / params.numLines)**params.lineSharpness;
        context.beginPath();
        context.moveTo(begin.x, begin.y);
        for(let i = 0; i < params.segmentLength; ++i) {
          const index = this.linePoints.length - params.segmentLength;
          const point = this.linePoints[index]
          context.lineTo(point.x, point.y);
        }
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

const circles = createCircleOfCircles(params.numPoints, params.radiusOfGroup, 20, new SquareColider(...settings.dimensions));

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
