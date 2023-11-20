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

    update(_metadata: Metadata, records: ScadaRecord[], i: number): void {
        (this.widget as Gauge).value = records[i].pitch_angle
    }
}