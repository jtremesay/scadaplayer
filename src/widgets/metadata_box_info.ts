import { Metadata, ScadaRecord } from "../models";
import { BoxInfo } from "./box_info";
import { TitledWidget } from "./titled_widget";

export class MetadataBoxInfo extends TitledWidget {
    constructor() {
        let box_info = new BoxInfo(["Farm", "Turbine", "Turbine model", "Nominal Power"])

        super("Metadata", box_info)
    }

    update(metadata: Metadata, _records: ScadaRecord[], _i: number): void {
        let box_info = this.widget as BoxInfo
        box_info.values = [
            metadata.farm ?? "N/A",
            metadata.turbine ?? "N/A",
            metadata.turbine_model ?? "N/A",
            `${metadata.nominal_power} kW` ?? "N/A",
        ]
    }
}