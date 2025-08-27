module.exports = {
	initActions: function () {
		let self = this
		let actions = {}

		actions.button_press = {
			name: 'Press Button',
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS,
				},
			],
			callback: async function (action) {
				let cmdObj = {}
				cmdObj.DeviceID = self.DEVICEID
				cmdObj.Type = 'Keydown'
				cmdObj.Button = parseInt(action.options.button)
				self.sendCommand(cmdObj)
			},
		}

		actions.button_release = {
			name: 'Release Button',
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS,
				},
			],
			callback: async function (action) {
				let cmdObj = {}
				cmdObj.DeviceID = self.DEVICEID
				cmdObj.Type = 'Keyup'
				cmdObj.Button = parseInt(action.options.button)
				self.sendCommand(cmdObj)
			},
		}

		actions.rotate = {
			name: 'Rotate Button',
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS,
				},
				{
					type: 'dropdown',
					label: 'Direction',
					id: 'direction',
					default: 'right',
					choices: [
						{ id: 'right', label: 'Right' },
						{ id: 'left', label: 'Left' },
					],
				},
				{
					type: 'number',
					label: 'Steps',
					id: 'steps',
					default: 1,
					min: 1,
					max: 10,
					required: true,
					range: false,
				},
			],
			callback: async function (action) {
				let cmdObj = {}
				cmdObj.DeviceID = self.DEVICEID
				cmdObj.Type = 'Rotate'
				cmdObj.Button = parseInt(action.options.button)
				cmdObj.Ticks = parseInt(action.options.steps)
				if (action.options.direction == 'left') {
					cmdObj.Ticks = cmdObj.Ticks * -1
				}
				self.sendCommand(cmdObj)
			},
		}

		actions.dialDown = {
			name: 'Send Dial Down',
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS,
				},
			],
			callback: async function (action) {
				let cmdObj = {}
				cmdObj.DeviceID = self.DEVICEID
				cmdObj.Type = 'Dialdown'
				cmdObj.Button = parseInt(action.options.button)
				self.sendCommand(cmdObj)
			},
		}

		actions.dialUp = {
			name: 'Send Dial Up',
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS,
				},
			],
			callback: async function (action) {
				let cmdObj = {}
				cmdObj.DeviceID = self.DEVICEID
				cmdObj.Type = 'Dialup'
				cmdObj.Button = parseInt(action.options.button)
				self.sendCommand(cmdObj)
			},
		}

		actions.channelListenVolume = {
			name: 'Set Channel Listen Volume',
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS,
				},
				{
					type: 'dropdown',
					label: 'Direction',
					id: 'direction',
					default: 'right',
					choices: [
						{ id: 'right', label: 'Right' },
						{ id: 'left', label: 'Left' },
					],
				},
				{
					type: 'number',
					label: 'Steps',
					id: 'steps',
					default: 1,
					min: 1,
					max: 10,
					required: true,
					range: false,
				},
			],
			callback: async function (action) {
				const button = parseInt(action.options.button)
				const ticks = parseInt(action.options.steps) * (action.options.direction === 'left' ? -1 : 1)

				// Generate a unique session ID for this run
				const sessionToken = Date.now() + '-' + Math.random().toString(36).substring(2)
				self.keySessionToken = sessionToken

				// Release any other key if needed
				if (self.heldKey !== null && self.heldKey !== button) {
					console.log('sending keyup')
					self.sendCommand({
						DeviceID: self.DEVICEID,
						Type: 'Keyup',
						Button: self.heldKey,
					})
					self.heldKey = null

					if (self.keyHoldTimer) {
						clearTimeout(self.keyHoldTimer)
						self.keyHoldTimer = null
					}
				}

				let isNewKeydown = false

				// Send keydown if not already held
				if (self.heldKey !== button) {
					console.log('sending keydown')
					self.sendCommand({
						DeviceID: self.DEVICEID,
						Type: 'Keydown',
						Button: button,
					})
					isNewKeydown = true

					self.heldKey = button
				}

				// Verify session still valid before sending rotate
				if (self.keySessionToken === sessionToken) {
					console.log('sending rotate')
					self.sendCommand({
						DeviceID: self.DEVICEID,
						Type: 'Rotate',
						Button: button,
						Ticks: ticks,
					})
				} else {
					console.log('skipping rotate, session token changed')
					return
				}

				// Reset debounced keyup
				if (self.keyHoldTimer) {
					clearTimeout(self.keyHoldTimer)
				}

				self.keyHoldTimer = setTimeout(() => {
					if (self.keySessionToken === sessionToken && self.heldKey === button) {
						console.log('sending keyup from timer')
						self.udpQueue = []
						self.sendCommand({
							DeviceID: self.DEVICEID,
							Type: 'Keyup',
							Button: button,
						})
						self.heldKey = null
						self.keyHoldTimer = null
						self.keySessionToken = null
					} else {
						console.log('key release skipped — session no longer active')
					}
				}, 800)
			},
		}

		actions.setProgramVolume = {
			name: 'Set Program Volume',
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS,
				},
				{
					type: 'dropdown',
					label: 'Direction',
					id: 'direction',
					default: 'right',
					choices: [
						{ id: 'right', label: 'Right' },
						{ id: 'left', label: 'Left' },
					],
				},
				{
					type: 'number',
					label: 'Steps',
					id: 'steps',
					default: 1,
					min: 1,
					max: 10,
					required: true,
					range: false,
				},
			],
			callback: async function (action) {
				const button = parseInt(action.options.button)
				const ticks = parseInt(action.options.steps) * (action.options.direction === 'left' ? -1 : 1)

				// Generate a unique session ID for this run
				const sessionToken = Date.now() + '-' + Math.random().toString(36).substring(2)
				self.keySessionToken = sessionToken

				// Release any other key if needed
				if (self.heldKey !== null && self.heldKey !== button) {
					console.log('sending dialup')
					self.sendCommand({
						DeviceID: self.DEVICEID,
						Type: 'Dialup',
						Button: self.heldKey,
					})
					self.heldKey = null

					if (self.keyHoldTimer) {
						clearTimeout(self.keyHoldTimer)
						self.keyHoldTimer = null
					}
				}

				let isNewDialdown = false

				// Send dialdown if not already held
				if (self.heldKey !== button) {
					console.log('sending dialdown')
					self.sendCommand({
						DeviceID: self.DEVICEID,
						Type: 'Dialdown',
						Button: button,
					})
					isNewDialdown = true
					self.heldKey = button
				}

				// Verify session still valid before sending rotate
				if (self.keySessionToken === sessionToken) {
					console.log('sending rotate')
					self.sendCommand({
						DeviceID: self.DEVICEID,
						Type: 'Rotate',
						Button: button,
						Ticks: ticks,
					})
				} else {
					console.log('skipping rotate, session token changed')
					return
				}

				// Reset debounced dialup
				if (self.keyHoldTimer) {
					clearTimeout(self.keyHoldTimer)
				}

				self.keyHoldTimer = setTimeout(() => {
					if (self.keySessionToken === sessionToken && self.heldKey === button) {
						console.log('sending dialup from timer')
						self.udpQueue = []
						self.sendCommand({
							DeviceID: self.DEVICEID,
							Type: 'Dialup',
							Button: button,
						})
						self.heldKey = null
						self.keyHoldTimer = null
						self.keySessionToken = null
					} else {
						console.log('dial release skipped — session no longer active')
					}
				}, 800)
			},
		}

		self.setActionDefinitions(actions)
	},
}
