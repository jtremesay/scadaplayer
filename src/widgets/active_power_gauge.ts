import { Metadata, ScadaRecord } from "../models";
import { Gauge } from "./gauge";
import { TitledWidget } from "./titled_widget";

export class ActivePowerGauge extends TitledWidget {
    constructor() {
        let gauge = new Gauge(0, 2000)
        gauge.unit = "kW"
        super("Active power", gauge)
        gauge.short_tick_step = 100
        gauge.long_tick_step = 500
    }

    update(_metadata: Metadata, _records: ScadaRecord[], _i: number, record: ScadaRecord): void {
        (this.widget as Gauge).value = record.active_power
    }
}