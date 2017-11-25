# About

This software is brand new, actively being developed and very much at an
alpha/proof of concept stage.   Don't expect a feature rich, stable and easy to
install application.   You will need to tinker with the command line and
possibly make code changes to get it working for you. You will also have to
install additionaly third party software such as `node` and `ffmpeg`

## History

I use Plex for my media library.  I recently got an HDHomeRun and set it up to
be used as a DVR through Plex.   For the most part it's been working great, but
the commercials are really annoying.  I started using
[comskip](http://www.kaashoek.com/comskip/) (took some tinkering) and it did an
okay job of detecting commercials and things looked very promissing.  

Next I got [comchap](https://github.com/BrettSheleski/comchap/) and started
using it's `comcut` script to create a new video based on the `comskip`
generated EDL. Immediately I started to notice all the errors with comskips
commercial detection. Since all the segments marked in the EDL were removed from
the file,  including false positives have, you are out of luck.  This is
slightly annoying when you get an extra second of a commercial or miss a second
or two of your show. However, it becomes a showstopper when 5 minutes of the
show you are watching gets removed from your video. 

After that I started using `comchap` instead of `comcut`.   `Comchap`
automatically add chapter markers to your videos based on where the EDL.  The
problem with this approach was twofold.  First, there was no quick easy way to
skip to the next chapter in Plex when a commercial started.   Second, if the
commercial detection was off, it was too slow to sikp forward 30/back 10 in Plex
and to make things worse, things like the Apple TV version of Plex don't even
have +30/-10 options, you have to manually sroll with the remote.  So `comchap`
got put on the chopping block.

Finally I decided that I would manually go through my videos and fix the edl
created by `comskip`.  It quickly became clear that using Plex or VLC to
manually thumb through videos to find the proper timestamps and then manually
editing the EDL was an epic waste of time and extremely error prone.  

Resigned, I spent hours and hours researching for any tool that might help me
that I missed my first time around.  Sadly, I was unable to find anything that
would work on my Mac or meet the requirements I had.  People all seem to love
mcebuddy, but it wasn't anything I could use.  The tools I tried either didn't
work or didn't support the fast streamlined process I was invisioning.

Eventually I decided to create something that would help me with this task and
thus this project was born.

## Basic Features

### Split

This feature allows you to split a video into two parts using ffmpegs lossless
stream copy.   Move the slider to where you want the video to be split and press
the split button.  Two files will be created in the same directory as the
original video with the names supplied. You are not able to specify a different
output directory and trying to put slashes in the filename will cause an error
when attempting to split.

If the file has an associated EDL, a visual range will be displayed above the
slider showing there the commercial breaks are.

### EDL Cutter

This feature currently allows you to load, edit and save an EDL for a video and
also gives the ability to create a new video which extracts out the commercials.

## Roadmap

The motivation for creating this software is to help me manage my Plex library.
The initial features I have implemented are specifiaclly for needs that I had.
I have a pretty basic roadmap and a limited amount of time to work on this
project.

### TODO

-   add ability to edit some of the configuration within the app

-   more persistant backend session. currently the backend session is stored in
    memory using the express
    [memorystore](https://www.npmjs.com/package/memorystore) module.  When the
    server is restarted (which happens during development all the time), the
    client is forced to start the editing process all over.

-   create a backend version of the cut process that allows the final output to
    be created without having to write intermediate files to disk to speed up
    the IO.  This can be done on posix systems that support named pipes.   The
    [concatenate document](https://trac.ffmpeg.org/wiki/Concatenate) over on
    ffpmeg's site shows some examples of how that can be done.  

-   improve `Split` to create two edl from the source edl

-   create clip functionality that allows you to easily select a timerange and
    save it

-   add Windows and Linux compatibilyt

-   create an [Electron](https://electron.atom.io/) version of the app that
    doesn't need a backend server and can all be run natively.

### Completed

-   ~~Hot Module Reloading (HMR) -- using express and webpack middleware~~

-   ~~add ability to store configuration in an external file, most likely using
    the npm [config](https://www.npmjs.com/package/config) module~~

-   ~~css modules~~

I imagine that Windows and Linux support will be the most requested feature
initially.  My problems with getting them supported is that I don't have a
windows machine or a linux machine.  I also don't have
[parallels](https://www.parallels.com) or a [Windows
10](https://www.microsoft.com/en-us/software-download/windows10ISO) license.
Linux will probably be the easiest since I can download
[VirtualBox](https://www.virtualbox.org/wiki/Downloads) and
[Ubuntu](https://www.ubuntu.com)

If Windows and Linux support is something you want, I will need help from you to
get it done.

## Support

If you are having problems, I'll try my best to help.  My main machine is a Mac
and I don't currently have access to Linux or Windows.  Any platform specific
questions I 

## Feature Requests

Open an issue on the github repo.  If the feature makes sense and is easy to
implement and I have time, I will attempt to add it.

If you want to implement your own feature, fork the repo and submit a pull
request.   If the pull request is approved it will be merged into the project.
Otherwise you can use your own fork.   Note any submissions to the projcet must
use the same license as this one.

## Technologies

This application is built using many underlaying technologies, including the
following:   

-   [ffmpeg](http://ffmpeg.org) - all video processing and frame grabs.  

-   [react](https://reactjs.org) - front end browser components

-   [react-bootstrap](https://react-bootstrap.github.io) - browesr ui components

-   [node](https://nodejs.org/en/) - for the backend server

-   [express](https://expressjs.com) - for the backend webserver

-   [socket.io](https://socket.io) - for the backend/frontend messaging

-   [babel](https://babeljs.io) - for converting jsx and es6 code to something
    that can run in the browser

-   [webpack](https://webpack.js.org) - for packaging the javascript into a
    runable bundle

## License

```text
BSD 2-Clause License

Copyright (c) 2017, Brian Hirt
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```
