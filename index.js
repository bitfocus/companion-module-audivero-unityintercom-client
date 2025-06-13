// Audivero Unity Intercom Client

const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base')
const UpgradeScripts = require('./src/upgrades')

const config = require('./src/config')
const actions = require('./src/actions')
const feedbacks = require('./src/feedbacks')
const variables = require('./src/variables')
const presets = require('./src/presets')

const api = require('./src/api')

class unityintercomInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...api,
		})

		this.udp = null //used for UDP communication

		this.API_BUTTONS = 80

		this.keyStates = []
		this.CHOICES_BUTTONS = []

		this.POLL_TIMER = null
	}

	async destroy() {
		let self = this

		if (self.POLL_TIMER !== null) {
			clearInterval(self.POLL_TIMER)
			self.POLL_TIMER = null
		}

		if (self.udp !== undefined) {
			try {
				self.udp.close()
			} catch (error) {
				debug('Error closing UDP port')
			} finally {
				self.udp = null
			}
		}
	}

	async init(config) {
		this.configUpdated(config)
	}

	async configUpdated(config) {
		this.config = config

		if (this.config.verbose) {
			this.log('info', 'Verbose mode enabled. Log entries will contain detailed information.')
		}

		this.updateStatus(InstanceStatus.Connecting)

		this.init_keystates()

		this.init_udp()

		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.initPresets()

		this.checkFeedbacks()
		this.checkVariables()
	}
}

runEntrypoint(unityintercomInstance, UpgradeScripts)
