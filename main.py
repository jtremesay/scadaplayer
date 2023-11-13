#!/usr/bin/env python3
# scadaplayer
# Copyright (C) 2023 Jonathan Tremesaygues
#
# scadaplayer is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, either version 3 of the License, or (at your option) any
# later version.
#
# scadaplayer is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License
# along with scadaplayer. If not, see <https://www.gnu.org/licenses/>.
from argparse import ArgumentParser
from csv import DictReader
from dataclasses import dataclass
from datetime import datetime, timezone
from math import cos, floor, pi, sin
from pathlib import Path
from time import monotonic

import arrow
import imageio.v3 as iio
import pygfx as gfx
import pylinalg as la
from wgpu.gui.offscreen import WgpuCanvas as WgpuOffscreenCanvas


@dataclass
class ScadaRecord:
    timestamp: datetime
    wind_speed: float
    wind_direction: float
    air_temperature: float
    nacelle_direction: float
    active_power: float
    pitch_angle: float

    @classmethod
    def from_dict(cls, data: dict[str, str]) -> "ScadaRecord":
        return cls(
            timestamp=datetime.fromisoformat(data["timestamp"]),
            wind_speed=float(data["wind_speed"]),
            wind_direction=float(data["wind_direction"]),
            air_temperature=float(data["air_temperature"]),
            nacelle_direction=float(data["nacelle_direction"]),
            active_power=float(data["active_power"]),
            pitch_angle=float(data["pitch_angle"]),
        )

    @classmethod
    def from_file(cls, path: Path) -> list["ScadaRecord"]:
        with path.open() as f:
            return [cls.from_dict(r) for r in DictReader(f)]


class Compass(gfx.WorldObject):
    def __init__(self):
        super().__init__()

        # Degree ticks
        positions = []
        for t_deg in range(0, 360, 5):
            t = t_deg * pi / 180
            sin_t = sin(t)
            cos_t = cos(t)
            positions.append([0.43 * cos_t, 0.43 * sin_t, 0])
            positions.append([0.45 * cos_t, 0.45 * sin_t, 0])
        self.add(
            gfx.Line(
                gfx.Geometry(positions=positions),
                gfx.LineSegmentMaterial(thickness=2.0, color="green"),
            )
        )

        # labels
        radius = 0.48
        for label, theta in (("E", 0), ("N", pi / 2), ("W", pi), ("S", -pi / 2)):
            text = gfx.Text(
                gfx.TextGeometry(label, font_size=0.03),
                gfx.TextMaterial(color="#fff"),
            )
            text.local.position = (radius * cos(theta), radius * sin(theta), 0)
            self.add(text)

        # Wind turbine
        self.wind_turbine = gfx.WorldObject()
        self.add(self.wind_turbine)

        self.wind_turbine.add(
            gfx.Mesh(gfx.plane_geometry(0.1, 0.2), gfx.MeshBasicMaterial(color="#fff"))
        )
        blade = gfx.Mesh(
            gfx.plane_geometry(0.4, 0.01), gfx.MeshBasicMaterial(color="#fff")
        )
        blade.local.position = (0, 0.12, 0)
        self.wind_turbine.add(blade)

        # Wind turbine direction
        self.wind_turbine.add(
            gfx.Line(
                gfx.Geometry(positions=[(0, 0.14, 0), (0, 0.34, 0)]),
                gfx.LineSegmentMaterial(thickness=2.0, color="white"),
            )
        )

        # Wind direction
        self.wind_direction = gfx.WorldObject()
        self.add(self.wind_direction)
        self.wind_direction.add(
            gfx.Line(
                gfx.Geometry(positions=[(0, 0.35, 0), (0, 0.42, 0)]),
                gfx.LineSegmentMaterial(thickness=2.0, color="red"),
            )
        )
        self.wind_direction.add(
            gfx.Line(
                gfx.Geometry(positions=[(0, 0.35, 0), (0.03, 0.38, 0)]),
                gfx.LineSegmentMaterial(thickness=2.0, color="red"),
            )
        )
        self.wind_direction.add(
            gfx.Line(
                gfx.Geometry(positions=[(0, 0.35, 0), (-0.03, 0.38, 0)]),
                gfx.LineSegmentMaterial(thickness=2.0, color="red"),
            )
        )

    def set_wind_direction(self, wind_direction):
        self.wind_direction.local.rotation = la.quat_from_axis_angle(
            (0, 0, 1), -wind_direction * pi / 180
        )

    def set_nacelle_direction(self, nacelle_direction):
        self.wind_turbine.local.rotation = la.quat_from_axis_angle(
            (0, 0, 1), -nacelle_direction * pi / 180
        )


