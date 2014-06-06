'use strict';

var createDatgui = require('dat-gui');

module.exports = function(game, opts) {
  return new CameraDebug(game, opts);
};
module.exports.pluginInfo = {
  loadAfter: ['voxel-plugins-ui', 'voxel-shader', 'game-shell-fps-camera']
};

function CameraDebug(game, opts) {
  this.game = game;
  this.gui = opts.gui || (game.plugins && game.plugins.get('voxel-plugins-ui') ? game.plugins.get('voxel-plugins-ui').gui : new createDatgui.GUI());

  this.shader = game.plugins.get('voxel-shader');
  if (!this.shader) throw new Error('camera-debug requires voxel-shader');

  this.enable();
}

CameraDebug.prototype.enable = function() {
  this.folder = this.gui.addFolder('camera');

  var updateProjectionMatrix = this.shader.updateProjectionMatrix.bind(this.shader);

  this.folder.add(this.shader, 'cameraFOV', 45, 110).onChange(updateProjectionMatrix);
  this.folder.add(this.shader, 'cameraNear', 0.1, 10, 0.1).onChange(updateProjectionMatrix);
  this.folder.add(this.shader, 'cameraFar', 10, 1000).onChange(updateProjectionMatrix);

  this.updateables = [];
  this.addVectorFolder('position', game.controls.target().avatar, 'position');
  this.addVectorFolder('rotation', game.controls.target().avatar, 'rotation');
  this.addVectorFolder('game.cameraPosition()', game, 'cameraPosition');
  this.addVectorFolder('game.cameraVector()', game, 'cameraVector');

  var restingFolder = this.folder.addFolder('resting');
  restingFolder.add(this.game.controls.target().resting, 'x');
  restingFolder.add(this.game.controls.target().resting, 'y');
  restingFolder.add(this.game.controls.target().resting, 'z');

  this.game.on('tick', this.onTick = this.tick.bind(this));
};

CameraDebug.prototype.disable = function() {
  // TODO: remove folder. but, https://code.google.com/p/dat-gui/issues/detail?id=21

  this.game.removeListener('tick', this.onTick);
};

var VectorProxy = function(obj, prop, gui) {
  this.obj = obj;
  this.prop = prop;
  this.gui = gui;

  this.x = this.y = this.z = 0.01
};

VectorProxy.prototype.update = function() {
  var value = this.obj[this.prop];
  if (typeof value === 'function') {
    // function returning vec3 array
    var vector = value.call(value);
    this.x = vector[0];
    this.y = vector[1];
    this.z = vector[2];
  } else {
    // property with .x .y .z
    this.x = value.x;
    this.y = value.y;
    this.z = value.z;
  }

  // http://workshop.chromeexperiments.com/examples/gui/#10--Updating-the-Display-Manually
  for (var i in this.gui.__controllers) {
    this.gui.__controllers[i].updateDisplay();
  }
};

CameraDebug.prototype.addVectorFolder = function(name, obj, prop) {
  var folder = this.folder.addFolder(name);
  var proxy = new VectorProxy(obj, prop, folder);
  folder.add(proxy, 'x');
  folder.add(proxy, 'y');
  folder.add(proxy, 'z');
  this.updateables.push(proxy);
};

CameraDebug.prototype.tick = function() {
  for (var i = 0; i < this.updateables.length; i += 1) {
    // update method pattern, http://gameprogrammingpatterns.com/update-method.html
    this.updateables[i].update();
  }
};

