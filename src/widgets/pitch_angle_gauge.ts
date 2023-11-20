import { Metadata, ScadaRecord } from "../models";
import { Gauge } from "./gauge";
import { TitledWidget } from "./titled_widget";

export class PitchAngleGauge extends TitledWidget {
    constructor() {
        let gauge = new Gauge(0, 90)
        gauge.unit = "°"
        gauge.precision = 1

        super("Pitch angle", gauge)
    }

    update(_metadata: Metadata, _records: ScadaRecord[], _i: number, record: ScadaRecord): void {
        (this.widget as Gauge).value = record.pitch_angle
    }
}