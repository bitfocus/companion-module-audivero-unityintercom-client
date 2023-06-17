const { combineRgb } = require('@companion-module/base');

module.exports = {
	initPresets: function () {
		let self = this;

		let presets = [];

		const foregroundColor = combineRgb(255, 255, 255) // White
		const foregroundColorBlack = combineRgb(0, 0, 0) // Black
		const backgroundColorRed = combineRgb(255, 0, 0) // Red
		const backgroundColorBlue = combineRgb(0, 0, 255) // Blue
		const backgroundColorGreen = combineRgb(0, 255, 0) // Red

		for (let i = 0; i < self.API_BUTTONS; i++) {
			presets.push({
				type: 'button',
				category: 'Buttons',
				name: 'Button ' + (i+1),
				style: {
					text: `$(unityintercom-client:button_${(i+1)}_text)`,
					size: '14',
					color: '16777215',
					bgcolor: combineRgb(0, 0, 0)
				},
				steps: [
					{
						down: [
							{
								actionId: 'button_press',
								options: {
									button: i
								}
							}
						],
						up: [
							{
								actionId: 'button_release',
								options: {
									button: i
								}
							}
						]
					}
				],
				feedbacks: [
					{
						feedbackId: 'blue',
						options: {
							button: i,
						},
						style: {
							color: foregroundColor,
							bgcolor: backgroundColorBlue
						}
					}
				]
			});
		}
		
		self.setPresetDefinitions(presets);
	}
}