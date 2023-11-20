import { Metadata, ScadaRecord } from "../models";
import { Gauge } from "./gauge";
import { TitledWidget } from "./titled_widget";

export class WindSpeedGauge extends TitledWidget {
    constructor() {
        let gauge = new Gauge(0, 25)
        gauge.unit = "m.s⁻¹"
        super("Wind speed", gauge)
    }

    update(_metadata: Metadata, _records: ScadaRecord[], _i: number, record: ScadaRecord): void {
        (this.widget as Gauge).value = record.wind_speed
    }
}