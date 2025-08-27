module.exports = {
	initVariables: function () {
		let self = this

		let variables = []

		for (let i = 0; i < self.API_BUTTONS; i++) {
			let variableObj = {}
			variableObj.variableId = 'button_' + (i + 1) + '_text'
			variableObj.name = 'Button ' + (i + 1) + ' Text'
			variables.push(variableObj)
		}

		for (let i = 0; i < self.VARIABLES.length; i++) {
			variables.push({
				variableId: self.VARIABLES[i].variableId,
				name: self.VARIABLES[i].name,
			})
		}

		self.setVariableDefinitions(variables)

		let variableObj = {}
		for (let i = 0; i < self.API_BUTTONS; i++) {
			variableObj['button_' + (i + 1) + '_text'] = 'Button ' + (i + 1)
		}
		self.setVariableValues(variableObj)
	},

	checkVariables: function () {
		let self = this

		try {
			//let variableObj = {};
			//self.setVariableValues(variableObj);
		} catch (error) {
			self.log('error', 'Error setting variables: ' + error)
		}
	},
}
