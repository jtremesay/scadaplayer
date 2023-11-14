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
import sys
from typing import Optional

from PySide6.QtCore import Qt
from PySide6.QtGui import QBrush, QPainter
from PySide6.QtOpenGLWidgets import QOpenGLWidget
from PySide6.QtWidgets import QApplication, QVBoxLayout, QWidget


class DashboardWidget(QOpenGLWidget):
    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)


class GaugeWidget(QOpenGLWidget):
    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setPen(Qt.blue)
        painter.setBrush(QBrush(Qt.blue))
        painter.drawRect(0, 0, 180, 180)


class MyWidget(QWidget):
    def __init__(self):
        super().__init__()

        self.setLayout(QVBoxLayout(self))

        self.gauge = GaugeWidget()
        self.layout().addWidget(self.gauge)

        self.gauge = GaugeWidget()
        self.layout().addWidget(self.gauge)


if __name__ == "__main__":
    app = QApplication([])

    widget = MyWidget()
    widget.resize(800, 600)
    widget.show()

    sys.exit(app.exec())
