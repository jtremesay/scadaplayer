import { Metadata, ScadaRecord } from "../models";
import { Gauge } from "./gauge";
import { TitledWidget } from "./titled_widget";

export class AirTemperatureGauge extends TitledWidget {
    constructor() {
        let gauge = new Gauge(-20, 40)
        gauge.unit = "°C"
        gauge.precision = 1

        super("Air temperature", gauge)
    }

    update(_metadata: Metadata, _records: ScadaRecord[], _i: number, record: ScadaRecord): void {
        (this.widget as Gauge).value = record.air_temperature
    }
}