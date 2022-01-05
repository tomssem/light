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
  start: [50, 0],
  radiusOfGroup: 30,
  velocityX: 700,
  velocityY: 800,
  lineWidth: 10,
  numLines: 5,
  lineSharpness: 2,
  numCircles: 4,
  numPoints: 5,
  segmentLength: 3
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
  return new Vector(c * v.x, c * v.y);
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
  return (a.x * b.x) + (a.y * b.y);
}

const normalize = (v) => {
  const magnitude = Math.sqrt(v.x**2 + v.y**2);

  return scalarMult(1 / magnitude, v);
}

const sub = (a, b) => {
  return new Vector(a.x - b.x, a.y - b.y);
}

const plus = (a, b) => {
  return new Vector(a.x + b.x, a.y + b.y);
}

/**
 * reflect the vector `v` in the normal `n`
 */
const reflect = (v, n) => {
  // r = v - 2(v.n)n
  const dp = dotProd(v, n);
  return sub(v, scalarMult(2 * dp, n))

}

// taken from https://cscheng.info/2016/06/09/calculate-circle-line-intersection-with-javascript-and-p5js.html
function findCircleLineIntersections(r, h, k, m, n) {
    // circle: (x - h)^2 + (y - k)^2 = r^2
    // line: y = m * x + n
    // r: circle radius
    // h: x value of circle centre
    // k: y value of circle centre
    // m: slope
    // n: y-intercept

    // get a, b, c values
    const a = 1 + m * m;
    const b = -h * 2 + (m * (n - k)) * 2;
    const c = h * h + (n - k)**2 - r * r;

    const y = (x) => m * x + n;

    // get discriminant
    const d = b * b - 4 * a * c;
    if (d >= 0) {
        // insert into quadratic formula
        const x1 = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
        const x2 = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
        const intersections = [
          new Vector(x1, y(x1)),
          new Vector(x2, y(x2))
        ];
        if (d == 0) {
            // only 1 intersection
            return [intersections[0]];
        }
        return intersections;
    }
    // no intersection
    return [];
}

class CircleColider extends Colider {
  constructor(center, radius) {
    super();
    this.center = center;
    this.radius = radius;
  }

  hasColision(point) {
    return distance(this.center, point.pos) >= this.radius;
  }

  calcColisionOnRadius(point) {
    const centerToPoint = fromToVector(this.center, point);
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

  colideRadial(point) {
    // calculate where point strikes circle (snap back to edge along radius)
    const colisionPoint = this.calcColisionOnRadius(point.pos)

    // calculate vector from center to colision point
    const toRadius = fromToVector(this.center, colisionPoint);
    // calculcate vector from colision point to center
    const toCenter = scalarMult(-1, toRadius);
    // create internal normal vector
    const normVector = normalize(toCenter);

    // reflect velocity in tangent
    const newVel = reflect(point.vel, normVector);

    // move point within circle
    const pointDistanceBeyondEdge = distance(colisionPoint, point.pos);
    const updatedPos = plus(colisionPoint, scalarMult(pointDistanceBeyondEdge, normVector));

    return [updatedPos, newVel];
  }

  colide(point) {
    // *** calculate line that crosses circle using velocity and point ***
    const m = point.vel.y / point.vel.x;
    const n = -m * point.pos.x + point.pos.y;

    // *** calculate point line intersects with circle ***
    const intersections = findCircleLineIntersections(this.radius,
                                                      this.center.x,
                                                      this.center.y,
                                                      m, n);
    // above returns multiple points, assume closest to point position is the reflection point
    if(intersections.length != 2) {
      console.assert(false, intersections);
    }
    let intersectionPoint = intersections[0];
    if(intersections.length == 2) {
      const distance1 = distance(point.pos, intersections[0]);
      const distance2 = distance(point.pos, intersections[1]);
      if(distance2 < distance1) {
        intersectionPoint = intersections[1];
      }
    }

    // *** reflect velocity in norm at that point ***
    // calculate vector from center to colision point
    const toRadius = fromToVector(this.center, intersectionPoint);
    // calculcate vector from colision point to center
    const toCenter = scalarMult(-1, toRadius);
    // create internal normal vector
    const normVector = normalize(toCenter);
    // reflect velocity in norm
    const newVel = reflect(point.vel, normVector);

    // *** calculate where point should be ***
    // calculate how far point has traveled outside circle
    const traveled = distance(intersectionPoint, point.pos);
    // move that far along the new velocity from the intersection point
    const normedVel = normalize(newVel);
    const newPos = plus(intersectionPoint, scalarMult(traveled, normedVel));

    // reflect velocity in radial
    return [newPos, newVel];
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
      // context.lineCap = "round";
      const begin = this.linePoints[this.linePoints.length - (params.segmentLength + 1)];
      const end = this.linePoints[this.linePoints.length - 1];
      context.globalAlpha = 1 / params.numLines;
      for(let l = 0; l < params.numLines; ++l) {
        context.lineWidth = params.lineWidth * ((l + 1) / params.numLines)**params.lineSharpness;
        context.beginPath();
        context.moveTo(begin.x, begin.y);
        for(let i = 0; i < params.segmentLength; ++i) {
          const index = this.linePoints.length - (params.segmentLength + 1) + i;
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
    const x = radius * Math.cos(theta) + params.start[0];
    const y = radius * Math.sin(theta) + params.start[1];

    const ball = new Ball(new Vector(x, y), new Vector(params.velocityX, params.velocityY), ballRadius, colour, colider);

    circles.push(ball);
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

// const circles = createCircleOfCircles(params.numPoints, params.radiusOfGroup, 20, new SquareColider(...settings.dimensions));
const circles = createCircleOfCircles(params.numPoints, params.radiusOfGroup, 20, new CircleColider(new Vector (0, 0), 540));

const sketch = () => {
  return ({ context, width, height, time }) => {
    let delta = time - lastTime;
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
