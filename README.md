# flasher
web audio visualizer

## concept

- use web audio api's analyzer node to get frequncy data from an audio source
- calculate graphical data that can be shown on a canvas
- use socket.io to send data via the web

## viusalizers

- a visualizer is a class thats analysis audio data and constructs graphical data from it
- the constructed data can be shown on a canvas
- the constructed data can be send to other visualizers