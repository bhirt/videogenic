# videogenic

Videogenic allows you to split and cut your videos using an EDL.   It was specifically designed to work with my DVR setup on Plex and relies `comskip` for EDL detection and `ffmpeg` for video processing.

Videogenic currently has two functions.   The spilt feature allows you to select a frame in your video and create two resulting videos based on the selected timestamp.   The cut feature allows you load/edit/save your EDL and then create a final video minus the EDL cut ranges.  Both operations use lossless video stream copy which avoids slow transcodes that will create a lossly output.

The program front end currently runs in a browser with a backend that can be run locally on your desktop or remotely on your media server.   Node is required.

In the future there are plans to support native applications on Mac/Windows/Linux in addition to the current client server.   You can [read more](doc/about.md) about the history of this project, future goals and the roadmap.  You can also [see a few animated gifs](doc/example.md) that demonstrate the interface for split and cut.

# Setup/Install

* Install ffmpeg somewhere in your search path
* Install node (works best with node 8)
* Clone the repository with `git clone`
* Change to the src directory
* Edit config/default.json
* Install npm dependencies with `npm install`
* Build the project with `npm run build`
* Start the local express server with `npm start`
* Connect to http://localhost:3000/ with your browser (Chrome and Safari are the only tested browsers at this ponit)

The config/default.json file is stores default configs like the path of your media library. 


# Supported Platforms

The initial commit was developed on macOS.   I suspect Linux and Windows are currently not supported.  It should be trivial to add support for them and pull requests are welcomed.

