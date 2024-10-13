# FLASHER

Currently this is a proof of concept.

Flasher is a program for making audio visualizers in the browser. It's main goal is to send audio information to different types of visualizers including hardware ones. To make colors and lights dance to the music. :)
The main idea is to change the audio data with AudioNodes to accomplish different behaviors of the visualization. The core component is the WebAudioApi AnalyzerNode which generates the basic fft analysis needed for interpreting the currently played music.
To achieve that each visualizer has an 'audioGraph' array which holds references to the attached AudioNodes. When the visualizer is connected to the sound source first all of it's audio graph nodes are connected. In the order in which they are stored in the array. The last node in the chain is always the analyzer. Now the audio data can be changed before it is been analyzed. That enables the ability to change the visualization while the music is playing.
Each visualizer performs it's own interpretation of the resulting fft analysis. It comes with a screen class attached that wrapped's around a canvas element. This element is used to draw a visualization on the screen.

### AudioGraph
- the last node in an audio graph is always the analyzer
- before the analyzer node there must be a 'merge' node, we will use a gain that act's as a preamp, too
- nodes in the graph can have multiple inputs and outputs, this means that one graph can have multiple branches, each branch has to finally merge into the analyzer node
- how are connections represented and edited?
    - new branches are arrays, too
- visualizers connect() method need's to be updated

To test download the repository. If you installed VSCode with the LiveServer addon. You can run the server from the 'public/index.html' file. Otherwise you'll need to deploy your own server, which will have to to serve the static files listed in the '.vscode/settings.json' file.
If you put some music files in the 'public/music' folder. Filenames should appear after the update. Now you can play around. Be aware that that's not very much at this point. Any help is appreciated.

TODO : 
- memory management, remember memory is hardware!
- make a data routing server that connects the client app to hardware devices
- send visualizer data to hardware devices
- DONE : basic client app
- DONE : load audio from files
- DONE : FFT visualizer
- DONE : STFT visualizer
- DONE : rename STFT to Spectrum
- DONE : Grid visualizer
- list all available sources: files, streams 
- save audio to files
- save settings to files
- make a playlist control
- DONE : make a add visualizer menu
- connect video and audio elements
- add scrolling text for long title names
- bpm detection
- fix Grid.js cells mapping