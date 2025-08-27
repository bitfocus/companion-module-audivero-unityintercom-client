const { combineRgb } = require('@companion-module/base')

module.exports = {
	initFeedbacks: function () {
		let self = this
		let feedbacks = {}

		const foregroundColor = combineRgb(255, 255, 255) // White
		const backgroundColorRed = combineRgb(255, 0, 0) // Red

		feedbacks.color = {
			type: 'boolean',
			name: 'Button Color State',
			description: 'If the button is set to a specific color, change colors of the bank',
			defaultStyle: {
				color: foregroundColor,
				bgcolor: backgroundColorRed,
			},
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
					label: 'Color',
					id: 'color',
					default: 'red',
					choices: [
						{ id: 'red', label: 'Red' },
						{ id: 'blue', label: 'Blue' },
						{ id: 'green', label: 'Green' },
						{ id: 'purple', label: 'Purple' },
						{ id: 'pink', label: 'Pink' },
						{ id: 'brown', label: 'Brown' },
					],
				},
			],
			callback: async function (feedback) {
				let buttonObj = self.keyStates.find((k) => k.buttonNumber == parseInt(feedback.options.button))
				if (buttonObj) {
					if (buttonObj[feedback.options.color] === true) {
						return true
					}
				}
				return false
			},
		}

		self.setFeedbackDefinitions(feedbacks)
	},
}
