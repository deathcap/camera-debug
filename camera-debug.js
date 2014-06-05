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
  this.addVectorFolder('game.cameraPosition()', game, 'cameraPosition');

  this.game.on('tick', this.onTick = this.tick.bind(this));
};

CameraDebug.prototype.disable = function() {
  // TODO: remove folder. but, https://code.google.com/p/dat-gui/issues/detail?id=21

  this.game.removeListener('tick', this.onTick);
};

var VectorProxy = function(obj, prop) {
  this.obj = obj;
  this.prop = prop;
  this.x = this.y = this.z = 0.0;
};

VectorProxy.prototype.update = function() {
  var xyz = this.obj[this.prop]();
  this.x = xyz[0];
  this.y = xyz[1];
  this.z = xyz[2];
  // TODO: direct update datgui?
};

CameraDebug.prototype.addVectorFolder = function(name, obj, prop) {
  var proxy = new VectorProxy(obj, prop);
  var folder = this.folder.addFolder(name);
  folder.add(proxy, 'x').listen();
  folder.add(proxy, 'y').listen();
  folder.add(proxy, 'z').listen();
  this.updateables.push(proxy);
};

CameraDebug.prototype.tick = function() {
  for (var i = 0; i < this.updateables.length; i += 1) {
    // update method pattern, http://gameprogrammingpatterns.com/update-method.html
    this.updateables[i].update();
  }
};