class BoxInfo(gfx.WorldObject):
    def __init__(self):
        super().__init__()

        for i, label in enumerate(
            (
                "timestamp",
                "wind_speed",
                "wind_direction",
                "nacelle_direction",
                "active_power",
                "pitch_angle",
            )
        ):
            text = gfx.Text(
                gfx.TextGeometry(label, font_size=0.03, anchor="Top-Left"),
                gfx.TextMaterial(color="#fff"),
            )
            text.local.position = (0, -i * 0.04, 0)
            self.add(text)
            setattr(self, "{}_text".format(label), text)

    def update(self, r: ScadaRecord):
        self.timestamp_text.geometry.set_text(
            r.timestamp.strftime("timestamp: %Y-%m-%d %H:%M:%S")
        )
        self.wind_speed_text.geometry.set_text(
            "wind speed: {:.1f}m.s⁻¹".format(r.wind_speed)
        )
        self.wind_direction_text.geometry.set_text(
            "wind direction: {}°".format(floor(r.wind_direction))
        )
        self.nacelle_direction_text.geometry.set_text(
            "nacelle direction: {}°".format(floor(r.nacelle_direction))
        )
        self.active_power_text.geometry.set_text(
            "active power: {}kW".format(floor(r.active_power))
        )
        self.pitch_angle_text.geometry.set_text(
            "pitch angle: {}°".format(floor(r.pitch_angle))
        )


class UI:
    def __init__(self) -> None:
        self.scene = gfx.Scene()
        self.camera = gfx.OrthographicCamera(1, 1)
        self.camera.local.position = (0, 0, 0)

        self.compass = Compass()
        self.scene.add(self.compass)

        self.box_info = BoxInfo()
        self.box_info.local.position = (-0.65, 0.5, 0)
        self.scene.add(self.box_info)

    def update(self, r: ScadaRecord) -> None:
        self.compass.set_nacelle_direction(r.nacelle_direction)
        self.compass.set_wind_direction(r.wind_direction)
        self.box_info.update(r)

    def draw(self, renderer) -> None:
        renderer.request_draw(lambda: renderer.render(self.scene, self.camera))


def main(args: list[str] | None = None):
    arg_parser = ArgumentParser()
    arg_parser.add_argument("scada_file", type=Path, default=Path("/dev/stdin"))
    arg_parser.add_argument("--start", type=arrow.get)
    arg_parser.add_argument("--end", type=arrow.get)
    arg_parser.add_argument("--out", type=Path, default=Path("out"))
    args = arg_parser.parse_args(args)

    # Load the scada records
    records = ScadaRecord.from_file(args.scada_file)

    # Filter the records
    records = filter(
        lambda r: (args.start is None or r.timestamp >= args.start)
        and (args.end is None or r.timestamp < args.end),
        records,
    )

    # Sort the records by timestamp, just in case.
    # also convert the filtered iterable to list
    records = sorted(records, key=lambda r: r.timestamp)

    # Clean the output dir
    args.out.mkdir(parents=True, exist_ok=True)
    for e in args.out.glob("bla_*.png"):
        e.unlink()

    # Create the render stuff
    canvas = WgpuOffscreenCanvas(size=(640, 480), pixel_ratio=1)
    renderer = gfx.renderers.WgpuRenderer(canvas)
    ui = UI()

    # Render the frames
    for i, r in enumerate(records):
        print(f"{i + 1}/{len(records)}")

        # Update UI
        ui.update(r)

        # Render the frame
        ui.draw(renderer)

        # Write the canvas to an image
        iio.imwrite(f"out/scadaplayer_{i:09}.png", canvas.draw())


if __name__ == "__main__":
    main()
