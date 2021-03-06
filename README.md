# gorc
GrandOrgue Remote Control Android Client and Sway Server

This is a setup I use to control my GrandOrgue register stops from (supposedly)
any Android tablet or phone by means of a web browser. It might work on other
clients as long as they have a web browser, I just didn't test anything else.

It is specifically designed and will only work on Sway-based desktop environment
in Linux.

This software is written in Javascript and depends on:

	Linux

	GrandOrgue software, which is a free sampler of many freely available
	organ sample libraries.

	NodeJs

	NPM

	ws - node package for websocket communication

	Nodemon (optional: otherwise use "node index.js" to start)

	jq - jason parser cli app

	grim - screenshot taking cli app

	Sway Window Manager or a Sway-based window manager that supports swaymsg

	A client tablet/phone/pc with a web browser and an optional touch screen.

Security concern: Warning!
This should be used on local network only, there is no credentials checking or
any sort of encryption going on. Also, if some other window overlaps the
GrandOrgue window, the client will be able to see and click on that window.
This works for my use case, but might be inacceptable for environments where
public has access to a particular local network or the client tablet. Please
don't assume that this software has any security measures: it does not.

Installing:
Just unpack this into a directory as a user (not as root), then change into
the directory gorc that contains package.json. Depending on your nodejs setup,
you might need to run:

	npm i

to install missing nodejs components. Then, to start the server, start GrandOrgue
first, then run:

	npm start
or, if you don't have or don't want to use nodemon:
	node index.js

On the client, which is your tablet/phone/pc open a web browser and type the
address of your server computer and port 3060, for example:

	192.168.1.3:3060

The GUI of the GrandOrgue screen should appear in the browser window. Clicking on
the black area should toggle the FullScreen mode of the browser. You can now
click on the stops to pull and push them.
