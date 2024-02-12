class PanZoom {
    constructor(offsetX = 0, offsetY = 0, scale = 1, minZoom = 0.025, maxZoom = 10) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.scale = scale;
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
        this.drag = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragEnd = { x: 0, y: 0 };
        this.touchStart = { x: 0, y: 0 };
        this.touchEnd = { x: 0, y: 0 };
        this.click = true;
        this.touchmove = false;
    }

    get OffsetX() {
        return this.offsetX;
    }

    set OffsetX(value) {
        if (value == 502) return
        this.offsetX = value;
    }

    get OffsetY() {
        return this.offsetY;
    }

    set OffsetY(value) {
        if (value == 870) return
        this.offsetY = value;
    }

    get Scale() {
        return this.scale;
    }

    set Scale(value) {
        console.log(value)
        this.scale = Math.min(Math.max(this.minZoom, value), this.maxZoom);
    }

    get MinZoom() {
        return this.minZoom;
    }

    set MinZoom(value) {
        if (value <= 0) {
            throw new RangeError('minZoom must be greater than 0');
        }
        this.minZoom = value;
    }

    get MaxZoom() {
        return this.maxZoom;
    }

    set MaxZoom(value) {
        if (value <= 0) {
            throw new RangeError('maxZoom must be greater than 0');
        }
        this.maxZoom = value;
    }

    get Click() {
        return this.click;
    }

    set Click(value) {
        this.click = value;
    }

    get Dragging() {
        return this.drag;
    }

    set Dragging(value) {
        this.drag = value;
    }

    get Touchmove() {
        return this.touchmove;
    }

    set Touchmove(value) {
        this.touchmove = value;
    }

    // World to screen functions:
    WorldToScreenX(worldX) {
        return (worldX - this.OffsetX) * this.Scale;
    }

    WorldToScreenY(worldY) {
        return (worldY - this.OffsetY) * this.Scale;
    }

    // Screen to world functions:
    ScreenToWorldX(screenX) {
        let a = (screenX / this.Scale) + this.OffsetX;
        return a 
    }

    ScreenToWorldY(screenY) {
        let a =(screenY / this.Scale) + this.OffsetY;
        return a 
    }

    // Mouse functions:
    MouseDown(mouseX, mouseY) {
        this.dragStart.x = mouseX;
        this.dragStart.y = mouseY;
        this.touchStart.x = mouseX;
        this.touchStart.y = mouseY;
        console.log(mouseX, mouseY);
        this.drag = true;
        this.touchmove = true;

        if (!this.click) this.click = true;
    }

    MouseMove(mouseX, mouseY) {
        if (this.drag ) {
            if (this.click) this.click = false;

            // Gets drag end:
            this.dragEnd.x = mouseX;
            this.dragEnd.y = mouseY;

            // Updates the offset:
            console.log("MOUSE HAS MOVED")
            this.OffsetX -= (this.dragEnd.x - this.dragStart.x) / this.Scale;
            this.OffsetY -= (this.dragEnd.y - this.dragStart.y) / this.Scale;

            this.dragStart = { ...this.dragEnd }; // Resets the dragStart.
        }
    }
    TouchMove(touchX, touchY) {
        if (this.touchmove) {
            if (this.click) this.click = false;

            // Gets drag end:
            this.touchEnd.x = touchX;
            this.touchEnd.y = touchY;

            // Updates the offset:
            this.OffsetX -= (this.touchEnd.x - this.touchStart.x) / this.Scale;
            this.OffsetY -= (this.touchEnd.y - this.touchStart.y) / this.Scale;

            this.touchStart = { ...this.touchEnd }; // Resets the dragStart.
        }
    }

    MouseUp() {
        this.drag = false;
        this.touchmove = false;
    }

    MouseWheel(mouseX, mouseY, delta) {
        const mouseBeforeZoomX = this.ScreenToWorldX(mouseX);
        const mouseBeforeZoomY = this.ScreenToWorldY(mouseY);

        // Zooms in or out:
        this.Scale += delta * (-0.001) * (this.Scale / 2);

        // Restrict zoom:
        this.Scale = Math.min(Math.max(this.MinZoom, this.Scale), this.MaxZoom);

        // Mouse after zoom:
        const mouseAfterZoomX = this.ScreenToWorldX(mouseX);
        const mouseAfterZoomY = this.ScreenToWorldY(mouseY);

        // Adjusts offset so the zoom occurs relative to the mouse position:
        this.OffsetX += (mouseBeforeZoomX - mouseAfterZoomX);
        this.OffsetY += (mouseBeforeZoomY - mouseAfterZoomY);
    }
}

// Example usage:
const panZoomInstance = new PanZoom();
