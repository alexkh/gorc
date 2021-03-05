'use strict'

// this parameter tells how much of the borders to cut out
const border_cut = {	left: 1,
			top: 1,
			right: 1,
			bottom: 1}
const express = require('express')
const app = express()
const server = require('http').Server(app)
const fs = require('fs')
const path = require('path')
const {exec, execSync} = require('child_process')
const WebSocket = require('ws')
const wss = new WebSocket.Server({port: 3061})

// there are two screenshot files: /tmp/gorc0.png and /tmp/gorc1.png
// the screenshot is saved to the back buffer, once saving is done and a change
// is detected, then it becomes the front buffer, and the other one back buffer
// front_buf_ind can be null, 0 or 1, it's the one ready for downloading
let front_buf_ind = null
let front_buf_size = 0 // size in bytes of the current front buffer png image

let geom = null // GrandOrgue window geometry

let cur_ws = null // only one connection is supported

let buf_upd_timer = null // timer for updating the image buffers

function get_window_geom() {
	const stdout = execSync(`swaymsg -t get_tree | \
jq -r 'first(.. | select(.type?) | \
select(.window_properties.instance=="GrandOrgue" and .rect.height>200).rect)'`,
	{encoding: 'utf8'})
	if(stdout) {
		let g = JSON.parse(stdout)
		g.x += border_cut.left
		g.y += border_cut.top
		g.width -= border_cut.right
		g.height -= border_cut.bottom
	}
	return stdout? JSON.parse(stdout): null
}

function take_screenshot(geom, buf_ind) {
	if(!geom) return
	execSync(`grim -g "${geom.x},${geom.y} ${geom.width}x${geom.height}" \
		/tmp/gorc${buf_ind}.png`)
}

function update_buf() {
	geom = get_window_geom()
	let back_buf_ind = front_buf_ind === 0? 1: 0

	take_screenshot(geom, back_buf_ind)

	let back_buf_size = fs.statSync(`/tmp/gorc${back_buf_ind}.png`).size

	// compare the img buffer png file sizes to see whether they are different
	if(front_buf_size && back_buf_size === front_buf_size) {
		return false
	}

	// yes, the new screenshot is different:
	front_buf_ind = back_buf_ind
	front_buf_size = back_buf_size
	return true
}

function cursor_move_click(x, y) {
	console.log('performing the click')
	let xoff = x + 1
	execSync(`swaymsg seat seat0 cursor set ${x} ${y} && \
		swaymsg seat seat0 cursor press BTN_LEFT && \
		swaymsg seat seat0 cursor set ${xoff} ${y} &&
		swaymsg seat seat0 cursor release BTN_LEFT`)
}

app.use(express.static('public'))

app.get('/bg.png', function(req, res) {
//	console.log(`/tmp/gorc${front_buf_ind}.png`)
	if(front_buf_ind === null) {
		return
	}
	res.set('Cache-Control', 'no-store')
	res.sendFile(`/tmp/gorc${front_buf_ind}.png`)
})

function tick() {
	if(!update_buf()) return
	// inform the client that the image was updated
//	console.log('img updated')
	send({type: 'updated'})
}

function on_clicked(msg) {
	cursor_move_click(geom.x + msg.x, geom.y + msg.y)
}

// keepalive mechanism sends ping requests every once in a while
function keepalive() {
	cur_ws.is_alive = true
}

function noop() {}

const keepalive_interval = setInterval(function() {
	if(!cur_ws) return
	if(cur_ws.is_alive === false) {
		cur_ws.terminate()
		cur_ws = null
		return
	}
	cur_ws.is_alive = false
	cur_ws.ping(noop)
}, 3492)

function send(data) {
	if(cur_ws) {
		cur_ws.send(JSON.stringify(data))
	}
}

wss.on('connection', function connection(ws, req) {
	if(cur_ws) return
	cur_ws = ws

	send({type: 'welcome'})

	ws.on('pong', keepalive)

	ws.on('message', function(message) {
		try {
			const msg = JSON.parse(message)
			console.log('received: %s', message)
			switch(msg.type) {
			case 'clicked': on_clicked(msg); break
			}
		} catch(err) {
			console.log(err)
		}
	})
})

function init() {
	geom = get_window_geom()
	if(!geom) {
		console.log('Error: Is GrandOrgue running? Exiting...')
		process.exit(1)
	}

	server.listen(3060, function() {
		console.log('Listening on port 3060')
	})

	buf_upd_timer = setInterval(tick, 495)
}

init()

