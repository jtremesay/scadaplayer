class Size {
  width: number
  height: number

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }
}

class Point {
  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

class Rect {
  position: Point
  size: Size

  constructor(position: Point, size: Size) {
    this.position = position
    this.size = size
  }
}

class Widget {
  rect: Rect
  constructor(rect: Rect) {
    this.rect = rect
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.rect.position.x, this.rect.position.y)
    ctx.scale(this.rect.size.width, this.rect.size.height)

    // Debug background
    ctx.fillStyle = "magenta"
    ctx.fillRect(0, 0, 1, 1)

    ctx.restore()
  }
}

const GRID_SIZE = new Size(12, 8)
const ITEM_SIZE = new Size(1920 / GRID_SIZE.width, 1080 / GRID_SIZE.height)
const ITEM_RATIO = ITEM_SIZE.width / ITEM_SIZE.height
const TITLE_HEIGHT: number = 20

class DashboardItem extends Widget {
  label: string
  grid_rect: Rect

  constructor(label: string, grid_rect: Rect) {
    super(new Rect(
      new Point(grid_rect.position.x * ITEM_SIZE.width, grid_rect.position.y * ITEM_SIZE.height),
      new Size(grid_rect.size.width * ITEM_SIZE.width, grid_rect.size.height * ITEM_SIZE.height)
    ))
    this.label = label.toUpperCase()
    this.grid_rect = grid_rect
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.rect.position.x, this.rect.position.y)

    // Background
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, this.rect.size.width, this.rect.size.height)

    // Title
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center"
    ctx.fillStyle = "white"
    ctx.fillText(this.label, this.rect.size.width / 2, 15, this.rect.size.width)

    // Borders
    ctx.beginPath()
    ctx.strokeStyle = "white"
    ctx.lineWidth = 1
    ctx.moveTo(0, 0)
    ctx.lineTo(0, this.rect.size.height)
    ctx.lineTo(this.rect.size.width, this.rect.size.height)
    ctx.lineTo(this.rect.size.width, 0)
    ctx.lineTo(0, 0)

    ctx.moveTo(0, TITLE_HEIGHT)
    ctx.lineTo(this.rect.size.width, TITLE_HEIGHT)
    ctx.stroke()

    ctx.restore()
  }
}

class Gauge extends DashboardItem {
  value: number
  min: number
  max: number
  short_tick_step: number
  long_tick_step: number
  theta: number
  phase: number
  unit: string

  constructor(label: string, min: number, max: number, grid_rect: Rect) {
    super(label, grid_rect)
    this.value = min
    this.min = min
    this.max = max
    this.short_tick_step = 1
    this.long_tick_step = 5
    this.theta = 3 * Math.PI / 2
    this.phase = (2 * Math.PI - this.theta) / 2 + Math.PI / 2
    this.unit = ""
  }

  draw(ctx: CanvasRenderingContext2D): void {
    super.draw(ctx)

    ctx.save()
    ctx.translate(this.rect.position.x, this.rect.position.y + TITLE_HEIGHT)

    let size = new Size(
      this.rect.size.width,
      this.rect.size.height - TITLE_HEIGHT,
    )
    let center = new Point(
      size.width / 2,
      size.height / 2,
    )
    let radius = Math.min(center.x, center.y);
    let val_range = this.max - this.min
    let inlong_radius = 0.7 * radius
    let inshort_radius = 0.75 * radius
    let out_radius = 0.8 * radius
    let needle_radius = 0.6 * radius

    // Ticks
    ctx.beginPath()
    ctx.lineWidth = 1
    ctx.strokeStyle = "white"
    for (let i = 0; i <= val_range; i += 1) {
      let j = this.phase + i / val_range * this.theta

      let in_radius = 0
      if (i % this.long_tick_step == 0) {
        in_radius = inlong_radius
      } else if (i % this.short_tick_step == 0) {
        in_radius = inshort_radius
      } else {
        continue
      }

      let cos = Math.cos(j)
      let sin = Math.sin(j)
      ctx.moveTo(
        center.x + in_radius * cos,
        center.y + in_radius * sin)
      ctx.lineTo(
        center.x + out_radius * cos,
        center.y + out_radius * sin
      )
    }
    ctx.stroke()

    // Needle
    let theta_needle = this.phase + (this.value - this.min) / (this.max - this.min) * this.theta
    let cos_needle = Math.cos(theta_needle)
    let sin_needle = Math.sin(theta_needle)
    ctx.beginPath()
    ctx.lineWidth = 3
    ctx.strokeStyle = "red"
    ctx.moveTo(
      center.x,
      center.y)
    ctx.lineTo(
      center.x + needle_radius * cos_needle,
      center.y + needle_radius * sin_needle
    )
    ctx.stroke()

    // Value
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center"
    ctx.fillStyle = "white"
    ctx.fillText(`${this.value}${this.unit}`, this.rect.size.width / 2, size.height - 15, this.rect.size.width)

    ctx.restore()
  }
}

