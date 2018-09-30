var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;
	self.init_tcp();
};

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.status(1,'Connecting'); // status ok!

	self.init_tcp();
};

instance.prototype.init_tcp = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	if (self.config.host) {
		self.socket = new tcp(self.config.host, self.config.port);

		self.socket.on('status_change', function (status, message) {
			self.status(status, message);
		});

		self.socket.on('error', function (err) {
			debug("Network error", err);
			self.status(self.STATE_ERROR, err);
			self.log('error',"Network error: " + err.message);
		});

		self.socket.on('connect', function () {
			self.status(self.STATE_OK);
			debug("Connected");
		})

		self.socket.on('data', function (data) {});
	}
};


// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module is for the Octopus App from <a href="http://noismada.com" target="_new">noismada.com</a>. Warning  Octopus renumbers the preset list if you delete a preset.'
		},
		{
			type:  'textinput',
			id:    'host',
			label: 'Target IP',
			width:  6,
			regex:  self.REGEX_IP
		},
		{
			type:   'textinput',
			id:     'port',
			label:  'Target Port',
			width:   6,
			default: '9090',
			regex: self.REGEX_PORT
		}

	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}

	debug("destroy", self.id);;
};


instance.prototype.actions = function(system) {
	var self = this;

	self.system.emit('instance_actions', self.id, {
		'rpreset':     {
			label: 'Recall Preset (Number)',
			options: [
				{
					type: 'textinput',
					label: 'Preset Number',
					id: 'preset',
					default: '1',
					regex: self.REGEX_NUMBER
				}
			]
		},
		'edevice':     {
			label: 'Enable / Disable Device',
			options: [
				{
					type: 'textinput',
					label: 'Device Number',
					id: 'device',
					default: '1',
					regex: self.REGEX_NUMBER
				},
				{
					type: 'dropdown',
					label: 'Enable / Disable',
					id: 'enDis',
					choices:  [
						{ id: 'EDevice', label: 'Enable' },
						{ id: 'DDevice', label: 'Disable' }
					]
				}
			]
		},


	});
};

instance.prototype.action = function(action) {
	var self = this;
	var cmd
	var opt = action.options

	switch (action.action){

		case 'rpreset':
			cmd = 'Oct,RPreset,' + opt.preset;
			break;

		case 'edevice':
			cmd = 'Oct,' + opt.enDis + ',' + opt.device;
			break;

	};




	if (cmd !== undefined) {

		debug('sending ',cmd,"to",self.config.host);

		if (self.socket !== undefined && self.socket.connected) {
			self.socket.send(cmd + "\r");
		} else {
			debug('Socket not connected :(');
		}

	}

	// debug('action():', action);

};

instance_skel.extendedBy(instance);
exports = module.exports = instance;
