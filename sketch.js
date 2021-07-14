let outputImage;
let importedData;

const imgSize = 1024;
const vectorSize = 512;

let importedNoise = [];
let n = [];
let a = [];

let angle;
let count = 10310;
let errorCount = 0;

let truncation;

let truncationUpperBounds = 1;
let truncationLowerBounds = 0.6;

let truncationIncrement = 0.003125;
let stepLength = 24;

let incrementDirection;

function preload() {
    importedData = loadJSON("data.json");
}

function setup() {
    createCanvas(imgSize, imgSize);

    a = importedData.z;

    importedNoise = importedData.noise;

    truncation = importedData.truncation;
    incrementDirection = importedData.direction === "true";
    angle = parseFloat(importedData.a);

    for (let i = 0; i < vectorSize; i++) {
        n[i] = new NoiseLoop(10, -1, 1, importedNoise[i].cx, importedNoise[i].cy);
    }

    generateImage();
}

function generateImage() {
    const path = "http://localhost:8000/query";

    for (let i = 0; i < vectorSize; i++) {
        a[i] = n[i].value(angle);
    }

    let da = TWO_PI / (24 * 480);
    angle += da;

    const data = {
        z: a,
        truncation: truncation,
    };

    const errorData = {
        z: a,
        noise: n,
        truncation: truncation,
        direction: JSON.stringify(incrementDirection),
        a: JSON.stringify(angle),
    };

    saveJSON(errorData, `outputImageData${nf(count, 4)}`);
    httpPost(path, "json", data, gotImage, gotError);
}

function gotError(error) {
    console.error(error);
    errorCount++;
    setTimeout(generateImage, 100);
}

function gotImage(result) {
    outputImage = createImg(result.image, imageReady);
    outputImage.hide();
}

function imageReady() {
    background(255);
    image(outputImage, 0, 0);

    save(`outputImage${nf(count, 4)}`);

    count++;
    fill(0);
    console.log(count);
    console.log("error_count = ", errorCount);

    if (count % stepLength == 0) {
        if (truncation >= truncationUpperBounds) {
            incrementDirection = false;
        }
        if (truncation <= truncationLowerBounds) {
            incrementDirection = true;
        }

        truncation = incrementDirection
            ? truncation + truncationIncrement
            : truncation - truncationIncrement;
    }

    setTimeout(generateImage, 100);
}

class NoiseLoop {
    constructor(diameter, min, max, cx, cy) {
        this.diameter = diameter;
        this.min = min;
        this.max = max;
        this.cx = cx;
        this.cy = cy;
    }

    value(a) {
        let xoff = map(cos(a), -1, 1, this.cx, this.cx + this.diameter);
        let yoff = map(sin(a), -1, 1, this.cy, this.cy + this.diameter);
        let r = toxi.math.noise.simplexNoise.noise(xoff, yoff);
        return map(r, -1, 1, this.min, this.max);
    }
}
