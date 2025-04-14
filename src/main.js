const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config

		this.updateStatus(InstanceStatus.Ok)

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module will control an Aurawave Pbox.'
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 8,
				regex: Regex.IP,
				default: '192.168.66.1',
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				width: 4,
				regex: Regex.PORT,
				default: 80,
			},
			{
				type: 'textinput',
				id: 'username',
				label: 'Username',
				width: 8,
				regex: Regex.username,
				default: 'Admin',
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				width: 8,
				regex: Regex.password,
				default: 'Admin',
			},
			{
				type: 'static-text',
				id: 'dummy1',
				width: 12,
				label: ' ',
				value: ' ',
			},
			{
				type: 'static-text',
				id: 'info2',
				label: 'Polling',
				width: 12,
				value: `
					<div class="alert alert-warning">
						<strong>Please read:</strong>
						<br>
						Enabling polling unlocks these features:
						<br><br>
						<ul>
							<li>Changes made at the device outside of this module</li>
							<li>Currently selected channel, feedbacks, etc.</li>
						</ul>
						Enabling polling will send a request to the Device at a continuous interval.
						<br>
						<strong>This could have an undesired performance effect on your Device, depending on the polling rate.</strong>
						<br>
					</div>
				`
			},
			{
				type: 'checkbox',
				id: 'polling',
				label: 'Enable Polling (necessary for feedbacks and variables)',
				default: true,
				width: 3
			},
			{
				type: 'textinput',
				id: 'pollingrate',
				label: 'Polling Rate (in ms)',
				default: 1000,
				width: 3,
				isVisible: (configValues) => configValues.polling === true,
			},
			{
				type: 'checkbox',
				id: 'verbose',
				label: 'Enable Verbose Logging',
				default: false
			}
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
