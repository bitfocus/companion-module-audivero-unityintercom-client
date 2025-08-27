const { combineRgb } = require('@companion-module/base')

module.exports = {
	initPresets: function () {
		let self = this

		let presets = []

		const foregroundColor = combineRgb(255, 255, 255) // White
		const foregroundColorBlack = combineRgb(0, 0, 0) // Black
		const backgroundColorRed = combineRgb(255, 0, 0) // Red
		const backgroundColorBlue = combineRgb(0, 0, 255) // Blue
		const backgroundColorGreen = combineRgb(0, 255, 0) // Red

		for (let i = 0; i < self.API_BUTTONS; i++) {
			presets.push({
				type: 'button',
				category: 'Buttons',
				name: 'Button ' + (i + 1),
				style: {
					text: `$(unityintercom-client:button_${i + 1}_text)`,
					size: '14',
					color: '16777215',
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'button_press',
								options: {
									button: i,
								},
							},
						],
						up: [
							{
								actionId: 'button_release',
								options: {
									button: i,
								},
							},
						],
					},
				],
				feedbacks: [
					{
						feedbackId: 'color',
						options: {
							button: i,
							color: 'red',
						},
						style: {
							color: foregroundColor,
							bgcolor: backgroundColorRed,
						},
					},
					{
						feedbackId: 'color',
						options: {
							button: i,
							color: 'blue',
						},
						style: {
							color: foregroundColor,
							bgcolor: backgroundColorBlue,
						},
					},
					{
						feedbackId: 'color',
						options: {
							button: i,
							color: 'green',
						},
						style: {
							color: foregroundColor,
							bgcolor: backgroundColorGreen,
						},
					},
					{
						feedbackId: 'color',
						options: {
							button: i,
							color: 'purple',
						},
						style: {
							color: foregroundColor,
							bgcolor: combineRgb(128, 0, 128), // Purple
						},
					},
					{
						feedbackId: 'color',
						options: {
							button: i,
							color: 'pink',
						},
						style: {
							color: foregroundColor,
							bgcolor: combineRgb(255, 192, 203), // Pink
						},
					},
					{
						feedbackId: 'color',
						options: {
							button: i,
							color: 'brown',
						},
						style: {
							color: foregroundColor,
							bgcolor: combineRgb(165, 42, 42), // Brown
						},
					},
				],
			})
		}

		//presets for set channel volume, buttons 1-6
		for (let i = 0; i < 6; i++) {
			presets.push({
				type: 'button',
				category: 'Channel Volume',
				name: `Set Volume - Button ${i + 1}`,
				style: {
					text: `Ch Vol ${(i + 1).toString()}`,
					size: '18',
					color: foregroundColorBlack,
					bgcolor: backgroundColorGreen,
					show_topbar: false,
				},
				options: {
					rotaryActions: true,
				},
				steps: [
					{
						down: [],
						up: [],
						rotate_left: [
							{
								actionId: 'channelListenVolume',
								options: {
									button: i,
									direction: 'left',
									steps: 1,
								},
							},
						],
						rotate_right: [
							{
								actionId: 'channelListenVolume',
								options: {
									button: i,
									direction: 'right',
									steps: 1,
								},
							},
						],
					},
				],
			})
		}

		//preset for system volume and program volume
		presets.push({
			type: 'button',
			category: 'Volume',
			name: 'Set System Volume',
			style: {
				text: 'Sys Vol',
				size: '18',
				color: foregroundColorBlack,
				bgcolor: backgroundColorGreen,
				show_topbar: false,
			},
			options: {
				rotaryActions: true,
			},
			steps: [
				{
					down: [],
					up: [],
					rotate_left: [
						{
							actionId: 'rotate',
							options: {
								button: 0,
								direction: 'left',
								steps: 1,
							},
						},
					],
					rotate_right: [
						{
							actionId: 'rotate',
							options: {
								button: 0,
								direction: 'right',
								steps: 1,
							},
						},
					],
				},
			],
		})

		presets.push({
			type: 'button',
			category: 'Volume',
			name: 'Set Program Volume',
			style: {
				text: 'Pgm Vol',
				size: '18',
				color: foregroundColorBlack,
				bgcolor: backgroundColorGreen,
				show_topbar: false,
			},
			options: {
				rotaryActions: true,
			},
			steps: [
				{
					down: [],
					up: [],
					rotate_left: [
						{
							actionId: 'setProgramVolume',
							options: {
								button: 0,
								direction: 'left',
								steps: 1,
							},
						},
					],
					rotate_right: [
						{
							actionId: 'setProgramVolume',
							options: {
								button: 0,
								direction: 'right',
								steps: 1,
							},
						},
					],
				},
			],
		})

		self.setPresetDefinitions(presets)
	},
}