class AirTemperatureGauge extends Gauge {
  constructor(grid_rect: Rect) {
    super("Air Temperature", -20, 40, grid_rect)
    this.unit = "°C"
    this.value = 20
  }
}

class PitchAngleGauge extends Gauge {
  constructor(grid_rect: Rect) {
    super("Pitch angle", 0, 90, grid_rect)
    this.unit = "°"
    this.value = 3
  }
}

class ActivePowerGauge extends Gauge {
  constructor(grid_rect: Rect) {
    super("Active power", 0, 2000, grid_rect)
    this.unit = "kW"
    this.short_tick_step = 100
    this.long_tick_step = 500
    this.value = 1533
  }
}

class WindSpeedGauge extends Gauge {
  constructor(grid_rect: Rect) {
    super("Wnd speed", 0, 30, grid_rect)
    this.unit = "ms⁻¹"
    this.value = 16.3
  }
}

class Compass extends DashboardItem {
  wind_direction: number
  nacelle_direction: number

  constructor(grid_rect: Rect) {
    super("Compass", grid_rect)
    this.wind_direction = 10
    this.nacelle_direction = 350
  }

  draw(ctx: CanvasRenderingContext2D): void {
    super.draw(ctx)

    ctx.save()
    ctx.translate(this.rect.position.x, this.rect.position.y + TITLE_HEIGHT)

    let size = new Size(
      this.rect.size.width,
      this.rect.size.height - TITLE_HEIGHT,
    )
    let center = new Point(
      size.width / 2,
      size.height / 2,
    )
    let radius = Math.min(center.x, center.y);
    let inlong_radius = 0.7 * radius
    let inshort_radius = 0.75 * radius
    let out_radius = 0.8 * radius

    // Ticks
    ctx.beginPath()
    ctx.lineWidth = 1
    ctx.strokeStyle = "white"
    for (let i = 0; i <= 360; i += 1) {
      let j = i * Math.PI / 180
      let cos = Math.cos(j)
      let sin = Math.sin(j)
      let in_radius = i % 5 ? inshort_radius : inlong_radius
      ctx.moveTo(
        center.x + in_radius * cos,
        center.y + in_radius * sin)
      ctx.lineTo(
        center.x + out_radius * cos,
        center.y + out_radius * sin
      )
    }
    ctx.stroke()

    // wind needle
    let wind_theta = this.wind_direction * Math.PI / 180 - Math.PI / 2
    let radius_in_needle = 0.82 * radius
    let radius_out_needle = 0.90 * radius
    let wind_p1_cos = Math.cos(wind_theta)
    let wind_p1_sin = Math.sin(wind_theta)
    let wind_p2_cos = Math.cos(wind_theta - 0.1)
    let wind_p2_sin = Math.sin(wind_theta - 0.1)
    let wind_p3_cos = Math.cos(wind_theta + 0.1)
    let wind_p3_sin = Math.sin(wind_theta + 0.1)

    ctx.beginPath()
    ctx.fillStyle = "red"
    ctx.moveTo(
      center.x + radius_in_needle * wind_p1_cos,
      center.y + radius_in_needle * wind_p1_sin
    )
    ctx.lineTo(
      center.x + radius_out_needle * wind_p2_cos,
      center.y + radius_out_needle * wind_p2_sin
    )
    ctx.lineTo(
      center.x + radius_out_needle * wind_p3_cos,
      center.y + radius_out_needle * wind_p3_sin
    )
    ctx.fill()

    // turbine needle
    let nacelle_theta = this.nacelle_direction * Math.PI / 180 - Math.PI / 2
    let radius_in_nacelle = 0.68 * radius
    let radius_out_nacelle = 0.60 * radius
    let nacelle_p1_cos = Math.cos(nacelle_theta)
    let nacelle_p1_sin = Math.sin(nacelle_theta)
    let nacelle_p2_cos = Math.cos(nacelle_theta - 0.1)
    let nacelle_p2_sin = Math.sin(nacelle_theta - 0.1)
    let nacelle_p3_cos = Math.cos(nacelle_theta + 0.1)
    let nacelle_p3_sin = Math.sin(nacelle_theta + 0.1)

    ctx.beginPath()
    ctx.fillStyle = "green"
    ctx.moveTo(
      center.x + radius_in_nacelle * nacelle_p1_cos,
      center.y + radius_in_nacelle * nacelle_p1_sin
    )
    ctx.lineTo(
      center.x + radius_out_nacelle * nacelle_p2_cos,
      center.y + radius_out_nacelle * nacelle_p2_sin
    )
    ctx.lineTo(
      center.x + radius_out_nacelle * nacelle_p3_cos,
      center.y + radius_out_nacelle * nacelle_p3_sin
    )
    ctx.fill()

    // Labels
    ctx.font = "16px monospace"
    ctx.textAlign = "center"
    ctx.fillStyle = "green"
    ctx.fillText("Nacelle direction:", center.x, center.y - 50)
    ctx.fillStyle = "red"
    ctx.fillText("Wind direction:", center.x, center.y + 50)


    ctx.fillStyle = "white"
    ctx.font = "bold 20px monospace"
    ctx.fillText(`${this.nacelle_direction}°`, center.x, center.y - 20)
    ctx.fillText(`${this.wind_direction}°`, center.x, center.y + 80)

    ctx.restore()
  }
}

