(function() {
'use strict'

var ws = null // websocket connection to the server
var ws_url = 'ws://' + window.location.hostname + ':3061' // websocket url
var fs_requested = false // was fullscreen requested by user touching black area?
var win = $(window) // jquery object representing the window
var bg_img = null // the jquery object of our <img> element
var bg_img_scale = 1 // the image is scaled to fill the screen

function reconnect_ws() {
	if(ws) {
		ws.close()
	}
	ws = null
	ws = new WebSocket(ws_url)
	ws.addEventListener('message', on_ws_message)
}

function on_welcome(msg) {
}

function on_updated(msg) {
//	console.log('updating background image')
	$('#bg_img')[0].src = 'bg.png'
}

function on_bg_click(e) {
//	console.log(e.offsetX, e.offsetY, e)
	console.log(e.px_current_x, e.px_current_y)
	var x = e.px_current_x - bg_img.offset().left
	var y = e.px_current_y - bg_img.offset().top
	e.stopPropagation()
	send({type: 'clicked',
		x: Math.round(x / bg_img_scale),
		y: Math.round(y / bg_img_scale)})
}

function on_fs_click(e) {
	if(!fs_requested && !document.fullscreenElement) {
		fs_requested = true
		document.documentElement.requestFullscreen()
		return
	} else {
		fs_requested = false
		document.exitFullscreen()
	}
}

function send(data) {
	if(!ws || ws.readyState > 1.5) {
		reconnect_ws()
		return
	}
	ws.send(JSON.stringify(data))
}

function on_ws_message(e) {
	try {
		var msg = JSON.parse(e.data)
		if(!msg || !msg.type) {
			console.log('error: invalid ws message received')
			return
		}
		switch(msg.type) {
		case 'welcome': on_welcome(msg); break
		case 'updated': on_updated(msg); break
		}
	} catch(err) {
		console.log('error during websocket message processing')
	}
}

function on_resize() {
	var iw = bg_img[0].naturalWidth
	var ih = bg_img[0].naturalHeight
	var ir = iw / ih

	if(!iw) return

	var w = win.width()
	var h = win.height()
	var r = w / h

	if(r < ir) {
		// background is portrait
		bg_img.css({width: w + 'px',
			height: (w / ir) + 'px'})
		bg_img_scale = w / iw
	} else {
		// background is landscape
		bg_img.css({width: (h * ir) + 'px',
			height: h + 'px'})
		bg_img_scale = h / ih
	}
}

function noop() {}

$(function() {
	reconnect_ws()
	bg_img = $('#bg_img')
//	bg_img.click(on_bg_click)
	bg_img.bind('udragstart', on_bg_click)
		.bind('udragmove', noop)
		.bind('udragend', noop)
		.bind('uheldstart', on_bg_click)
		.bind('uheldmove', noop)
		.bind('uheldend', noop)
	bg_img[0].onload = on_resize
//	$('#wrap').click(on_fs_click)
	$('#wrap').bind('udragstart', on_fs_click)
		.bind('udragmove', noop)
		.bind('udragend', noop)
		.bind('uheldstart', on_fs_click)
		.bind('uheldmove', noop)
		.bind('uheldend', noop)
	win.resize(on_resize)
	on_resize()
})

})(jQuery)
