import { CANVAS_SIZE } from "./config"
import { Metadata, ScadaRecord } from "./models"
import { ActivePowerGauge } from "./widgets/active_power_gauge"
import { AirTemperatureGauge } from "./widgets/air_temperature_gauge"
import { Compass } from "./widgets/compass"
import { Dashboard } from "./widgets/dashboard"
import { MetadataBoxInfo } from "./widgets/metadata_box_info"
import { PitchAngleGauge } from "./widgets/pitch_angle_gauge"
import { Point } from "./widgets/point"
import { ScadaBoxInfo } from "./widgets/scada_box_info"
import { Size } from "./widgets/size"
import { WindSpeedGauge } from "./widgets/wind_speed_gauge"

export class Engine {
    metadata: Metadata
    records: ScadaRecord[]
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    dashboard: Dashboard

    constructor(metadata: Metadata, records: ScadaRecord[]) {
        this.metadata = metadata
        this.records = records
        this.canvas = document.getElementById("canvas")! as HTMLCanvasElement
        this.canvas.width = CANVAS_SIZE.width
        this.canvas.height = CANVAS_SIZE.height
        this.ctx = this.canvas.getContext("2d")! as CanvasRenderingContext2D
        this.dashboard = new Dashboard()
        this.dashboard.add_item(new MetadataBoxInfo(), new Size(2, 1), new Point(0, 0))
        this.dashboard.add_item(new ScadaBoxInfo(), new Size(2, 1), new Point(0, 1))
        this.dashboard.add_item(new AirTemperatureGauge(), new Size(2, 2), new Point(0, 2))
        this.dashboard.add_item(new Compass(), new Size(4, 4), new Point(2, 0))
        this.dashboard.add_item(new PitchAngleGauge(), new Size(2, 2), new Point(0, 4))
        this.dashboard.add_item(new ActivePowerGauge(), new Size(2, 2), new Point(2, 4))
        this.dashboard.add_item(new WindSpeedGauge(), new Size(2, 2), new Point(4, 4))
    }

    render(time: DOMHighResTimeStamp) {
        if (this.records.length > 0) {
            this.dashboard.update(this.metadata, this.records, Math.floor(time / 1000) % this.records.length)
        }

        this.dashboard.draw(this.ctx, CANVAS_SIZE)

        this.request_frame()
    }

    request_frame() {
        window.requestAnimationFrame(this.render.bind(this))
    }
}