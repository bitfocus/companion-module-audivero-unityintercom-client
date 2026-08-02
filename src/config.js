const { Regex } = require('@companion-module/base')

const { CHOICES_SURFACE_MODELS, DEFAULT_SURFACE_MODEL } = require('./models')

module.exports = {
	getConfigFields() {
		let self = this

		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module will connect to a Unity Intercom Client on Mac or Windows.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'IP Address',
				width: 6,
				default: '127.0.0.1',
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Port',
				width: 6,
				default: 20119,
				regex: Regex.PORT,
			},
			{
				type: 'static-text',
				id: 'info3',
				label: 'Surface Model',
				width: 12,
				value: `The Unity client lays out its panel configuration from the model we report, and calculates button numbers from that model's grid. Pick the model whose layout you want; choose a Stream Deck + or Plus XL if you need the dial actions.`,
			},
			{
				type: 'dropdown',
				id: 'surfaceModel',
				label: 'Surface Model',
				default: DEFAULT_SURFACE_MODEL,
				choices: CHOICES_SURFACE_MODELS,
				width: 6,
			},
			{
				type: 'number',
				id: 'buttonCount',
				label: 'Number of Available Unity Buttons',
				tooltip:
					'How many buttons to offer in the action and feedback dropdowns. The Unity client can address more buttons than one page of the surface holds, so this can exceed the model grid size.',
				default: 80,
				min: 1,
				max: 300,
				width: 6,
			},
			{
				type: 'number',
				id: 'pressDelay',
				label: 'Press Hold Time (ms)',
				tooltip:
					'How long to wait between a keydown/dialdown and the matching keyup/dialup. Increase this if the Unity client is slow to register short presses.',
				default: 50,
				min: 10,
				max: 1000,
				width: 6,
			},
			{
				type: 'static-text',
				id: 'info2',
				label: 'Verbose Logging',
				width: 12,
				value: `Enabling this option will put more detail in the log, which can be useful for troubleshooting purposes.`,
			},
			{
				type: 'checkbox',
				id: 'verbose',
				label: 'Enable Verbose Logging',
				default: false,
				width: 12,
			},
		]
	},
}
