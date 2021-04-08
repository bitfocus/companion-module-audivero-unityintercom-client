// Audivero Unity Intercom Client

var dgram = require('dgram');
var instance_skel = require('../../instance_skel');
const { version } = require('./package.json');

var debug;
var log;

function instance(system, id, config) {
	let self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

const API_BUTTONS = 80;

instance.prototype.keyStates = [];
instance.prototype.CHOICES_BUTTONS = [];

instance.prototype.POLL_TIMER = null;

instance.prototype.updateConfig = function(config) {
	let self = this;

	self.config = config;

	self.init_feedbacks();
	self.init_udp();
};

instance.prototype.init = function() {
	let self = this;

	debug = self.debug;
	log = self.log;

	self.init_keystates();
	self.init_feedbacks();
	self.init_presets();
	self.init_udp();
};

instance.prototype.init_keystates = function() {
	let self = this;

	self.keyStates = [];
	self.CHOICES_BUTTONS = [];
	self.VARIABLES = [];

	for (let i = 0; i < API_BUTTONS; i++) {
		let keyObj = {};
		keyObj.buttonNumber = i;
		keyObj.blue = false;
		keyObj.red = false;
		self.keyStates.push(keyObj);

		let labelObj = {};
		labelObj.id = '' + i;
		labelObj.label = 'Button ' + (i+1);
		self.CHOICES_BUTTONS.push(labelObj);

		let variableObj = {};
		variableObj.name = 'button_' + (i+1) + '_text';
		variableObj.label = 'Button ' + (i+1) + ' Text';
		self.VARIABLES.push(variableObj);
	}

	self.setVariableDefinitions(self.VARIABLES);

	for (let i = 0; i < API_BUTTONS; i++) {
		self.setVariable('button_' + (i+1) + '_text', 'Button ' + (i+1));
	}

	self.actions(); // export actions
}

instance.prototype.init_feedbacks = function() {
	var self = this;

	// feedbacks
	var feedbacks = {};

	feedbacks['blue'] = {
		label: 'Button is Blue State',
		description: 'If the button is set to Blue state, change colors of the bank',
		options: [
			{
				type: 'dropdown',
				label: 'Button',
				id: 'button',
				choices: self.CHOICES_BUTTONS
			},
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: self.rgb(255,255,255)
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: self.rgb(0,0,255)
			}
		]
	};

	feedbacks['red'] = {
		label: 'Button is Red State',
		description: 'If the button is set to Red state, change colors of the bank',
		options: [
			{
				type: 'dropdown',
				label: 'Button',
				id: 'button',
				choices: self.CHOICES_BUTTONS
			},
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: self.rgb(255,255,255)
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: self.rgb(255,0,0)
			}
		]
	};

	feedbacks['blue-red'] = {
		label: 'Button is Both Blue and Red State',
		description: 'If the button is set to Blue and Red state, change colors of the bank',
		options: [
			{
				type: 'dropdown',
				label: 'Button',
				id: 'button',
				choices: self.CHOICES_BUTTONS
			},
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: self.rgb(255,255,255)
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: self.rgb(0,255,0)
			}
		]
	};

	self.setFeedbackDefinitions(feedbacks);
};

instance.prototype.feedback = function(feedback, bank) {
	var self = this;

	feedback.options.button = parseInt(feedback.options.button);
	
	if (feedback.type == 'blue') {
		var buttonObj = self.keyStates.find(k => k.buttonNumber === feedback.options.button);
		if (buttonObj) {
			if (buttonObj.blue) {
				return { color: feedback.options.fg, bgcolor: feedback.options.bg };
			}
		}
	}

	if (feedback.type == 'red') {
		var buttonObj = self.keyStates.find(k => k.buttonNumber === feedback.options.button);
		if (buttonObj) {
			if (buttonObj.red) {
				return { color: feedback.options.fg, bgcolor: feedback.options.bg };
			}
		}
	}

	if (feedback.type == 'blue-red') {
		var buttonObj = self.keyStates.find(k => k.buttonNumber === feedback.options.button);
		if (buttonObj) {
			if ((buttonObj.blue) && (buttonObj.red)) {
				return { color: feedback.options.fg, bgcolor: feedback.options.bg };
			}
		}
	}

	return {};
};

instance.prototype.init_presets = function() {
	var self = this;
	var presets = [];

	for (let i = 0; i < API_BUTTONS; i++) {
		presets.push({
			category: 'Buttons',
			label: 'Button ' + (i+1),
			bank: {
				style: 'text',
				text: `$(unityintercom-client:button_${(i+1)}_text)`,
				size: '14',
				color: '16777215',
				bgcolor: self.rgb(0, 0, 0)
			},
			actions: [{
				action: 'button_press',
				options: {
					button: i
				}
			}],
			release_actions: [{
				action: 'button_release',
				options: {
					button: i
				}
			}],
			feedbacks: [
				{
					type: 'blue',
					options: {
						button: i,
						bg: self.rgb(0, 0, 255),
						fg: self.rgb(255, 255, 255)
					}
				},
				{
					type: 'red',
					options: {
						button: i,
						bg: self.rgb(255, 0, 0),
						fg: self.rgb(255, 255, 255)
					}
				},
				{
					type: 'blue-red',
					options: {
						button: i,
						bg: self.rgb(0, 255, 0),
						fg: self.rgb(0, 0, 0)
					}
				}
			]
		});
	}

	self.setPresetDefinitions(presets);
};

