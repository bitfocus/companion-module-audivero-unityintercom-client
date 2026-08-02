const { InstanceStatus } = require('@companion-module/base')
const crypto = require('crypto')

const { getSurfaceModel } = require('./models')

//the Version field in the poll response is the *protocol* version, not our module version.
//The Unity spec requires 1.4 or later here to signal that the DeviceID-based protocol
//is supported - sending our package version instead is not what the client is looking for.
const PROTOCOL_VERSION = '1.4'

module.exports = {
	//The spec calls for a GUID uniquely identifying the attached panel, formatted as
	//32 hex characters. Derive it from the Companion connection id so it is unique per
	//instance and stable across restarts without needing to be persisted.
	getDeviceId: function () {
		let self = this

		if (self.config.deviceId) {
			return self.config.deviceId
		}

		return crypto
			.createHash('md5')
			.update('companion-' + self.id)
			.digest('hex')
	},

	//The spec's Update field is the panel's layout version: "if the number changes, it
	//forces us to resend all text and color information to the panel". We had this pinned
	//at 0, so a layout change never triggered a resend. Derive it from the layout itself so
	//it changes whenever the layout does, and stays put across restarts when it hasn't.
	getLayoutVersion: function () {
		let self = this

		let model = getSurfaceModel(self.config.surfaceModel)
		let signature = [model.productId, model.rows, model.columns, self.API_BUTTONS].join(':')

		return parseInt(crypto.createHash('md5').update(signature).digest('hex').slice(0, 6), 16)
	},

	closeConnection: function () {
		let self = this

		//the pending disconnect timer belongs to the connection we are tearing down,
		//otherwise it fires later and marks a freshly reconnecting instance as errored
		if (self.POLL_TIMER !== null) {
			clearTimeout(self.POLL_TIMER)
			self.POLL_TIMER = null
		}

		const socket = self.udp
		self.udp = null

		if (!socket) {
			return
		}

		//stop handling messages from the old socket right away, even if the close below fails,
		//otherwise every inbound packet gets processed once per socket we ever created
		socket.removeAllListeners('message')
		socket.removeAllListeners('error')

		try {
			socket.close()
		} catch (error) {
			//close() throws if the socket is already closed, or hasn't finished binding yet
			//in the latter case, close it as soon as it is actually bound
			socket.once('listening', function () {
				try {
					socket.close()
				} catch (closeError) {
					//nothing more we can do with this socket
				}
			})
		}
	},

	initConnection: function () {
		let self = this

		self.closeConnection()

		//this is a brand new connection, so the next poll we receive should take us back to Ok
		self.FIRST_POLL = true

		self.updateStatus(InstanceStatus.Connecting)

		self.DEVICEID = self.getDeviceId()

		if (!self.config.port) {
			self.config.port = 20119
		}

		if (self.config.host !== undefined) {
			try {
				self.log('info', `Starting UDP Connection to Unity  Client: ${self.config.host}:${self.config.port}`)
				self.udp = self.createSharedUdpSocket('udp4', (msg, rinfo) => self.checkMessage(self, msg, rinfo))
				self.udp.bind(self.config.port)

				self.udp.on('error', function (err) {
					self.updateStatus(InstanceStatus.ConnectionFailure)
					self.log('error', 'Network error: ' + err.message)
				})
			} catch (error) {
				self.log('error', 'Error binding UDP Port: ' + error)
			}
		}
	},

	getPressDelay: function () {
		let self = this

		let pressDelay = parseInt(self.config.pressDelay)

		return isNaN(pressDelay) ? 50 : pressDelay
	},

	sendCommand: function (cmd) {
		let self = this

		if (!cmd || !cmd.Type) return

		// Default delay if nothing special
		let delayAfter = 50

		// Special handling for certain types
		if (cmd.Type === 'Keydown' || cmd.Type === 'Dialdown') {
			// Send the down event, then wait just long enough for the client to register it.
			// The wait must stay short: the matching keyup/dialup sits behind this in the queue,
			// and holding it back too long makes a short press read as a hold in the Unity client.
			// Raise the "Press Hold Time" config value if the client is slow to register presses.
			self.udpQueue.push({
				data: cmd,
				delayAfter: self.getPressDelay(),
			})
		} else if (cmd.Type === 'Keyup') {
			self.udpQueue.push({
				data: cmd,
				delayAfter: 200,
			})
		} else if (cmd.Type === 'Dialup') {
			self.udpQueue.push({
				data: cmd,
				delayAfter: 200,
			})
		} else if (cmd.Type === 'Rotate') {
			self.udpQueue.push({
				data: cmd,
				delayAfter: 50,
			})
		} else {
			// fallback
			self.udpQueue.push({
				data: cmd,
				delayAfter: delayAfter,
			})
		}

		self.processUdpQueue()
	},

	processUdpQueue: function () {
		let self = this

		if (self.udpSending || self.udpQueue.length === 0) {
			return
		}

		const next = self.udpQueue.shift()
		self.udpSending = true

		let delay = 0

		if (next.data) {
			const message = Buffer.from(JSON.stringify(next.data))
			if (self.config.verbose) {
				self.log('debug', `Sending UDP: ${message} to ${self.config.host}:${self.config.remoteport}`)
			}

			if (self.udp && self.config.host && self.config.remoteport) {
				self.udp.send(message, self.config.remoteport, self.config.host)
			}

			delay = next.delayAfter ?? 50
		} else if (next.wait) {
			delay = next.wait
		}

		setTimeout(() => {
			self.udpSending = false
			self.processUdpQueue()
		}, delay)
	},

	initKeystates: function () {
		let self = this

		self.keyStates = []
		self.CHOICES_BUTTONS = []

		if (self.config.buttonCount) {
			self.API_BUTTONS = parseInt(self.config.buttonCount) || 80
		}

		for (let i = 0; i < self.API_BUTTONS; i++) {
			let keyObj = {}
			keyObj.buttonNumber = i
			keyObj.red = false
			keyObj.purple = false
			keyObj.green = false
			keyObj.blue = false
			keyObj.pink = false
			keyObj.brown = false
			self.keyStates.push(keyObj)

			let labelObj = {}
			labelObj.id = '' + i
			labelObj.label = 'Button ' + (i + 1)
			self.CHOICES_BUTTONS.push(labelObj)
		}
	},

	checkMessage(self, msg, rinfo) {
		try {
			if (rinfo.address == self.config.host) {
				//if the remote address isn't our configured host, it's just some other Unity client
				self.config.remoteport = rinfo.port
				self.processFeedback(Buffer.from(msg).toString('utf8'), rinfo.address, rinfo.port)
			} else {
				if (self.config.verbose) {
					self.log('info', `Ignoring UDP message from unknown source: ${rinfo.address}:${rinfo.port}`)
				}
			}
		} catch (err) {
			self.log('error', `UDP error: ${err.message}`)
		}
	},

	processFeedback: function (data, address, port) {
		let self = this

		let objJson

		try {
			objJson = JSON.parse(data)
		} catch (error) {
			//error parsing JSON
			self.log('error', 'The client returned some unexpected data.')
		}

		if (objJson) {
			//we should also check to see if the DeviceID matches our DEVICEID, because if not, maybe it is some other module talking to the same Unity client

			//check for poll message first and respond
			//we don't care about the DeviceID for a poll message, because it's just asking
			if (objJson.Type.toLowerCase() === 'poll') {
				self.SendPollResponse()
				return
			} else {
				//check to see what the data is
				//console.log(objJson)
			}

			//only filter on DeviceID if the client actually sent one back to us
			//older/other Unity client versions omit it entirely, and dropping those messages
			//silently kills all feedback (see issue #19)
			if (objJson.DeviceID && objJson.DeviceID !== self.DEVICEID) {
				//this message isn't for us
				self.log('warn', `Ignoring message intended for another device: ${objJson.DeviceID}`)
				return
			}

			switch (objJson.Type.toLowerCase()) {
				case 'settext':
					self.SetText(objJson.Button, objJson.Text)
					break
				case 'setfeedbacklayout':
					//console.log(objJson)
					break
				case 'setfeedback':
					//console.log(objJson)
					self.SetFeedback(objJson.Button, objJson.Value, objJson.Label, objJson.Text)
					break
				case 'setred':
					self.setColor('red', objJson.Button, objJson.Value)
					break
				case 'setpurple':
					self.setColor('purple', objJson.Button, objJson.Value)
					break
				case 'setgreen':
					self.setColor('green', objJson.Button, objJson.Value)
					break
				case 'setblue':
					self.setColor('blue', objJson.Button, objJson.Value)
					break
				case 'setpink':
					self.setColor('pink', objJson.Button, objJson.Value)
					break
				case 'setbrown':
					self.setColor('brown', objJson.Button, objJson.Value)
					break
				default:
					//unknown command
					break
			}

			//console.log(objJson)

			self.checkFeedbacks()
		}
	},

	SendPollResponse: function () {
		let self = this

		if (self.POLL_TIMER !== null) {
			clearTimeout(self.POLL_TIMER)
			self.POLL_TIMER = null
		}

		if (self.FIRST_POLL === true) {
			self.updateStatus(InstanceStatus.Ok)
			self.FIRST_POLL = false
		}

		self.POLL_TIMER = setTimeout(self.RegisterDisconnect.bind(self), 10000)

		//ProductID and the grid must always come from the same model entry - see src/models.js
		let model = getSurfaceModel(self.config.surfaceModel)

		let responseObj = {
			Type: 'Poll',
			Name: `Companion - ${self.id}`,
			Rows: model.rows,
			Columns: model.columns,
			Update: self.getLayoutVersion(),
			ProductID: model.productId,
			Version: PROTOCOL_VERSION,
			DeviceID: self.DEVICEID,
		}

		if (self.udp) {
			if (self.config.host && self.config.remoteport) {
				self.udp.send(JSON.stringify(responseObj), self.config.remoteport, self.config.host)
			}
		}
	},

	RegisterDisconnect: function () {
		let self = this

		self.updateStatus(InstanceStatus.Error)
		self.log('error', 'Client has stopped responding.')

		if (self.POLL_TIMER !== null) {
			clearTimeout(self.POLL_TIMER)
			self.POLL_TIMER = null
		}
	},

	SetText: function (buttonNumber, text) {
		let self = this

		for (let i = 0; i < self.keyStates.length; i++) {
			if (self.keyStates[i].buttonNumber === buttonNumber) {
				self.keyStates[i].text = text
				break
			}
		}

		let variableObj = {}
		variableObj['button_' + (buttonNumber + 1) + '_text'] = text

		self.setVariableValues(variableObj)
	},

	SetFeedback: function (buttonNumber, value, label, text) {
		let self = this

		//text = variable name, label = variable value
		//for now let's just declare the variableId as the name minus any invalid characters
		//we don't really know what properties are available until they come in, so if it's something we haven't received before, let's re initialize the variables before setting the value

		//
		let variableId = text.toLowerCase().replace(/[^a-z0-9_]/g, '_')
		let variableName = text
		let variableValue = label

		//search self.VARIABLES to see if variableId exists
		let variableExists = false
		for (let i = 0; i < self.VARIABLES.length; i++) {
			if (self.VARIABLES[i].variableId === variableId) {
				variableExists = true
				break
			}
		}

		if (!variableExists) {
			self.VARIABLES.push({ variableId: variableId, name: variableName })
			console.log(self.VARIABLES)
			self.initVariables()
		}

		let variableObj = {}
		variableObj[variableId] = variableValue
		self.setVariableValues(variableObj)
	},

	setColor: function (color, buttonNumber, value) {
		let self = this

		//the client sends 1/0, and has also been seen sending "1"/"0" and true/false,
		//so normalize to a real boolean here - the feedback callback compares with ===
		let state = false

		if (typeof value === 'number') {
			state = value === 1
		} else if (typeof value === 'string') {
			state = Number(value) === 1
		} else {
			state = !!value
		}

		for (let i = 0; i < self.keyStates.length; i++) {
			if (self.keyStates[i].buttonNumber === buttonNumber) {
				self.keyStates[i][color] = state
				break
			}
		}
	},
}