interface BoxInfoEntry {
  label: string
  value: string
}

class BoxInfo extends DashboardItem {
  entries: BoxInfoEntry[]

  constructor(label: string, entries: BoxInfoEntry[], grid_rect: Rect) {
    super(label, grid_rect)
    this.entries = entries
  }

  draw(ctx: CanvasRenderingContext2D): void {
    super.draw(ctx)

    ctx.save()
    ctx.translate(this.rect.position.x, this.rect.position.y + 50)


    this.entries.forEach((entry, i) => {
      ctx.font = "16px monospace"
      ctx.textAlign = "left"
      ctx.fillStyle = "white"
      ctx.fillText(entry.label.toUpperCase() + ":", 10, i * 17, this.rect.size.width)
      ctx.textAlign = "right"
      ctx.fillText(entry.value, this.rect.size.width - 10, i * 17, this.rect.size.width)
    })

    ctx.restore()
  }
}

class MetadataBoxInfo extends BoxInfo {
  constructor(grid_rect: Rect) {
    super("Metadata", [], grid_rect)
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.entries = [
      { label: "Farm", value: "NO FARM" },
      { label: "Turbine", value: "NO TURBINE" },
      { label: "Turbine model", value: "NO MODEL" },
      { label: "Nominal power", value: `${Number.NaN} kW` }
    ]
    super.draw(ctx)
  }
}

class ScadaBoxInfo extends BoxInfo {
  constructor(grid_rect: Rect) {
    super("SCADA Info", [], grid_rect)

  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.entries = [
      { label: "Start", value: "1970-01-01T00:00:00" },
      { label: "End", value: "1970-01-01T00:00:00" },
      { label: "Records count", value: "0" },
      { label: "Current record", value: "0" },
      { label: "Timestamp", value: "1970-01-01T00:00:00" },
    ]
    super.draw(ctx)
  }
}