instance.prototype.init_udp = function() {
	let self = this;

	self.destroy();

	self.status(self.STATE_WARNING, 'Connecting');

	if (!self.config.port) {
		self.config.port = 20119;
	}

	if (self.config.host !== undefined) {
		try {
			self.udp = dgram.createSocket('udp4');
			self.udp.bind(self.config.port);
	
			self.udp.on('error', function (err) {
				debug('Network error', err);
				self.status(self.STATE_ERROR, err);
				self.log('error','Network error: ' + err.message);
			});
	
			self.udp.on('message', function (data, rinfo) {
				self.processFeedback(data.toString(), rinfo.address, rinfo.port);
			});
	
			self.udp.on('status_change', function (status, message) {
				self.status(status, message);
			});
		}
		catch (error) {
			self.log('error', 'Error binding UDP Port: ' + error);
		}
	}
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	let self = this;

	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module will connect to a Unity Intercom Client on Mac or Windows.'
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'IP Address',
			width: 6,
			default: '127.0.0.1',
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Port',
			width: 6,
			default: 20119,
			regex: self.REGEX_PORT
		},
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	let self = this;

	if (self.POLL_TIMER !== null) {
		clearInterval(self.POLL_TIMER);
		self.POLL_TIMER = null;
	}

	if (self.udp !== undefined) {
		try {
			self.udp.socket.removeAllListeners();
			self.udp.close();
		}
		catch (error) {
			debug('Error closing UDP port');
		}
		finally {
			self.udp = null;
		}
	}

	debug('destroy', self.id);
}

instance.prototype.actions = function() {
	let self = this;

	self.system.emit('instance_actions', self.id, {

		'button_press': {
			label: 'Press Button',
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS
				}
			]
		},
		'button_release': {
			label: 'Release Button',
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS
				}
			]
		}

	});
};

instance.prototype.action = function(action) {

	let self = this;
	let cmdObj = {};
	let cmd;
	let options = action.options;

	switch(action.action) {
		case 'button_press':
			cmdObj.Type = 'Keydown';
			cmdObj.Button = parseInt(options.button);
			cmd = JSON.stringify(cmdObj);
			break;
		case 'button_release':
			cmdObj.Type = 'Keyup';
			cmdObj.Button = parseInt(options.button);
			cmd = JSON.stringify(cmdObj);
			break;
		default:
			break;
	}

	if (cmd !== undefined) {
		if (self.udp !== undefined ) {
			if ((self.config.host) && (self.config.remoteport)) {
				self.udp.send(cmd, self.config.remoteport, self.config.host);
			}
		}
	}
};

instance.prototype.processFeedback = function(data, address, port) {
	let self = this;

	let objJson;

	if (address === self.config.host) { //if the remote address isn't our configured host, it's just some other Unity client
		self.config.remoteport = port;

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
					self.checkFeedbacks('blue');
					self.checkFeedbacks('blue-red');
					break;
				case 'setred':
					self.SetRed(objJson.Button, objJson.Value);
					self.checkFeedbacks('red');
					self.checkFeedbacks('blue-red');
					break;
				default:
					//unknown command
					break;
			}
		}
	}
	
};

instance.prototype.SendPollResponse = function() {
	let self = this;

	if (self.POLL_TIMER !== null) {
		clearInterval(self.POLL_TIMER);
		self.POLL_TIMER = null;
	}

	self.status(self.STATE_OK);

	self.POLL_TIMER = setTimeout(self.RegisterDisconnect.bind(self), 10000);

	let responseObj = {
		'Type': 'Poll',
		'Name': 'Bitfocus Companion',
		'Rows': 4,
		'Columns': 8,
		'Update': 0,
		'ProductID': 9002,
		'Version': version
	};

	if (self.udp) {
		if ((self.config.host) && (self.config.remoteport)) {
			self.udp.send(JSON.stringify(responseObj), self.config.remoteport, self.config.host);
		}
	}
};

instance.prototype.RegisterDisconnect = function () {
	let self = this;

	self.status(self.STATE_ERROR);
	self.log('error','Client has stopped responding.');
};

instance.prototype.SetText = function(buttonNumber, text) {
	let self = this;

	for (let i = 0; i < self.keyStates.length; i++) {
		if (self.keyStates[i].buttonNumber === buttonNumber) {
			self.keyStates[i].text = text;
			break;
		}
	}

	self.setVariable('button_' + (buttonNumber+1) + '_text', text);
};

instance.prototype.SetBlue = function(buttonNumber, value) {
	let self = this;

	for (let i = 0; i < self.keyStates.length; i++) {
		if (self.keyStates[i].buttonNumber === buttonNumber) {
			self.keyStates[i].blue = value;
			break;
		}
	}
};

instance.prototype.SetRed = function(buttonNumber, value) {
	let self = this;

	for (let i = 0; i < self.keyStates.length; i++) {
		if (self.keyStates[i].buttonNumber === buttonNumber) {
			self.keyStates[i].red = value;
			break;
		}
	}
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;