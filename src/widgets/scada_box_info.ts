import { Metadata, ScadaRecord } from "../models";
import { BoxInfo } from "./box_info";
import { TitledWidget } from "./titled_widget";

export class ScadaBoxInfo extends TitledWidget {
    constructor() {
        let box_info = new BoxInfo(["Start", "End", "Records count", "Current record", "Timestamp"])

        super("Scada info", box_info)
    }

    update(_metadata: Metadata, records: ScadaRecord[], i: number, record: ScadaRecord): void {
        let box_info = this.widget as BoxInfo
        box_info.values = [
            records[0].timestamp.toISOString(),
            records[records.length - 1].timestamp.toISOString(),
            records.length.toFixed(),
            (i + 1).toFixed(),
            record.timestamp.toISOString()
        ]
    }
}