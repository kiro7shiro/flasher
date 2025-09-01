# FLASHER

Currently this is a proof of concept.

## Introduction
Flasher is a program for making audio visualizers in the browser. It's main goal is to send audio information to different types of visualizers including hardware ones. To make colors and lights dance to the music. :)

## Concept
The main idea is to change the audio data with AudioNodes to accomplish different behaviors of the visualization. The core component is the WebAudioApi's AnalyzerNode which generates the basic fft analysis needed for interpreting the currently played music.

## Test
To test download the repository. If you installed VSCode with the LiveServer addon. You can run the server from the 'public/index.html' file. Otherwise you'll need to deploy your own server, which will have to to serve the static files listed in the '.vscode/settings.json' file.
If you put some music files in the 'public/music' folder. Filenames should appear after the update. Now you can play around. Be aware that that's not very much at this point. Any help is appreciated.