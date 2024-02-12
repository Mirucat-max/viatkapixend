const pz = new PanZoom();
let polotno = {}
const pixelSize = 50;

let pixels = {}

let pixelsToBeAdded = {};
let pixelsToBeDeleted = {};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });

let canvasWidth = canvas.width = window.innerWidth;
let canvasHeight = canvas.height = window.innerHeight;

const colorPicker = document.getElementById('color-picker');

configCanvas();

function draw() {
    clear();
    drawBackground();
    drawGrid();
    drawPixels();
}

function drawBackground() {
    ctx.fillStyle = "#fff6f9";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawGrid() {
    if (pz.Scale >= 1) {
        ctx.lineWidth = pz.Scale;
    }
    else {
        ctx.lineWidth = pz.Scale ** 2;
    }

    if (ctx.lineWidth < 0.05)
        return;

    for (let i = -pz.OffsetX % pixelSize * pz.Scale; i < canvasWidth; i += pixelSize * pz.Scale) {
        drawLine(i, 0, i, canvasHeight);
    }

    for (let i = -pz.OffsetY % pixelSize * pz.Scale; i < canvasHeight; i += pixelSize * pz.Scale) {
        drawLine(0, i, canvasWidth, i);
    }
}

const numWorkers = 4;

function drawPixels() {

    // starts the for loop with the first cell on the screen:
    const xStart = Math.floor(pz.OffsetX / pixelSize);
    const yStart = Math.floor(pz.OffsetY / pixelSize);

    // ends the for loop with the last cell on the screen:
    const xEnd = Math.ceil(pz.ScreenToWorldX(canvasWidth) / pixelSize);
    const yEnd = Math.ceil(pz.ScreenToWorldY(canvasHeight) / pixelSize);

    const pixelSizeScaled = pixelSize * pz.Scale;

    for (let x = xStart; x < xEnd; x++) {
        if (!pixels[x])
            continue;

        for (let y = yStart; y < yEnd; y++) {
            if (!pixels[x][y] || (pixelsToBeDeleted[x] && pixelsToBeDeleted[x][y]))
                continue;

            if (typeof pixels[x][y] !== "string") {
                ctx.fillStyle = "#000000";
            }
            else {
                ctx.fillStyle = pixels[x][y];
            }

            const addRight = pixels[x + 1] && pixels[x + 1][y] ? 1 : 0;
            const addBottom = pixels[x][y + 1] ? 1 : 0;

            ctx.fillRect(
                pz.WorldToScreenX(x * pixelSize),
                pz.WorldToScreenY(y * pixelSize),
                pixelSizeScaled + addRight,
                pixelSizeScaled + addBottom
            );
        }
    }

    for (let x in pixelsToBeAdded) {
        for (let y in pixelsToBeAdded[x]) {
            ctx.fillStyle = pixelsToBeAdded[x][y];

            ctx.fillRect(
                pz.WorldToScreenX(x * pixelSize),
                pz.WorldToScreenY(y * pixelSize),
                pixelSizeScaled,
                pixelSizeScaled
            );
        }
    }
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function configCanvas() {
    canvas.addEventListener("touchstart", (e)=>{
        socket.emit("log", "touchstart")
        pz.MouseDown(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        draw();
    })
    canvas.addEventListener("touchend", (e)=>{
        socket.emit("log", "touchend")
        pz.MouseUp(e.clientX, e.clientY);
        draw();
    })
    canvas.addEventListener('mousedown', (e) => {
        if(pz.touchmove) return
        socket.emit("log", "mousedown")
        pz.MouseDown(e.clientX, e.clientY);
        draw();
    });

    canvas.addEventListener('mouseup', (e) => {
        resetIdleTimer();
        socket.emit("log", "mouseup");
        pz.MouseUp();

        if (pz.Click)
            return;

        if (Object.keys(pixelsToBeAdded).length > 0) {
            addPixelsToBeAdded();
        }

        if (Object.keys(pixelsToBeDeleted).length > 0) {
            deletePixelsToBeDeleted();
        }

        draw();
    });

    canvas.addEventListener('mouseleave', (e) => {
        socket.emit("log", "mouseleave");
        if (Object.keys(pixelsToBeDeleted).length > 0) {
            deletePixelsToBeDeleted();
        }

        if (Object.keys(pixelsToBeAdded).length > 0) {
            addPixelsToBeAdded();
        }

        pz.MouseUp();
        draw();
    });
    canvas.addEventListener("touchmove", (e) => {
        console.log(isEarse)
        if (!pz.touchmove)
            return;

        if (pz.Click)
            pz.Click = false;
        if (e.changedTouches[0].clientX == 502 || e.changedTouches[0].clientY == 870) return
        const x = Math.floor(pz.ScreenToWorldX(e.changedTouches[0].clientX) / pixelSize);
        const y = Math.floor(pz.ScreenToWorldY(e.changedTouches[0].clientY) / pixelSize);
        const color = colorPicker.value;

        let lock = false;

        if (isEarse && isDrawing) {
            addPixel(x, y, color);
            lock = true;
        }
        else if (isEarse) {

            deletePixel(x, y);

            lock = true;
        }
        else if (isDrawing) {
            if (!(pixels[x] && pixels[x][y]))
                addPixel(x, y, color);
            lock = true;
        }

        if (!lock) {
            socket.emit("log", "touchmove")
            pz.TouchMove(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
        draw();
    })
    canvas.addEventListener('mousemove', (e) => {
        console.log(isEarse)
        if (!pz.Dragging || !pz.Touchmove)
            return;

        if (pz.Click)
            pz.Click = false;

        socket.emit("log", "mousemove")
        const x = Math.floor(pz.ScreenToWorldX(e.clientX) / pixelSize);
        const y = Math.floor(pz.ScreenToWorldY(e.clientY) / pixelSize);

        const color = colorPicker.value;

        let lock = false;

        if (isEarse && isDrawing) {
            addPixel(x, y, color);
            lock = true;
        }
        else if (isEarse) {

            deletePixel(x, y);

            lock = true;
        }
        else if (isDrawing) {
            if (!(pixels[x] && pixels[x][y]))
                addPixel(x, y, color);
            lock = true;
        }

        if (!lock)
            pz.MouseMove(e.clientX, e.clientY);

        draw();
    });

    canvas.addEventListener('click', mouseClick);

    canvas.addEventListener('wheel', (e) => {
        pz.MouseWheel(e.clientX, e.clientY, e.deltaY);
        draw();
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        const x = Math.floor(pz.ScreenToWorldX(e.clientX) / pixelSize);
        const y = Math.floor(pz.ScreenToWorldY(e.clientY) / pixelSize);

        if (pixels[x] && pixels[x][y])
            if (typeof pixels[x][y] === "string")
                colorPicker.value = pixels[x][y];
            else
                colorPicker.value = "#000000";
    });

    window.onresize = () => {
        canvasWidth = canvas.width = window.innerWidth;
        canvasHeight = canvas.height = window.innerHeight;
        draw();
    };
}

function mouseClick(e) {
    if (!pz.Click)
        return;

    const x = Math.floor(pz.ScreenToWorldX(e.clientX) / pixelSize);
    const y = Math.floor(pz.ScreenToWorldY(e.clientY) / pixelSize);

    const color = colorPicker.value;

    if (isEarse && isDrawing) {
        addPixel(x, y, color);
    }
    else if (isEarse) {
        deletePixel(x, y);
    }
    else {
        addPixel(x, y, color);
    }

    if (Object.keys(pixelsToBeDeleted).length > 0) {
        deletePixelsToBeDeleted();
    }

    if (Object.keys(pixelsToBeAdded).length > 0) {
        addPixelsToBeAdded();
    }

    draw();
}

function addPixel(x, y, color) {
    if(x == 0 && y ==0) return
    if (!pixelsToBeAdded[x])
        pixelsToBeAdded[x] = {};

    pixelsToBeAdded[x][y] = color || colorPicker.value;
}

function deletePixel(x, y) {
    if(x == 0 && y ==0) return
    if (!pixelsToBeDeleted[x])
        pixelsToBeDeleted[x] = {};

    if (!pixelsToBeDeleted[x][y])
        pixelsToBeDeleted[x][y] = true;
}

function addPixelsToBeAdded() {

    socket.emit("add_pixels", pixelsToBeAdded);

    for (let x in pixelsToBeAdded) {
        if (!pixels[x])
            pixels[x] = {};

        for (let y in pixelsToBeAdded[x]) {
            pixels[x][y] = pixelsToBeAdded[x][y];
        }
    }

    pixelsToBeAdded = {};
}

function deletePixelsToBeDeleted() {

    socket.emit("delete_pixels", pixelsToBeDeleted);

    for (let x in pixelsToBeDeleted) {
        if (!pixels[x])
            continue;

        for (let y in pixelsToBeDeleted[x]) {
            delete pixels[x][y];
        }

        if (Object.keys(pixels[x]).length === 0)
            delete pixels[x];
    }

    pixelsToBeDeleted = {};
}
function zoomPlus(){
    pz.Scale += 0.1
    pz.ScreenToWorldX(50)
    pz.ScreenToWorldY(50)
    draw()
}

function zoomMinus(){
    pz.Scale -= 0.1
    pz.ScreenToWorldX(50)
    pz.ScreenToWorldY(50)
    draw()
}
draw();