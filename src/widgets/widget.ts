import { Metadata, ScadaRecord } from "../models"
import { Size } from "./size"

export class Widget {
    constructor() {
    }

    update(_metadata: Metadata, _records: ScadaRecord[], _i: number, _record: ScadaRecord) { }

    draw(ctx: CanvasRenderingContext2D, size: Size) {
        // Debug background
        ctx.fillStyle = "magenta"
        ctx.fillRect(0, 0, size.width, size.height)
    }
}