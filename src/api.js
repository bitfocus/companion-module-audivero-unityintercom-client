
const { InstanceStatus } = require('@companion-module/base')

const VERSION = require('../package.json').version;

module.exports = {	
	init_udp: function() {
		let self = this;
	
		self.updateStatus(InstanceStatus.Connecting);
	
		if (!self.config.port) {
			self.config.port = 20119;
		}
	
		if (self.config.host !== undefined) {
			try {
				self.udp = self.createSharedUdpSocket('udp4', (msg, rinfo) => self.checkMessage(self, msg, rinfo))
				/*
				
				*/
				self.udp.bind(self.config.port);
		
				self.udp.on('error', function (err) {
					self.updateStatus(InstanceStatus.ConnectionFailure);
					self.log('error','Network error: ' + err.message);
				});
		
				self.udp.on('message', function (data, rinfo) {
					self.processFeedback(data.toString(), rinfo.address, rinfo.port);
				});
			}
			catch (error) {
				self.log('error', 'Error binding UDP Port: ' + error);
			}
		}
	},

	sendCommand: function(cmd) {
		let self = this;

		if (cmd !== undefined) {
			if (self.udp !== undefined ) {
				if ((self.config.host) && (self.config.remoteport)) {
					self.udp.send(cmd, self.config.remoteport, self.config.host);
				}
			}
		}
	},

	init_keystates: function() {
		let self = this;
	
		self.keyStates = [];
		self.CHOICES_BUTTONS = [];
	
		for (let i = 0; i < self.API_BUTTONS; i++) {
			let keyObj = {};
			keyObj.buttonNumber = i;
			keyObj.blue = false;
			keyObj.red = false;
			self.keyStates.push(keyObj);
	
			let labelObj = {};
			labelObj.id = '' + i;
			labelObj.label = 'Button ' + (i+1);
			self.CHOICES_BUTTONS.push(labelObj);
		}
	},

	checkMessage(self, msg, rinfo) {
		try {
			if (rinfo.address == self.config.host) { //if the remote address isn't our configured host, it's just some other Unity client
				self.config.remoteport = port;
				self.processFeedback(msg.toString(), rinfo.address, rinfo.port);				
			}
		} catch (err) {
			self.log('error', `UDP error: ${err.message}`)
		}
	},

	processFeedback: function(data, address, port) {
		let self = this;
	
		let objJson;
	
	
			try {
				objJson = JSON.parse(data);
			}
			catch(error) {
				//error parsing JSON
				self.log('error', 'The client returned some unexpected data.');
			}
		
			if (objJson) {
				//check to see what the data is
		
				switch(objJson.Type.toLowerCase()) {
					case 'poll':
						self.SendPollResponse();
						break;
					case 'settext':
						self.SetText(objJson.Button, objJson.Text);
						break;
					case 'setblue':
						self.SetBlue(objJson.Button, objJson.Value);
						self.checkFeedbacks();
						break;
					case 'setred':
						self.SetRed(objJson.Button, objJson.Value);
						self.checkFeedbacks();
						break;
					default:
						//unknown command
						break;
				}

				console.log(objJson);
			}
		
	},

	SendPollResponse: function() {
		let self = this;
	
		if (self.POLL_TIMER !== null) {
			clearInterval(self.POLL_TIMER);
			self.POLL_TIMER = null;
		}
	
		self.updateStatus(InstanceStatus.Ok);
	
		self.POLL_TIMER = setTimeout(self.RegisterDisconnect.bind(self), 10000);
	
		let responseObj = {
			'Type': 'Poll',
			'Name': 'Companion Module',
			'Rows': 4,
			'Columns': 8,
			'Update': 0,
			'ProductID': 9002,
			'Version': VERSION
		};
	
		if (self.udp) {
			if ((self.config.host) && (self.config.remoteport)) {
				self.udp.send(JSON.stringify(responseObj), self.config.remoteport, self.config.host);
			}
		}
	},
	
	RegisterDisconnect: function () {
		let self = this;
	
		self.updateStatus(InstanceStatus.Error);
		self.log('error','Client has stopped responding.');

		if (self.POLL_TIMER !== null) {
			clearInterval(self.POLL_TIMER);
			self.POLL_TIMER = null;
		}
	},
	
	SetText: function(buttonNumber, text) {
		let self = this;
	
		for (let i = 0; i < self.keyStates.length; i++) {
			if (self.keyStates[i].buttonNumber === buttonNumber) {
				self.keyStates[i].text = text;
				break;
			}
		}
	
		let variableObj = {}
		variableObj['button_' + (buttonNumber+1) + '_text'] = text;
	
		self.setVariableValues(variableObj);
	},

	SetBlue: function(buttonNumber, value) {
		let self = this;
	
		for (let i = 0; i < self.keyStates.length; i++) {
			if (self.keyStates[i].buttonNumber === buttonNumber) {
				self.keyStates[i].blue = value;
				break;
			}
		}
	},
	
	SetRed: function(buttonNumber, value) {
		let self = this;
	
		for (let i = 0; i < self.keyStates.length; i++) {
			if (self.keyStates[i].buttonNumber === buttonNumber) {
				self.keyStates[i].red = value;
				break;
			}
		}
	}
}