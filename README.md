### FLASHER

Flasher is a program for making audio visualizers in the browser. It's main goal is to send audio information to different types of visualizers including hardware ones. To make colors and lights dance to the music. :)

Currently this is a proof of concept.

To test download the repository. If you installed VSCode with the LiveServer addon. You can run the server from the 'public/index.html' file. Otherwise you'll need to deploy your own server, which will have to to serve the static files listed in the '.vscode/setting.json' file.
If you put some music files in the 'public/music' folder. Filenames should appear after the update. Now you can play around. Be aware that that's not very much at this point. Any help is appreciated.

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