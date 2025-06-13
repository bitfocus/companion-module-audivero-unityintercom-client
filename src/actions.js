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
				let cmd
				cmdObj.Type = 'Keydown'
				cmdObj.Button = parseInt(action.options.button)
				cmd = JSON.stringify(cmdObj)
				self.sendCommand(cmd)
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
				let cmd
				cmdObj.Type = 'Keyup'
				cmdObj.Button = parseInt(action.options.button)
				cmd = JSON.stringify(cmdObj)
				self.sendCommand(cmd)
			},
		}

		self.setActionDefinitions(actions)
	},
}