class Dashboard extends Widget {
  items: DashboardItem[]

  constructor() {
    super(new Rect(new Point(0, 0), new Size(1920, 1080)))
    this.items = [
      new MetadataBoxInfo(new Rect(new Point(0, 0), new Size(2, 1))),
      new ScadaBoxInfo(new Rect(new Point(0, 1), new Size(2, 1))),
      new AirTemperatureGauge(new Rect(new Point(0, 2), new Size(2, 2))),
      new PitchAngleGauge(new Rect(new Point(0, 4), new Size(2, 2))),
      new ActivePowerGauge(new Rect(new Point(2, 4), new Size(2, 2))),
      new WindSpeedGauge(new Rect(new Point(4, 4), new Size(2, 2))),
      new Compass(
        new Rect(new Point(2, 0), new Size(4, 4))
      ),
    ]
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx)
    ctx.save()
    ctx.translate(this.rect.position.x, this.rect.position.y)

    // Draw debug grid
    if (true) {
      ctx.beginPath()
      ctx.lineWidth = 1
      ctx.strokeStyle = "white"
      for (let x = 0; x < GRID_SIZE.width; ++x) {
        ctx.moveTo(x * ITEM_SIZE.width, 0)
        ctx.lineTo(x * ITEM_SIZE.width, GRID_SIZE.height * ITEM_SIZE.height)
      }
      for (let y = 0; y < GRID_SIZE.height; ++y) {
        ctx.moveTo(0, y * ITEM_SIZE.height)
        ctx.lineTo(GRID_SIZE.width * ITEM_SIZE.width, y * ITEM_SIZE.height)
      }
      ctx.stroke()
    }

    // Draw the items
    for (let item of this.items) {
      item.draw(ctx)
    }

    ctx.restore()
  }
}

class Engine {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  dashboard: Dashboard

  constructor() {
    this.canvas = document.getElementById("canvas")! as HTMLCanvasElement
    //this.canvas.width /= 2
    //this.canvas.height /= 2
    this.ctx = this.canvas.getContext("2d")! as CanvasRenderingContext2D
    this.dashboard = new Dashboard()
  }

  render() {
    this.ctx.save()
    this.ctx.scale(this.canvas.width / 1920, this.canvas.height / 1080) // Resize to 1920x1080

    this.dashboard.draw(this.ctx)

    this.ctx.restore()
    this.request_frame()
  }

  request_frame() {
    window.requestAnimationFrame(this.render.bind(this))
  }
}

interface ScadaRecord {
  timestamp: Date
  wind_speed: number
  wind_direction: number
  air_temperature: number
  nacelle_direction: number
  active_power: number
  pitch_angle: number
}


interface Metadata {
  farm: string | null
  turbine: string | null
  turbine_model: string | null
  nominal_power: number | null
}

function parse_scada(scada: string): ScadaRecord[] {
  let lines = scada.split("\n")

  // Parse headers
  let lut: Record<string, number> = {}
  lines[0].split(",").forEach((value, i) => {
    lut[value] = i
  })
  lines.splice(0, 1)

  return lines.map((line) => {
    let values = line.split(",")
    return {
      timestamp: new Date(values[lut["timestamp"]]),
      wind_speed: Number.parseFloat(values[lut["wind_speed"]]),
      wind_direction: Number.parseFloat(values[lut["wind_direction"]]),
      air_temperature: Number.parseFloat(values[lut["air_temperature"]]),
      nacelle_direction: Number.parseFloat(values[lut["nacelle_direction"]]),
      active_power: Number.parseFloat(values[lut["active_power"]]),
      pitch_angle: Number.parseFloat(values[lut["pitch_angle"]]),
    }
  })
}


let records = parse_scada((document.getElementById("scada")! as HTMLTextAreaElement).value)

const ui = new Engine()
ui.request_frame()