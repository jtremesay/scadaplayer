import { CANVAS_SIZE } from "./config"
import { lerp } from "./maths"
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
        time /= 1000
        let i = Math.floor(time) % this.records.length
        let record: ScadaRecord | null = null;
        if (this.records.length >= 2) {
            let curr = this.records[i]
            let next = this.records[i + 1]
            record = {
                timestamp: curr.timestamp,
                wind_speed: lerp(time, i, i + 1, curr.wind_speed, next.wind_speed),
                wind_direction: lerp(time, i, i + 1, curr.wind_direction, next.wind_direction),
                air_temperature: lerp(time, i, i + 1, curr.air_temperature, next.air_temperature),
                nacelle_direction: lerp(time, i, i + 1, curr.nacelle_direction, next.nacelle_direction),
                active_power: lerp(time, i, i + 1, curr.active_power, next.active_power),
                pitch_angle: lerp(time, i, i + 1, curr.pitch_angle, next.pitch_angle),
            }

        } else if (this.records.length > 0) {
            record = this.records[i]
        }

        if (record) {
            this.dashboard.update(this.metadata, this.records, i, record)
        }

        this.dashboard.draw(this.ctx, CANVAS_SIZE)

        this.request_frame()
    }

    request_frame() {
        window.requestAnimationFrame(this.render.bind(this))
    }
}