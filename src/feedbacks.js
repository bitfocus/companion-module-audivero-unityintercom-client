const { combineRgb } = require('@companion-module/base')

module.exports = {
	initFeedbacks: function () {
		let self = this
		let feedbacks = {}

		const foregroundColor = combineRgb(255, 255, 255) // White
		const backgroundColorRed = combineRgb(255, 0, 0) // Red

		feedbacks['blue'] = {
			type: 'boolean',
			name: 'Button is Blue State',
			description: 'If the button is set to Blue state, change colors of the bank',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(0, 0, 255),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS,
				},
			],
			callback: async function (feedback) {
				let buttonObj = self.keyStates.find((k) => k.buttonNumber == parseInt(feedback.options.button))
				if (buttonObj) {
					if (buttonObj.blue) {
						return true
					}
				}
				return false
			},
		}

		feedbacks['red'] = {
			type: 'boolean',
			name: 'Button is Red State',
			description: 'If the button is set to Red state, change colors of the bank',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(255, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS,
				},
			],
			callback: async function (feedback) {
				let buttonObj = self.keyStates.find((k) => k.buttonNumber == parseInt(feedback.options.button))
				if (buttonObj) {
					if (buttonObj.red) {
						return true
					}
				}
				return false
			},
		}

		feedbacks['blue-red'] = {
			type: 'boolean',
			name: 'Button is Both Blue and Red State',
			description: 'If the button is set to Blue and Red state, change colors of the bank',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(255, 255, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '1',
					choices: self.CHOICES_BUTTONS,
				},
			],
			callback: async function (feedback) {
				let buttonObj = self.keyStates.find((k) => k.buttonNumber === feedback.options.button)
				if (buttonObj) {
					if (buttonObj.blue && buttonObj.red) {
						return true
					}
				}
				return false
			},
		}

		self.setFeedbackDefinitions(feedbacks)
	},
}
