const { Regex } = require('@companion-module/base')

module.exports = {
	getConfigFields() {
		let self = this;

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
				regex: Regex.IP
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Port',
				width: 6,
				default: 20119,
				regex: Regex.PORT
			},
			{
				type: 'static-text',
				id: 'info2',
				label: 'Verbose Logging',
				width: 12,
				value: `Enabling this option will put more detail in the log, which can be useful for troubleshooting purposes.`
			},
			{
				type: 'checkbox',
				id: 'verbose',
				label: 'Enable Verbose Logging',
				default: false,
				width: 12
			},
		]
	}
}