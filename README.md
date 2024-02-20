### FLASHER

Flasher is a program for making audio visualizers in the browser. It's main goal is to send audio information to different types of visualizers including hardware ones. To make colors and lights dance to the music. :)

Currently this is a proof of concept.

For testing download the repository. If you have VSCode installed with the LiveServer addon. You can run the server from the 'public/index.html' file. Otherwise you have to provide your own server that needs to serve the static files noted in the '.vscode/setting.json' file.

TODO : 
- memory management, remember memory is hardware!
- make a data routing server that connects the client app to hardware devices
- send visualizer data to hardware devices
- DONE : basic client app
- DONE : load audio from files
- DONE : FFT visualizer
- DONE : STFT visualizer
- rename STFT to Spectrum
- DONE : Grid visualizer
- list all available sources: files, streams 
- save audio to files
- save settings to files
- make a playlist control
- make a add visualizer menu
- connect video and audio elements
- add scrolling text for long title names