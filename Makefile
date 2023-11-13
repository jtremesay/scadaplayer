turbine ?= R80711
end_date ?= 2013-01-02

scadaplayer_$(turbine).webm: out/scadaplayer_000000000.png
	ffmpeg -y -framerate 1 -i out/scadaplayer_%09d.png $@

out/scadaplayer_000000000.png: data/scada_$(turbine).csv
	python main.py --end $(end_date) $<