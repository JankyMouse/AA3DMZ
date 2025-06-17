var Imported = Imported || {};
Imported.JM_AA3DMZ = true;

var JM = JM || {};
JM.AA3DMZ = JM.AA3DMZ || {};
JM.AA3DMZ.Version = 0.9;

/*:
*@plugindesc Compatibility and cross-feature adaptation patch for MZ3D V.9.2.7 (by Cutievirus), AlphaABSZ (by Kage Desu), and OmniMove (by Cutievirus).
*@author JankyMouse | Version: 0.9

*@param _skipTitle
*@text Skip Title?
*@parent options
*@desc Skip Title
*@type boolean
*@on Yes
*@off No
*@default true

*@param _useWalkRunSkill
*@text Use automatic 3D actions?
*@parent options
*@desc Play 3D character actions based on move-state and frame position when using a skill/weapon.
*@type boolean
*@on Yes
*@off No
*@default true

*@param _useMeshEquip
*@text Use Mesh Equip
*@parent options
*@desc Show/Hide player model meshes based on Weapon/Item equips. Model optimization must be set to none in mz3d.
*@type boolean
*@on true
*@off false
*@default false

*@param _projectileType
*@text Projectile Type
*@parent options
*@desc Use 3D Models, 3D animated sprites, or particles for projectiles based on the "img" notetags setting.
*@type select
*@option 3D Model
*@value 1
*@option 3D Sprite
*@value 2
*@option Particle System
*@value 3
*@default 3D Sprite

*@param _usePKDInventory
*@text Using PKD Inventory?
*@parent options
*@desc Using PKD Inventory plugin or built in inventory? Nessesary for mouse lock ignore.
*@type boolean
*@on PKD Inventory Plugin
*@off Built in Inventory
*@default true

*@help
*==[Documentation:]===========================================================
*AA3DMZ - TODO
*MV3D - https://cutievirus.com/docs/mz3d/#getting-started
*AlphaABSZ - https://github.com/KageDesu/Alpha-ABS-Z/wiki
*OmniMove - https://cutievirus.itch.io/omnimove
*
*==[CrossFeatures:]===========================================================
*Automatic 3D actions for ABS Skills and Items:-------------------------------
*Added handling for 3D model actions for all ABS Skills and Items. Game Player
* + Game AI (Use automatic 3D actions) With this enabled, all of your ABS
*skills/items will switch actions based on skills used and movestate
*(for smooth animations/remedies "iceskating" models when using actions while
*moving) Just add 3 actions (NLATracks/With matching frames of the actual skill  
*animation like swinging a sword) to your model per skill/item with the same
*name as your skill or weapon and append 2 of them with walk and run 
*respectively. i.e. Attack, Attackwalk, Attackrun
*
*Sprite Projectiles:----------------------------------------------------------
*For sprites, AA3DMZ will project a flat sprite into the 3D space and setup  
*is the same as it's originl behavior. Append "_frames" to the img name to
*define the ammount of animation frames. i.e. <img:Attack_3> where 3 means
*it has 3 frames of animation. The file for sprite mode still needs to go
*in "Pictures" folder.
*
*3D Model:--------------------------------------------------------------------
*For models, just plug the name of your projectile model (which goes in your
*"Models" folder) into <img:name> skill parameter in your skill/weapon
*notetags. AA3DMZ will use the first NLA track and loop it.
* 
*Particle Projectiles:--------------------------------------------------------
*For particles, you can use the particle editor here 
*https://playground.babylonjs.com/#M7MYT8#11 and then save the particle system 
*to a JSON file. Save it to a "particles" folder in the root directory of your 
*game (same place the mv3d folder is). Then, "edit" the associated textures for 
*the particle system so you can save them to the particles folder aswell. Make 
*sure the JSON file and texture has the same name. Finally, define which 
*weapons or skills you want to add the particle projectile with the  notetag 
*in the datebase. Once you get comfortable with the editor, you can open the 
*JSON file to study the formatting to make more advanced custom particle 
*systems.
*
*Projectile Definition:-------------------------------------------------------
*Define projectile type with the note tag in the weapons or skills database. 
*(i.e projectile:model, projectile:sprite, or projectile:particle) Weapons and
*skills will default to the value selected in plugin options if not defined 
*with a notetag.
*
*Weapon and Armor Equip Mesh Handling:----------------------------------------
*Adds easy dynamic mesh support for player character model based on
*Weapon and Armor equips (Hides/Shows meshes).
*1. Go into your Weapon or Armor database.
*2. Add any note to the Weapon or Armor you want to use a dynamic mesh with.
*3. Go into your model editor.
*4. Name the separate Weapon or Armor mesh the same name (in lowercase) as the
*one in your RMMV/Z database.
*"Model Optimization" must be off in MZ3D for this to function.
*
*==[Compatibility:]===========================================================
*Character Collision Fixes:
*Various collision fixes added for Game Player and Game AI Jumping, Impulse
*Actions (Knockbacks), and complex Impulse Actions (Knockbacks greater than 1).
*
*Projectile Collision Fixes:--------------------------------------------------
*Fixed a bug with projectiles (free-aim / direction 0) that were not
*colliding with characters midflight and only doing damage at the end of it's
*end-point / range.
*Added z height / tile layer calculations.
*
*Skill Fixes:-----------------------------------------------------------------
*Fixed skills with casting time. They now follow mouse-look
*when casting when pointerlock is engaged.
*Fixed skills with selectzone. They now release the pointerlock automatically
*and your character rotates while aiming with the pointer.
*
*Optional Electron Wrapper fixes:
*Added a few fixes for dev buttons (F5, F8, and CTRL)
*Added auto fullscreen and menu button relocation.
*/

//--------------------------------------------------------------------------------
// BABYLON.JS fixes / Depth Write Buffer and Manual Emit Count for GPU Particles

/** @internal */
BABYLON.GPUParticleSystem.prototype._update = function (emitterWM) {
  //console.log(this)
  if (!this.emitter) {
    return;
  }
  if (!this._recreateUpdateEffect()) {
    return;
  }
  if (this.emitter.position) {
    const emitterMesh = this.emitter;
    emitterWM = emitterMesh.getWorldMatrix();
  } else {
    const emitterPosition = this.emitter;
    emitterWM = math_vector/* TmpVectors.Matrix.0 */.jp.Matrix[0];
    math_vector/* Matrix.TranslationToRef */.y3.TranslationToRef(emitterPosition.x, emitterPosition.y, emitterPosition.z, emitterWM);
  }

  //Make DepthWrite false
  const engine = this._engine;
  const depthWriteState = engine.getDepthWrite();
  engine.setDepthWrite(false);

  this._platform.preUpdateParticleBuffer();
  this._updateBuffer.setFloat("currentCount", this._currentActiveCount);
  this._updateBuffer.setFloat("timeDelta", this._timeDelta);
  this._updateBuffer.setFloat("stopFactor", this._stopped ? 0 : 1);
  this._updateBuffer.setInt("randomTextureSize", this._randomTextureSize);
  this._updateBuffer.setFloat2("lifeTime", this.minLifeTime, this.maxLifeTime);
  this._updateBuffer.setFloat2("emitPower", this.minEmitPower, this.maxEmitPower);
  if (!this._colorGradientsTexture) {
    this._updateBuffer.setDirectColor4("color1", this.color1);
    this._updateBuffer.setDirectColor4("color2", this.color2);
  }
  this._updateBuffer.setFloat2("sizeRange", this.minSize, this.maxSize);
  this._updateBuffer.setFloat4("scaleRange", this.minScaleX, this.maxScaleX, this.minScaleY, this.maxScaleY);
  this._updateBuffer.setFloat4("angleRange", this.minAngularSpeed, this.maxAngularSpeed, this.minInitialRotation, this.maxInitialRotation);
  this._updateBuffer.setVector3("gravity", this.gravity);
  if (this._limitVelocityGradientsTexture) {
    this._updateBuffer.setFloat("limitVelocityDamping", this.limitVelocityDamping);
  }
  if (this.particleEmitterType) {
    this.particleEmitterType.applyToShader(this._updateBuffer);
  }
  if (this._isAnimationSheetEnabled) {
    this._updateBuffer.setFloat4("cellInfos", this.startSpriteCellID, this.endSpriteCellID, this.spriteCellChangeSpeed, this.spriteCellLoop ? 1 : 0);
  }
  if (this.noiseTexture) {
    this._updateBuffer.setVector3("noiseStrength", this.noiseStrength);
  }
  if (!this.isLocal) {
    this._updateBuffer.setMatrix("emitterWM", emitterWM);
  }
  this._platform.updateParticleBuffer(this._targetIndex, this._targetBuffer, this._currentActiveCount);
  // Switch VAOs
  this._targetIndex++;
  if (this._targetIndex === 2) {
    this._targetIndex = 0;
  }
  // Switch buffers
  const tmpBuffer = this._sourceBuffer;
  this._sourceBuffer = this._targetBuffer;
  this._targetBuffer = tmpBuffer;

  engine.setDepthWrite(depthWriteState); // UPDATED
}

/**
* Renders the particle system in its current state
* @param preWarm defines if the system should only update the particles but not render them
* @param forceUpdateOnly if true, force to only update the particles and never display them (meaning, even if preWarm=false, when forceUpdateOnly=true the particles won't be displayed)
* @returns the current number of particles
*/
BABYLON.GPUParticleSystem.prototype.render = function (preWarm = !1, forceUpdateOnly = !1) {
  if (!this._started) return 0;
  if (this._createColorGradientTexture(), this._createSizeGradientTexture(), this._createAngularSpeedGradientTexture(), this._createVelocityGradientTexture(), this._createLimitVelocityGradientTexture(), this._createDragGradientTexture(), !this.isReady()) 
    return 0;
  if (!preWarm && this._scene) {
    if (!this._preWarmDone && this.preWarmCycles) {
      for (let index = 0; index < this.preWarmCycles; index++) 
        this.animate(!0), this.render(!0, !0);
        this._preWarmDone = !0;
    }
    if (this._currentRenderId === this._scene.getFrameId() && (!this._scene.activeCamera || this._scene.activeCamera && this._currentRenderingCameraUniqueId === this._scene.activeCamera.uniqueId)) {
      return 0;
    }
    this._currentRenderId = this._scene.getFrameId(), this._scene.activeCamera && (this._currentRenderingCameraUniqueId = this._scene.activeCamera.uniqueId);
  }
  this._initialize();
  if (this.manualEmitCount > -1) {
    this._accumulatedCount += this.manualEmitCount;
    this.manualEmitCount = 0;
  } else {
    this._accumulatedCount += this.emitRate * this._timeDelta;
  }
  if (this._accumulatedCount >= 1) {
    const intPart = 0 | this._accumulatedCount;
    this._accumulatedCount -= intPart, 
    this._currentActiveCount = Math.min(this._activeCount, this._currentActiveCount + intPart);
  }
  if (!this._currentActiveCount) return 0;
  let emitterWM;
  if (this.emitter.position) {
    const emitterMesh = this.emitter;
    emitterWM = emitterMesh.getWorldMatrix();
  } else {
    const emitterPosition = this.emitter;
    emitterWM = math_vector/* TmpVectors.Matrix.0 */.jp.Matrix[0], math_vector/* Matrix.TranslationToRef */.y3.TranslationToRef(emitterPosition.x, emitterPosition.y, emitterPosition.z, emitterWM);
  }
  const engine = this._engine;
  this.updateInAnimate || this._update(emitterWM);
  let outparticles = 0;
  return preWarm || forceUpdateOnly || (engine.setState(!1), this.forceDepthWrite && engine.setDepthWrite(!0), outparticles = this.blendMode === BABYLON.ParticleSystem.BLENDMODE_MULTIPLYADD ? this._render(BABYLON.ParticleSystem.BLENDMODE_MULTIPLY, emitterWM) + this._render(ParticleSystem.BLENDMODE_ADD, emitterWM) : this._render(this.blendMode, emitterWM), this._engine.setAlphaMode(0)), outparticles;
};

//--------------------------------------------------------------------------------
// AA3DMZ Plugin Parameters

var JM_AA3DMZ = JM.AA3DMZ;
JM_AA3DMZ.params = PluginManager.parameters("AA3DMZ");

JM_AA3DMZ.params = {
  _skipTitle: JSON.parse(JM_AA3DMZ.params['_skipTitle']),
  _useWalkRunSkill: JSON.parse(JM_AA3DMZ.params['_useWalkRunSkill']),
  _useMeshEquip: JSON.parse(JM_AA3DMZ.params['_useMeshEquip']),
  _projectileType: JSON.parse(JM_AA3DMZ.params['_projectileType']),
  _usePKDInventory: JSON.parse(JM_AA3DMZ.params['_usePKDInventory'])
};


//mz3d.Character.prototype.getPlatform = function (x = this.char._realX, y = this.char._realY, opts = {}) {
 //   return mz3d.getPlatformForCharacter(this, x, y, opts);
//};

//--------------------------------------------------------------------------------
// Electron fixes

if (!Utils.isNwjs()) {

  SceneManager.onKeyDown = function(event) {
    if (!event.altKey && Graphics._app) {
      switch (event.keyCode) {
        case 116:   // F5
          location.reload();
          break;
        case 119:   // F8
          //if (Utils.isNwjs() && Utils.isOptionValid('test')) {
            //require('nw.gui').Window.get().showDevTools();
          //}
          break;    
        case 17:    // ctrl
          if ($gamePlayer._setThrough === false || $gamePlayer._setThrough === undefined){
          $gamePlayer.setThrough(true);
          $gamePlayer._setThrough = true;
          }else{
          $gamePlayer.setThrough(false);
          $gamePlayer._setThrough = false;
          }
        break; 
      }
    }
  };

  Graphics.startGameLoop = function() {
    if (this._app) {
      this._app.start();
      this._switchStretchMode();
      this._switchFullScreen();
    }
  };

  SceneManager.terminate = function() {
    window.close();
  };

}; // end electron fixes

//--------------------------------------------------------------------------------
// Menu Scene Size

/*
Scene_Boot.prototype.adjustBoxSize = function() {
    const uiAreaWidth = 2560;
    const uiAreaHeight = $dataSystem.advanced.uiAreaHeight;
    const boxMargin = 4;
    Graphics.boxWidth = uiAreaWidth - boxMargin * 2;
    Graphics.boxHeight = uiAreaHeight - boxMargin * 2;
};
*/

//--------------------------------------------------------------------------------
// Skip Title Screen - Test Mode

if (JM_AA3DMZ.params['_skipTitle']) {
  const Scene_Boot_start = Scene_Boot.prototype.start;
  Scene_Boot.prototype.start = function() {
    Scene_Boot_start.call(this);
    this.checkPlayerLocation();
    DataManager.setupNewGame();
    SceneManager.goto(Scene_Map);
  }
};

//--------------------------------------------------------------------------------
// GamePad Right Stick Fix TODO: Fix fav weapons circle and freedirection(original)

var _alias_Input__updateGamepadState = Input._updateGamepadState;
Input._updateGamepadState = function(gamepad) {
   _alias_Input__updateGamepadState.apply(this, arguments);
   input_mv3d = window.mv3d;
    const threshold = 0.1;
    const max = 1 - threshold;
    const axes = gamepad.axes;
    if (Math.abs(axes[0]) > threshold) {
      input_mv3d._gamepadStick.left.x += (axes[0] - Math.sign(axes[0]) * threshold) / max;
    }
    if (Math.abs(axes[1]) > threshold) {
      input_mv3d._gamepadStick.left.y -= (axes[1] - Math.sign(axes[1]) * threshold) / max;
    }
    if (Math.abs(axes[2]) > threshold) {
      input_mv3d._gamepadStick.right.x += (axes[2] - Math.sign(axes[2]) * threshold) / max;
    }
    if (Math.abs(axes[3]) > threshold) {
      input_mv3d._gamepadStick.right.y -= (axes[3] - Math.sign(axes[3]) * threshold) / max;
    }
};

//--------------------------------------------------------------------------------
// Cursor/PointerLock Fixes

mz3d.util.override(Scene_Map.prototype, 'processMapTouch', (o)=> function() {
  input_mz3d = window.mz3d;
  if (TouchInput.isTriggered() && $gamePlayer.aaState != "skill") {var _Graphics$_canvas$req, _Graphics$_canvas$req2;
  // requestPointerLock isn't returning a promise ????
     (_Graphics$_canvas$req = Graphics._canvas.requestPointerLock()) === null || _Graphics$_canvas$req === void 0 ? void 0 : (_Graphics$_canvas$req2 = _Graphics$_canvas$req.catch) === null || _Graphics$_canvas$req2 === void 0 ? void 0 : _Graphics$_canvas$req2.call(_Graphics$_canvas$req, console.error);
  } else if (TouchInput.isTriggered()) {
    mz3d.processMapTouch();
  }
}, () => !mz3d.isDisabled() && mz3d.inputCameraMouse && !mz3d._touchState.isTapped);

//--------------------------------------------------------------------------------
// PointerLock release on cancel without PKD_MapInventory

const _Scene_Map_update_ = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
  _Scene_Map_update_.call(this);
  if (Input.isCancel() && document.pointerLockElement) {
    document.exitPointerLock();
    input_mz3d._relockPointer = false;
  }
}

//--------------------------------------------------------------------------------
// Imported PKD_MapInventory

if (Imported.PKD_MapInventory) {
  Scene_Map.prototype.update = function() {
    _Scene_Map_update_.call(this);
    input_mz3d = window.mz3d;
    //this._myOpenInventory = false; 
    if (Input.isTriggered("myOpenInventory") && !this._myOpenInventory && !input_mz3d._touchState.isTapped) {
      PKD_MI.openInventory();
      document.exitPointerLock();
      this._myOpenInventory = true;
    } else if (Input.isTriggered("myOpenInventory") && this._myOpenInventory) {
      PKD_MI.closeInventory();
      Graphics._canvas.requestPointerLock();
      this._myOpenInventory = false;
    }
  };

  const _SceneManager_onSceneStart = SceneManager.onSceneStart;
  SceneManager.onSceneStart = function() {
    _SceneManager_onSceneStart.call(this);
    // Set Keybind "B"
    Input.keyMapper["66"] = "myOpenInventory";  // B
  };

  //--------------------------------------------------------------------------------
  // Inventory Cell Dragging Fix / No longer requires long press for dragging

  let timeoutId;

  document.addEventListener('mousemove', function() {
    clearTimeout(timeoutId);
    if (timeoutId = setTimeout(function() {
      //console.log('Mouse movement stopped'),
      JM.AA3DMZ.mouseMove = false;
    }, 70)){
      //console.log('Mouse movement started'),
      JM.AA3DMZ.mouseMove = true;
    };
  });

  PKD_MI.LIBS.Sprite_MapInvCell.prototype.update = function() {
    var ref;
    KDCore.Sprite.prototype.update.call(this);
    if ((ref = this._checkUsableThread) != null) {
      ref.update();
    }
    if ($gameTemp._pkdMICellMoving === true) {
      return;
    }
    if (TouchInput.isPressed() && this.isHovered()) {
      if (this.item == null) {
        return;
      }
      if (JM.AA3DMZ.mouseMove) {
        return this.startMovingCell();
      }
    } else {
      return;
    }
  }
}; //End Imported PKD_MapInventory

const Scene_Map_createMenuButton = Scene_Map.prototype.createMenuButton;
Scene_Map.prototype.createMenuButton = function() {
  Scene_Map_createMenuButton.apply(this, arguments);
  this._menuButton.x = Graphics.width - 400;
  this._menuButton.y = -150;
};

//--------------------------------------------------------------------------------
// changeEquip: Game_Player Equip Handling for meshes

if (JM_AA3DMZ.params['_useMeshEquip']) {
  JM.Equipmeshes = JM.Equipmeshes || {};

  const Scene_Load_executeLoad2 = Scene_Load.prototype.executeLoad;
  Scene_Load.prototype.executeLoad = function() {
    Scene_Load_executeLoad2.apply(this, arguments);
    delete mv3d._meshesCleared;
  };

  const Scene_Map_update2 = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function(){
    Scene_Map_update2.call(this);
    if (mv3d._meshesCleared === undefined && !mv3d.scene.isLoading) {
      JM.Equipmeshes.changeEquipMesh();
      mv3d._meshesCleared = true;
    }
  };

  const _fadeInForTransfer2_ = Scene_Map.prototype.fadeInForTransfer;
  Scene_Map.prototype.fadeInForTransfer = function () {
    _fadeInForTransfer2_.apply(this, arguments);
    delete mv3d._meshesCleared;
  }

  var _Game_Actor_changeEquip = Game_Actor.prototype.changeEquip;
  Game_Actor.prototype.changeEquip = function(slotId, item) {
    _Game_Actor_changeEquip.call(this, slotId, item);
    JM.Equipmeshes.changeEquipMesh();
  };

  // Optimized mesh visibility handling
  JM.Equipmeshes.changeEquipMesh = function() {
    // Hide all weapon meshes
    for (let i = 0; i < $dataWeapons.length; i++) {
      const weapon = $dataWeapons[i];
      if (weapon && weapon.name) {
        const meshId = weapon.name.toLowerCase().replace(/ /g, "");
        const mesh = mv3d.scene.getMeshByID(meshId);
        if (mesh) mesh.visibility = 0;
      }
    }
    // Hide all armor meshes
    for (let i = 0; i < $dataArmors.length; i++) {
      const armor = $dataArmors[i];
      if (armor && armor.name) {
        const meshId = armor.name.toLowerCase().replace(/ /g, "");
        const mesh = mv3d.scene.getMeshByID(meshId);
        if (mesh) mesh.visibility = 0;
      }
    }

    // Show equipped weapon mesh
    const actor = $gameParty.members()[0];
    if (actor && actor.equips()[0] && actor.equips()[0].id) {
      const weaponId = actor.equips()[0].id;
      const weapon = $dataWeapons[weaponId];
      if (weapon && weapon.name) {
        const meshId = weapon.name.toLowerCase().replace(/ /g, "");
        const mesh = mv3d.scene.getMeshByID(meshId);
        if (mesh) mesh.visibility = 1;
      }
    }

    // Show equipped armor meshes
    const equips = actor ? actor.equips() : [];
    for (let i = 1; i < equips.length; i++) {
      const equip = equips[i];
      if (equip && equip.id) {
        const armor = $dataArmors[equip.id];
        if (armor && armor.name) {
          const meshId = armor.name.toLowerCase().replace(/ /g, "");
          const mesh = mv3d.scene.getMeshByID(meshId);
          if (mesh) mesh.visibility = 1;
        }
      }
    }
  }; // End changeEquip: Game_Player Equip Handling for meshes
};

//--------------------------------------------------------------------------------
// MoveState / Model Action Logic

Game_Character.prototype.MoveStateActions = function(){
console.log($gamePlayer.mv3d_sprite.actions, "MoveStateActions started")
console.log(this);
  this._inActionStopped = false;
  this._inActionMoving = false;
  this._inActionRunning = false;
  let commandName;
  if (this instanceof Game_Player) {
    commandName = "@p action play"; 
  } else {
    commandName = "@" + [this._eventId] + " action play"; 
  }
  
  if(this._stopCount === 0 && this.isDashing()){
    mv3d.command(commandName,this.actionName + "Run"); //Run
    this._inActionRunning = true;
    console.log("Run");
    return;
  }
  if(this._stopCount === 0 && !this.isDashing()){
    mv3d.command(commandName,this.actionName + "Walk"); //Walk
    this._inActionMoving = true;
    console.log("Walk");
    return;
  }
  if(this._stopCount > 0){
    mv3d.command(commandName,this.actionName);
    this._inActionStopped = true;
    console.log("Stop");
    return;
  }
};

//--------------------------------------------------------------------------------
// Normalize yaw to 0-360 degrees

const Game_Character_prototype_getCardinalDirection = Game_Character.prototype.getCardinalDirection
Game_Character.prototype.getCardinalDirection = function () {
  const normalizedYaw = (this._mv3d_data.blenders.direction % 360 + 360) % 360;
  if (normalizedYaw >= 292.5 && normalizedYaw < 337.5) return 1; // Southwest
  if (normalizedYaw >= 337.5 || normalizedYaw < 22.5) return 2;  // South
  if (normalizedYaw >= 22.5 && normalizedYaw < 67.5) return 3; // Southeast
  if (normalizedYaw >= 247.5 && normalizedYaw < 292.5) return 4; // West
  if (normalizedYaw >= 67.5 && normalizedYaw < 112.5) return  6; // East
  if (normalizedYaw >= 202.5 && normalizedYaw < 247.5) return 7; // Northwest
  if (normalizedYaw >= 157.5 && normalizedYaw < 202.5) return 8; // North
  if (normalizedYaw >= 112.5 && normalizedYaw < 157.5) return 9; // Northeast
};

//--------------------------------------------------------------------------------
// Game_Player Casting Skill direction / follow mouselook when pointerlocked

Game_Player.prototype._aaUpdateCastingProcess = function() {
    var e;
    try {
      if (!this.aaInSkillCastingProcess()) {
        return;
      }
      if (this._aaCastingNowSkill.castingRotation > 0) {
        const angle = Math.PI * ((0.5 - mz3d.blendCameraYaw.currentValue() - 90) / 180);
        targetPoint = {
          x: ~~(this._x + this.activeAASkill().range * Math.cos(angle)),
          y: ~~(this._y + this.activeAASkill().range * Math.sin(angle))
        }
        this.turnTowardCharacter(targetPoint);
        //this.aaTurnTowardTouchInput();
      }
      this._aaCastingTimer += 1;
      if (this._aaCastingTimer >= this._aaCastingTimeMax) {
        return this.aaFinishSkillCastingProcess();
      } else {
        if (this.isMoving()) {
          return this.aaOnEventWhileCasting('move');
        }
      }
    } catch (error) {
      e = error;
      return KDCore.warning(e);
    }
  };

//--------------------------------------------------------------------------------
// Game_Player No Target Skill / Model Action

Game_Player.prototype.prepareAASkillToExecute = function(skill) {
    var e, point, targetPoint;
    console.log("Use skill " + skill.name);
    console.log(skill)
    //this._attackDir = this._mv3d_data.direction;
    //TODO: А если предмет???
    //TODO: Анимация навыка атаки
    this.onSkillTargetCancel();
    this.setActiveAASkill(skill.idA);
    skill = this.activeAASkill();
    // * Если навык работает по направлению точки (курсора)
    if (skill.isInPoint()) {
      // * Если надо выбирать зону, то выбор зоны
      if (skill.isNeedSelectZone()) { 
        document.exitPointerLock();
        input_mz3d._relockPointer = false;
        // * Сбор целей сразу в точке где сейчас курсор
        AATargetsManager.collectTargetsForPlayerSelector(this.activeAASkill());
        this._setAAStateToSelectSkillTarget();
      } else {
        point = TouchInput.toMapPoint();
        //console.log(point);
        if (skill.isInstant() || skill.isInCertainPoint()) {
          // * Надо проверить находится ли точка в Range навыка
          if (AATargetsManager.isInSkillRange(this, this._activeAASkillId, point)) {
            this.startPerformAASkill(point);
          } else {
            // * NOTHING
            //TODO: Показать область range применения (моргнуть)
            //TODO: Написать Notify (small range)
            AA.UI.skillPerformResult(this._activeAASkillId, 0);
            this.setActiveAASkill(null);
          }
        } else {
          // * Направление по точке
          point.touchXY = { //MAYBE??? Hyjack mouse point same as before?
            x: TouchInput.x,
            y: TouchInput.y
          };
          this.startPerformAASkill(point);
        }
      }
    } else {
      // * Передаём себя в качестве точки (direction == 0 - напрвление персонажа)
      targetPoint = this.toPoint();
      //console.log(targetPoint);
      try {
        // * Если homing projectile, пытаемся передать цель под курсором
        if (skill.isHomingProjectile() && ($gameTemp._aaEventUnderCursor != null)) {
          targetPoint = $gameTemp._aaEventUnderCursor;
        }
        this.startPerformAASkill(targetPoint);
      } catch (error) {
        e = error;
        KDCore.warning(e);
      }
    }
  };


// Prevent StopCount reset when turning in place / fix for select zone attack
Game_CharacterBase.prototype.setDirection = function(d) {
    if (!this.isDirectionFixed() && d) {
        this._direction = d;
    }
    //this.resetStopCount();
};

const Game_CharacterBase_prototype_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function() {
  Game_CharacterBase_prototype_initMembers.call(this);
  this.actionFrame = 0;
  this._inActionStopped = false;
  this._inActionMoving = false;
  this._inActionRunning = false;
  this._StartFrameCounter = false;
};

//--------------------------------------------------------------------------------
// Model Action Frame Logic

const Game_Character_prototype_update_ = Game_Character.prototype.update;
Game_Character.prototype.update = function(){
  Game_Character_prototype_update_.call(this);

  //console.log($gamePlayer._stopCount);
  const action = this.actionName, mv3dActions = this.mv3d_sprite.actions;
  if(this._StartFrameCounter === true){
    ++this.actionFrame;
    //(console.log(this.actionFrame, "frame started"))
    //console.log(this.frameMax)
    if(this.actionFrame > this.frameMax){
      this._inActionStopped = false;
      this._inActionMoving = false;
      this._inActionRunning = false;
      this._StartFrameCounter = false;
      this.actionFrame = 0;
      return;
      //console.log("flagging");
    }
    try{
      if(this._inActionStopped === true && mv3dActions[action].isPlaying === false){
        mv3dActions[action.concat("walk")][0]._from = this.actionFrame; //Last frame was
        mv3dActions[action.concat("run")][0]._from = this.actionFrame; //Last frame was
        mv3dActions[action][0]._from = this.actionFrame; //Last frame was
        //console.log("switchAnim1",this.actionFrame);
        this.MoveStateActions(); //Call 3D actions
        mv3dActions[action.concat("walk")][0]._from = 0; //Reset frame
        mv3dActions[action.concat("run")][0]._from = 0; //Reset frame
        mv3dActions[action][0]._from = 0 //Reset frame
        return;
      }
      if(this._inActionMoving === true && mv3dActions[action.concat("walk")].isPlaying === false){
        mv3dActions[action][0]._from = this.actionFrame;
        mv3dActions[action.concat("run")][0]._from = this.actionFrame;
        //console.log("Switch Anim2",this.actionFrame);
        this.MoveStateActions(); //Call 3D actions
        mv3dActions[action][0]._from = 0;
        mv3dActions[action.concat("run")][0]._from = 0;
        return;
      }
      if(this._inActionRunning === true && mv3dActions[action.concat("run")].isPlaying === false){
        mv3dActions[action][0]._from = this.actionFrame;
        mv3dActions[action.concat("walk")][0]._from = this.actionFrame;
        //console.log("switchAnim3",this.actionFrame);
        this.MoveStateActions(); //Call 3D actions
        mv3dActions[action][0]._from = 0;
        mv3dActions[action.concat("walk")][0]._from = 0;
        return;
      }
    }catch(error){
      console.warn("Action " + '"' + [action] + '"',
      "is missing", [action] + "walk and/or",
      [action] + "run counterpart.");
      return this._StartFrameCounter = false; //Bail switch anim
    }
  }  
};

//--------------------------------------------------------------------------------
// Game_Player Casting Skill / Model Action

const _Game_Character_aaStartSkillCastingProcess = Game_Character.prototype.aaStartSkillCastingProcess;
Game_Character.prototype.aaStartSkillCastingProcess = function(skill) {
  if (JM_AA3DMZ.params['_useWalkRunSkill'] === true) {
    //console.log(skill)
    this.castingName = skill.name();
    let commandName;
    if (this instanceof Game_Player) {
      commandName = "@p action play";
      mv3d.command(commandName, this.castingName);
    } else if (this instanceof Game_Event) {
      commandName = "@e" + this._eventId + " action play";
      mv3d.command(commandName, this.castingName);
    }

    _Game_Character_aaStartSkillCastingProcess.call(this, skill);
  } else {
    _Game_Character_aaStartSkillCastingProcess.call(this, skill);
  }
};

//--------------------------------------------------------------------------------
// Game_Player Cancel Casting Skill / Model Action

const _Game_Character__cancelCastMotion = Game_Character.prototype.aaAbortSkillCastingProcess;
Game_Character.prototype.aaAbortSkillCastingProcess = function() {
  if (JM_AA3DMZ.params['_useWalkRunSkill'] === true) {
    const name = this.castingName;
    let commandName;
    if (this instanceof Game_Player) {
      commandName = "@p action stop";
      mv3d.command(commandName, name);
      // console.log("PlayerActionStop");
    } else if (this instanceof Game_Event) {
      commandName = "@e" + this._eventId + " action stop";
      mv3d.command(commandName, name);
      // console.log("EnemyActionStop");
    }
    _Game_Character__cancelCastMotion.call(this);
  } else {
    _Game_Character__cancelCastMotion.call(this);
  }
};

//--------------------------------------------------------------------------------
// Game_Enemy Casting Skill / Model Action

var _Game_AIBot__performCastMotion = Game_Enemy.prototype._performCastMotion;
Game_Enemy.prototype._performCastMotion = function(){
  if(JM_AA3DMZ.params['_useWalkRunSkill'] === true){
    //this._mv3d_data.direction = this._findDirectionToDiagonal($gamePlayer.x, $gamePlayer.y);
    var skillId = this._absParams.currentAction.skillId;
    console.log(this._eventId, "Enemy Ev Id");
    var name = $dataSkills[skillId].name;
    mv3d.command(commandName,name);
    return this._absParams._inCastMotion = true;
  }else{
    return _Game_AIBot__performCastMotion.call(this);
  }
};

//--------------------------------------------------------------------------------
// Game_Enemy Skills / Model Action

const AABattleActionsManager_performSkillMotion = AABattleActionsManager.startAASkill;
AABattleActionsManager.startAASkill = function(aaSkill, subject, targetPoint){
  if (JM_AA3DMZ.params['_useWalkRunSkill'] === true){
    //console.log(aaSkill)
    //console.log(aaSkill.castingTime)
    /*
    let commandName;
    var skillName = aaSkill.name();
    if (subject instanceof Game_Player) {
      commandName = "@p action play";
      //mv3d.command(commandName,skillName,"important");
    } else if (subject instanceof Game_Event) {
      commandName = "@e" + subject._eventId + " action play";
      //mv3d.command(commandName,skillName,"important");
    }
    */
    console.log("noTargetAnim");
      if (subject instanceof Game_Event) {
        $gameTemp._attackDir = subject.getCardinalDirection(); console.log($gameTemp._attackDir);
        $gameTemp.impulseAngle = Math.PI * (0.5 - subject._mv3d_data.blenders.direction / 180); console.log($gameTemp.impulseAngle);
        console.log(subject, "EVENT");
        //subject.impulseAngle = Math.PI * (0.5 - subject._mv3d_data.blenders.direction / 180) * -1;
      } else {
        console.log("PLAYER");
        $gamePlayer._attackDir = subject.getCardinalDirection(); console.log($gamePlayer._attackDir);
        $gamePlayer.impulseAngle = Math.PI * (0.5 - subject._mv3d_data.blenders.direction / 180); console.log($gamePlayer.impulseAngle)
      } //$gamePlayer._attackDir;
      subject.actionName = aaSkill.name().toLowerCase();
      //console.log(subject.actionName,subject.mv3d_sprite.actions[subject.actionName]);
    if (aaSkill.castingTime === 0){  
      try {
        subject.frameMax = subject.mv3d_sprite.actions[subject.actionName][0]._to - 1;
        subject._StartFrameCounter = true;
        subject.MoveStateActions();
      } catch (error) {
        console.warn("Skill", '"' + [subject.actionName] + '"', "is missing a corresponding model action @ ",
        subject.mv3d_sprite.spriteOrigin._children[0].model_key.replace(/.\/models\/|0|\|/g,""));
      }
    }
  }
  AABattleActionsManager_performSkillMotion.apply(this, arguments);
};

//--------------------------------------------------------------------------------
// Game_CharacterBase: Jump / Z Collision Fix

const _charBase_jump = Game_CharacterBase.prototype.jump;
Game_CharacterBase.prototype.jump = function(xPlus, yPlus) {
  //console.log(this, "JUMP");
  if (!mz3d.is3D) {return _charBase_jump.apply(this, arguments);}
  //console.log(mv3d.getWalkHeight(this.x, this.y));
  this.mv3d_jumpHeightStart = this.z != null ? this.z : mz3d.getTileHeight(this._x, this.y, 0);
  this.mv3d_jumpHeightEnd = this.mv3d_jumpHeightStart; //this.mv3d_jumpHeightStart;
  
  //_charBase_jump.apply(this, arguments);
  //this._x += xPlus;
  //this._y += yPlus;
  var distance = Math.round(Math.sqrt(xPlus * xPlus + yPlus * yPlus));
  this._jumpPeak = 10 + distance - this._moveSpeed;
  this._jumpCount = this._jumpPeak * 2;
  this.resetStopCount();
  //this.straighten();
};

//--------------------------------------------------------------------------------
// Game_Character AI: Impulse (knockback) / Z collision fix

Game_Character.prototype.aaMoveInImpulseDirection = function(power, dir, withJump) {
  this.aaClearMovePath();
  var angle, attackDir;
  if (this instanceof Game_Event) {
    angle = $gamePlayer.impulseAngle;
    attackDir = $gamePlayer._attackDir;
  } else {
    angle = $gameTemp.impulseAngle;
    attackDir = $gameTemp._attackDir;
  }
  //console.log(angle, attackDir, this);
  let moved = false;
  for (let i = 1; i <= power; i++) {
    // Precompute new position
    const nextX = Math.round(this._realX + i * Math.cos(angle));
    const nextY = Math.round(this._realY + i * Math.sin(angle));
    this.impX = nextX;
    this.impY = nextY;
    if (!this.aaForceMoveByImpulse(attackDir)) {
      this.jump(0, 0);
      //console.log(this.impX, this.impY);
      break;
    } else {
      moved = true;
    }
  }
  if (withJump && moved) {
    return this.jump(0, 0);
  }
};

Game_Character.prototype.aaForceMoveByImpulse = function(direction) {
  console.log("IMPULSE");
  // Cache collision heights
  const collisionHeights = mz3d.getCollisionHeights(this.impX, this.impY);
  if (!collisionHeights.length) return;
  const walkHeight = collisionHeights[0].z2;

  // Check passability and Z threshold
  const canPass = this.canPass(this.impX, this.impY, direction);
  const stairThresh = mz3d.STAIR_THRESH;
  const z = this.z;

  if (canPass && ((z >= walkHeight - stairThresh && z <= walkHeight + stairThresh) ||
    z >= walkHeight + stairThresh - 1)) {
    this._x = this.impX;
    this._y = this.impY;
    return true;
  }
  return false;
};

//--------------------------------------------------------------------------------------
// Init tempProjectile for each available skills ---------------------------------------

const Scene_Load_executeLoad = Scene_Load.prototype.executeLoad;
Scene_Load.prototype.executeLoad = function() {
  Scene_Load_executeLoad.apply(this, arguments);
  delete mv3d._AA3Dinit;
};

const Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function(){
  Scene_Map_update.call(this);
  if (!mv3d.scene.isLoading && mv3d._AA3Dinit === undefined) {
    // reapply mz3d patch2--------------------------------------------------------------
    AA.mz3d_patch2();

    // dispose() tempProjectiles for GamePlayer and AI-------------------
    if (JM.AA3DMZ.tempProjectile) {
      JM.AA3DMZ.tempProjectile.forEach(Proj => {
        if (Proj) {
          if (Proj.model) Object.keys(Proj.model).forEach(Model => {
            const mesh = mz3d.scene.getMeshByID(Model);
            if (mesh) mesh.dispose();
          });
          if (Proj.particle) Object.keys(Proj.particle).forEach(Particle => {
            const ps = mz3d.scene.getParticleSystemByID(Particle);
            if (ps) ps.dispose();
          });
        }
      });
    }

    // init tempProjectile--------------------------------------------------------------
    JM.AA3DMZ.tempProjectile = [];
    var gP = "0";
    console.log("MAPLOADED");
      // Preload all particles and models from Game_Player Skill Panel -----------------
    JM.AA3DMZ.tempProjectile[gP] = { model: {}, particle: {}, sprite: {} };
    const preloadedModels = new Set();
    const preloadedParticles = new Set();

    $dataSkills.forEach(m => {
      if (m && m.AASkill && m.AASkill.skillImg) {
        const img = m.AASkill.skillImg;
        const projectileType = m.AASkill.projectile || JM_AA3DMZ.params['_projectileType'];
        if ((projectileType === 1 || projectileType === "model") && !preloadedModels.has(img)) {
          preloadedModels.add(img);
          Sprite_AAMapSkill2Projectile.prototype.asyncImportModel(gP, img);
        }
        if ((projectileType === 3 || projectileType === "particle") && !preloadedParticles.has(img)) {
          preloadedParticles.add(img);
          Sprite_AAMapSkill2Projectile.prototype.ImportParticle(gP, img);
        }
      }
    });
      // Starting z position for Player-------------------------------------------------
      $gamePlayer.mv3d_sprite.z = mv3d.getTileHeight($gamePlayer._x, $gamePlayer._y, 0);

      // Preload all particles and models from AI Skills -------------------------------   
      $gameMap._events.forEach(AI => {
      if (AI && AI.AABattler && AI.AABattler()) {
        AI.z = mv3d.getTileHeight(AI._x, AI._y, 0);
        JM.AA3DMZ.eId = AI._eventId;
        JM.AA3DMZ.tempProjectile[AI._eventId] = { model: {}, particle: {}, sprite: {} };
        // Use Sets to avoid duplicate preloads per AI
        const aiPreloadedModels = new Set();
        const aiPreloadedParticles = new Set();
        AI.AAModel().enemy().actions.forEach(S => {
          const Skill = $dataSkills[S.skillId]?.AASkill;
          if (Skill && Skill.skillImg) {
            const img = Skill.skillImg;
            const projectileType = Skill.projectile || JM_AA3DMZ.params['_projectileType'];
            if ((projectileType === 1 || projectileType === "model") && !aiPreloadedModels.has(img)) {
              aiPreloadedModels.add(img);
              Sprite_AAMapSkill2Projectile.prototype.asyncImportModel(AI._eventId, img);
            }
            if ((projectileType === 3 || projectileType === "particle") && !aiPreloadedParticles.has(img)) {
              aiPreloadedParticles.add(img);
              Sprite_AAMapSkill2Projectile.prototype.ImportParticle(AI._eventId, img);
            }
          }
        });
      }
    });
    mv3d._AA3Dinit = true;
  }
};

const _fade_In_For_Transfer = Scene_Map.prototype.fadeInForTransfer;
Scene_Map.prototype.fadeInForTransfer = function () {
  _fade_In_For_Transfer.apply(this, arguments);
  delete mv3d._AA3Dinit;
}

// Projectile: Model Async Loader -------------------------------------------------------
Sprite_AAMapSkill2Projectile.prototype.asyncImportModel = async function(eId, imgName) { console.log("IMPORT MODEL")
  
  let result = await BABYLON.SceneLoader.ImportMeshAsync(null, "./models/", imgName + ".glb", mv3d.scene);

  result.meshes[0].setEnabled(false); // Set preloaded models to disabled until used and refreshed.
  result.meshes.forEach(mesh => mesh.renderingGroupId = mv3d.enumRenderGroups.MAIN);
  result.meshes[0].id = imgName;

  try {
    result.animationGroups[1].start(true);
  } catch {
    console.warn("No animation data (NLA track) found for model " + imgName + ".glb")
  }

  JM.AA3DMZ.tempProjectile[eId].model[imgName] = result.meshes[0];
};
  
// Projectile: Particle Async Loader -------------------------------------------------------
Sprite_AAMapSkill2Projectile.prototype.ImportParticle = function(eId, imgName) { console.log("IMPORT PARTICLE")
  
  let sphereSpark = new BABYLON.TransformNode();

  const assetsManager = new BABYLON.AssetsManager(mv3d.scene);
  const particleTexture = assetsManager.addTextureTask("projectile particle texture", "./particles/" + imgName + ".png");
  const particleFile = assetsManager.addTextFileTask("projectile particle system", "./particles/" + imgName + ".json"); //imgName
  
  assetsManager.load();
  
  assetsManager.onFinish = function(tasks) {
    console.log("tasks successful", tasks);
    // prepare to parse particle system files
    const particleJSON = JSON.parse(particleFile.text);
    // check GPU support
    if (BABYLON.GPUParticleSystem.IsSupported) {
      myParticleSystem = BABYLON.GPUParticleSystem.Parse(particleJSON, mv3d.scene, "", true); //10000
    } else { // switch to software rendering
      myParticleSystem = BABYLON.ParticleSystem.Parse(particleJSON, mv3d.scene, "", true);
    }
    myParticleSystem.emitter = sphereSpark;
    myParticleSystem.particleTexture = particleTexture.texture;
    myParticleSystem.preWarmCycles = particleJSON.emitRate;
    myParticleSystem.maxEmitPower = 0;
    //myParticleSystem._accumulatedCount = 1;
    myParticleSystem.updateSpeed = 0.02;
    myParticleSystem.minEmitPower = 0;
    //myParticleSystem.emitter.rotation.y = 1;
    myParticleSystem.renderingGroupId = mv3d.enumRenderGroups.MAIN;
    //myParticleSystem.disposeOnStop = true;
    myParticleSystem.id = imgName;
    JM.AA3DMZ.tempProjectile[eId].particle[imgName] = myParticleSystem;
  }
}; 

Sprite_AAMapSkill2Projectile.prototype._setupDirection = function() {
  var a, eX, eY, pi, sX, sY, yo;
  yo = 0;
  eX = this.skill.scX;
  eY = this.skill.scY;
  sX = this.skill.x;
  sY = this.skill.y;
  this._angle = Math.atan2(eY - yo - sY, eX - sX) * 180 / Math.PI;
  //console.log(this);
  pi = Math.PI / 180;
  if (!this.skill.isStaticAngle()) {
    this.rotation = (this._angle + 90) * pi;
    //console.log("running", this);
  }
  if (this.skill.packedSubject.type === 0) {
    //console.log(this.skill)
    a = $gamePlayer._mv3d_data.blenders.direction * Math.PI / 180 * -1 + (Math.PI / 2);
  } else {
    a = $gameMap._events[this.skill.packedSubject.id]._mv3d_data.blenders.direction * Math.PI / 180 * -1 + (Math.PI / 2);
  }
  if (this.skill.packedSubject.type === 0 && this.skill.aaSkill.selectZone === 1) {
    a = this._angle * pi;
  }
  this.dx = this._speed * Math.cos(a);
  this.dy = this._speed * Math.sin(a);
};

AA.mz3d_patch2 = function () {
Spriteset_Map.prototype.aaCreateNewMapSkill = function(index) {
  var skill, sprite;
  skill = $gameMap.aaMapSkills()[index];
  if (skill == null) {
    return;
  }
  sprite = new Sprite_AAMapSkill2Projectile(index);
  this._aaMapSkills[index] = sprite;
  this._tilemap.addChild(sprite);
  }

Game_Player.prototype.updateMove = function() {
	//if(this._omniX==null || this._omniY==null) return _characterBase_updateMove.apply(this,arguments);
  //this._isMovingFlag = this.isMoving();
  //console.log(this._isMovingFlag)
	const targetX = this.targetX();
	const targetY = this.targetY();

	const dx = targetX - this._realX;
	const dy = targetY - this._realY;

	// normalize vector
	const mag = Math.sqrt(dx*dx+dy*dy);
	if(mag===0){ return; }

	const xmove = dx/mag*this.distancePerFrame();
	const ymove = dy/mag*this.distancePerFrame();

    if (targetX< this._realX) {
        this._realX = Math.max(this._realX + xmove, targetX);
    }
    if (targetX > this._realX) {
        this._realX = Math.min(this._realX + xmove, targetX);
    }
    if (targetY < this._realY) {
        this._realY = Math.max(this._realY + ymove, targetY);
    }
    if (targetY > this._realY) {
        this._realY = Math.min(this._realY + ymove, targetY);
    }
    if (!this.isMoving()) {
        this.refreshBushDepth();
    }
};

Sprite_AAMapSkill2Projectile.prototype._updateOutOfScreen = function() {
  //console.log(this.x,this.y)
  var e;
  try {
    this._outOfScreenCheckInterval++;
    if (this._outOfScreenCheckInterval > 30) {
      this._outOfScreenCheckInterval = 0;
      //if (this.x < 0 || this.x > Graphics.width || this.y < 0 || this.y > Graphics.height) {
      if (this.x > Graphics.width || this.y > Graphics.height) {
        console.log("PROJECTILE OUT OF SCREEN " + this.skill.uniqueId);
        this._ended = true;
        this.removeFromParent();
        this.projectile.dispose();
        return AA.EV.call("MapSkillsRequestsClean");
      }
    }
  } catch (error) {
    e = error;
    return KDCore.warning(e);
  }
};

// Projectile: Dispose ------------------------------------------------------------
Sprite_AAMapSkill2Projectile.prototype._onTimeEnded = function() {
  //console.log("_onTimeEnded/dispose")
  var x, y;
  
  this._ended = true;
  // * Если навык без контактный и его "время" закончено, он должен сработать всё равно
  if (this._hasHit === false && this.skill.isNoContact() && !this.skill.isPhantom()) {
    x = Math.floor(this.skill.x / $gameMap.tileWidth());
    y = Math.floor(this.skill.y / $gameMap.tileWidth());
    this.onHit({x, y});
  }
  JM.AA3DMZ.projectileEndingZ = this._mz3d_z;
  this.projectile.dispose();
  this.removeFromParent();
  AA.EV.call("MapSkillsRequestsClean");
};
  
// Projectile: Vector Logic --------------------------------------------------------
Sprite_AAMapSkill2Projectile.prototype._updateParticlePosition = function() {
  // Calculate screen position once
  const tileWidth = $gameMap.tileWidth();
  const skillX = this.skill.x;
  const skillY = this.skill.y;
  const displayX = $gameMap.displayX();
  const displayY = $gameMap.displayY();
  const yOffset = this._yOffset || 0;
  const mz3d_z = this._mz3d_z;

  this.x = skillX - displayX * tileWidth;
  this.y = skillY - displayY * tileWidth + yOffset;
  this.skill.refreshColliderPosition(this.x, this.y);

  let rotDir2 = 0;

  // Sprite mode
  if (!this.name ||
    (!this.projectileNote && JM_AA3DMZ.params['_projectileType'] === 2) ||
    this.projectileNote === "sprite"
  ) {
    this.projectile.position.x = skillX / tileWidth + yOffset - 0.5;
    this.projectile.position.z = ((skillY / tileWidth) * -1) + 0.5 + yOffset;
    this.projectile.position.y = mz3d_z;
    try {
      this.babTexture.uOffset = this.image._texture._uvs.x1;
    } catch {
      this.babTexture.uOffset = 0;
    }
    rotDir2 = Math.PI / 2;
  }
  // Model mode
  else if (
    ((!this.projectileNote && JM_AA3DMZ.params['_projectileType'] === 1) && this.name) ||
    this.projectileNote === "model"
  ) {
    this.projectile.setEnabled(true);
    this.projectile.position.x = skillX / tileWidth + yOffset - 0.5;
    this.projectile.position.z = ((skillY / tileWidth) * -1) + 0.5 + yOffset;
    this.projectile.position.y = mz3d_z;
    rotDir2 = 0;
  }
  // Particle mode
  else if (
    (!this.projectileNote && JM_AA3DMZ.params['_projectileType'] === 3) ||
    this.projectileNote === "particle"
  ) {
    this.projectile.start();
    this.projectile.worldOffset.x = skillX / tileWidth + yOffset - 0.5;
    this.projectile.worldOffset.z = ((skillY / tileWidth) * -1) + 0.5 + yOffset;
    this.projectile.worldOffset.y = mz3d_z;
    rotDir2 = 0;
  }

  // Set rotation
  const rotDir = this._angle;
  this.projectile.rotation = new BABYLON.Vector3(rotDir2, rotDir, 0);

  // Flush projectile for Menu Open / Game Pause
  if (!KDCore.Utils.isSceneMap()) {
    this.projectile.dispose();
    this.removeFromParent();
  }
  if (this._hasHit) JM.AA3DMZ.projectileEndingZ = mz3d_z;
};
  
// Projectile: Set Sprite and/or Model ------------------------------------------------
Sprite_AAMapSkill2Projectile.prototype._setupImage = function() {
  const scene = mv3d.scene;
  const aaSkill = this.skill.aaSkill;
  const packedSubject = this.skill.packedSubject;
  const skillImg = aaSkill.skillImg;
  const projectileNote = aaSkill.projectile;
  const useType = JM_AA3DMZ.params['_projectileType'];
  const subjectId = packedSubject.id || 0;

  if (skillImg != null) {
    this.image = new Sprite();
    this.addChild(this.image);
    this._setupAnimatedImg();
    this.image.anchor.x = 0.5;
    this.image.anchor.y = 0.5;

    this.name = true;
    this.projectileNote = projectileNote;

    // Sprite mode
    if ((!projectileNote && useType === 2) || projectileNote === "sprite") {
      this.image.bitmap = ImageManager.loadPicture(this.skill.image());
      this.image.bitmap.addLoadListener(() => {
        this.image.y = this.image.bitmap.height / 2;
      });
      this.babTexture = new BABYLON.Texture(this.image._bitmap._url, scene);
    }

    // Model mode
    if (((!projectileNote && useType === 1) && this.name) || projectileNote === "model") {
      this.image.bitmap = ImageManager.loadPicture(null);
      this.projectile = JM.AA3DMZ.tempProjectile[subjectId].model[skillImg];
      this.asyncImportModel(subjectId, skillImg);
      return;
    }

    // Particle mode
    if (((!projectileNote && useType === 3) && this.name) || projectileNote === "particle") {
      this.image.bitmap = ImageManager.loadPicture(null);
      this.projectile = JM.AA3DMZ.tempProjectile[subjectId].particle[skillImg];
      this.ImportParticle(subjectId, skillImg);
      return;
    }

    // Fallback: create a 3D sprite plane
    const V4 = new BABYLON.Vector4(0, 0, 1 / this._frames, 1);
    const projectile = BABYLON.MeshBuilder.CreatePlane("SpriteProj", {
      width: 3,
      height: 3,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
      frontUVs: V4,
      backUVs: V4,
      wrap: true
    }, scene);
    projectile.renderingGroupId = mv3d.enumRenderGroups.MAIN;
    const material = new BABYLON.StandardMaterial("material", scene);
    material.backFaceCulling = true;
    material.alphaCutOff = mv3d.ALPHA_CUTOFF;
    material.diffuseTexture = this.babTexture;
    material.diffuseTexture.hasAlpha = true;
    material.ambientColor.set(1, 1, 1);
    material.specularColor.set(1, 1, 1);
    material.maxSimultaneousLights = 25;
    projectile.material = material;

    JM.AA3DMZ.tempProjectile[subjectId].sprite[skillImg] = projectile;
    this.projectile = JM.AA3DMZ.tempProjectile[subjectId].sprite[skillImg];
  }
};
  
  AA.PP = new AA.ParamsManager();
  const WALL_HIT_BEHAVIOR = AA.PP.getParam('WALL_HIT_BEHAVIOR', true);
  const PROJECTILE_Z_OFF = AA.PP.getParam('PROJECTILE_Z_OFF', .5);
  const PROJECTILE_CLIMB_HEIGHT = AA.PP.getParam('PROJECTILE_CLIMB_HEIGHT', 1);
  const PROJECTILE_CLIMB_TIME = AA.PP.getParam('PROJECTILE_CLIMB_TIME', 5);
  const PROJECTILE_FALL_TIME = AA.PP.getParam('PROJECTILE_FALL_TIME', 25);

Sprite_AAMapSkill2Projectile.prototype._updatePosition = function () {
  if (this.isEnd()) return;

  const skill = this.skill;
  const tileWidth = $gameMap.tileWidth();
  const tileHeight = $gameMap.tileHeight();
  const x = skill.x / tileWidth - 0.5;
  const y = skill.y / tileHeight - 0.5;
  const cosX = Math.cos(mz3d.util.degtorad(this._angle));
  const sinY = Math.sin(mz3d.util.degtorad(this._angle));
  const subject = skill.getSubject();

  // Helper to get z2+offset from collision heights
  function getZ2Offset(xx, yy) {
    const heights = mz3d.getCollisionHeights(xx, yy);
    return heights.length ? heights[0].z2 + PROJECTILE_Z_OFF : PROJECTILE_Z_OFF;
  }

  let zTarget = getZ2Offset(x + cosX, y + sinY);
  let zWall = getZ2Offset(x + cosX / 2, y + sinY / 2);
  let zCurrent = getZ2Offset(x, y);

  // Refine zCurrent if on a valid layer
  const layersCurrent = mz3d.getCollisionHeights(x, y);
  for (let i = 0; i < layersCurrent.length; i++) {
    const layer = layersCurrent[i];
    if (
      layer.z1 !== -Infinity &&
      (this._mz3d_z - PROJECTILE_Z_OFF) - layer.z1 <= mz3d.STAIR_THRESH &&
      layer.z1 - (this._mz3d_z - PROJECTILE_Z_OFF) <= mz3d.STAIR_THRESH
    ) {
      zCurrent = layer.z2 + PROJECTILE_Z_OFF;
      break;
    }
  }

  // Refine zTarget if on a valid layer
  const layersTarget = mz3d.getCollisionHeights(x + cosX, y + sinY);
  for (let i = 0; i < layersTarget.length; i++) {
    const layer = layersTarget[i];
    if (layer.z1 !== -Infinity && this._mz3d_z !== zCurrent) {
      zTarget = layer.z2 + PROJECTILE_Z_OFF;
    }
  }

  // Refine zWall if on a valid layer and matches subject.z
  const layersWall = mz3d.getCollisionHeights(x + cosX / 2, y + sinY / 2);
  for (let i = 0; i < layersWall.length; i++) {
    const layer = layersWall[i];
    if (layer.z1 !== -Infinity && layer.z1 === subject.z) {
      zWall = layer.z2 + PROJECTILE_Z_OFF;
    }
  }

  this.zCurrent = zCurrent;
  this.zTarget = zTarget;

  if (this._mz3d_z === undefined) {
    this._mz3d_z = isFinite(subject.z)
      ? Math.max(subject.z, Math.min(zWall, subject.z + PROJECTILE_CLIMB_HEIGHT))
      : zWall;
    if (subject.jumpVelocity) this._mz3d_z += subject.jumpVelocity / 5;
  }

  const collisionSoon = zTarget - zCurrent > PROJECTILE_CLIMB_HEIGHT;

  if (
    (WALL_HIT_BEHAVIOR ? zWall : zCurrent) - this._mz3d_z > PROJECTILE_CLIMB_HEIGHT &&
    !this._mz3d_collision
  ) {
    this._mz3d_collision = WALL_HIT_BEHAVIOR
      ? {
          x: Math.floor((skill.x - this.dx) / tileWidth),
          y: Math.floor((skill.y - this.dy) / tileHeight),
        }
      : true;
  }

  if (!this._mz3d_collision && !collisionSoon) {
    let diff = zTarget - this._mz3d_z;
    if (Math.abs(diff) > 0.1) {
      this._mz3d_z += diff / (diff > 0 ? PROJECTILE_CLIMB_TIME : PROJECTILE_FALL_TIME);
    } else {
      this._mz3d_z = zTarget;
    }
  }

  if (this._mz3d_skill_model) {
    const model = this._mz3d_skill_model;
    model.x = x;
    model.y = y;
    model.z = this._mz3d_z;

    model.yaw = -this._angle + 270;
    model.pitch = 0;

    const yawdiff = mz3d.util.degtorad(model.yaw - mz3d.blendCameraYaw.currentValue());
    const pitchFactor = Math.sin(mz3d.util.degtorad(mz3d.blendCameraPitch.currentValue()));
    if (pitchFactor > 0.9) {
      const p =
        (pitchFactor - 0.9) *
        10 *
        (mz3d.blendCameraPitch.currentValue() > 90 ? 1 : -1) *
        -Math.sign(Math.cos(yawdiff));
      model.pitch = p * 10;
    }
  }

  this._updateParticlePosition.call(this);
};

Sprite_AAMapSkill2Projectile.prototype._checkHitPoint = function (tx, ty, tz) {
  if (!this.skill.isCanHitPoint()) {
    return  false;
  }
  return this.skill.tX === tx && this.skill.tY === ty && this._mz3d_z === tz; //,  console.log("OLDHIT"); // Check Radius Z
};

/*
Sprite_AAMapSkill2Projectile.prototype.onHit = function(target) {
  if (typeof this._mz3d_collision === 'object') {
    console.log("using mz3dcollision", this._mz3d_collision);
    if (this.isHitsContinues === true) {
      this.skill.resetHoming();
      return this.onContinuesHit(this._mz3d_collision);
    } else {
      console.log(this.skill.x, this.skill.y, target);
        return this._hasHit = true, this.onBasicHit(this._mz3d_collision);
    }
  } else {
    console.log("not using mz3dcollision");
    if (this.isHitsContinues === true) {
      this.skill.resetHoming();
      return this.onContinuesHit(target);
    } else {
      console.log(this.skill.x, this.skill.y, target);
      if (this._mz3d_z === target.z + PROJECTILE_Z_OFF) {
      
      return this.onBasicHit(target);
      }
    }
  }
  if (this._hasHit && this._mz3d_skill_model) {
    this._mz3d_skill_model.dispose();
  }
};
*/

if (window.omniMove) {
  AABattleActionsManager.removeDuplicates = function (arr, prop) {
    return arr.filter((obj, index, self) =>
    index === self.findIndex(o => o[prop] === obj[prop]));
  };

  AABattleActionsManager._applySkillActionDirect = function(subject, target, absSkill, _mz3d_z) {
    try {
      const animationId = this.getProperAnimationId(subject, absSkill);

      // Play animation on character or map as needed
      if (target instanceof Game_Character) {
        if (absSkill.animationOnMap === 0 && (target.__aaLastProjectileHitPoint == null)) {
          this.playAnimationOnCharacter(target, animationId);
        } else {
          this.playAnimationOnMapPrec(target, animationId);
        }
      } else {
        // If the skill requires contact, skip effects
        if (!absSkill.isNoContact()) return;
        this.playAnimationOnMapPrec(target, animationId);
      }

      // Extra animation and teleport
      if (absSkill.isHaveExtraAnimation()) {
        this.playExtraSkillAnimation(target.x, target.y, absSkill);
      }
      if (absSkill.isTeleport()) {
        this._performTeleport(target, subject, absSkill);
      }

      // Filter targets and check Z hit
      let targets = AATargetsManager.collectTargtesForSkill(subject, absSkill, target);
      const zHit = Math.abs((_mz3d_z - PROJECTILE_Z_OFF) - target.z) <= mz3d.STAIR_THRESH;

      if (zHit) {
        if (subject instanceof Game_Event) {
          // Remove duplicates for events (OmniMove tile division)
          const targetsNoDups = this.removeDuplicates(targets, '_eventId');
          targets = AATargetsManager.applyExtraSkillConditions(subject, targetsNoDups, absSkill);
        } else {
          console.log(targets);
          targets = AATargetsManager.applyExtraSkillConditions(subject, targets, absSkill);
        }
        this.performBattleAction(subject, absSkill, targets);
      }
    } catch (error) {
      AA.w(error);
    }
  };


AATargetsManager.collectTargetsForSkillInMapPoint = function(aaSkill, point) {
    //console.log("SKILLINMAPOINT");
    var kdPoint, targets;
    if (aaSkill == null) {
      return [];
    }
    if (point == null) {
      return [];
    }
    targets = [];
    if (point instanceof Game_Character && aaSkill.isSingleTargetArea() && !(point instanceof AADummyCharacter)) {
      this.lastPoint = point;
      if (point._eventId !=  this.lastPoint._eventId) {
        targets = [point];
      }
    } else {
      if (aaSkill.isSingleTargetArea()) {
        targets = this._collectAllAAEntitiesInPoints([point]);
      } else {
        kdPoint = new KDCore.Point(point.x, point.y);
        targets = this.collectTargetsForSkillInScreenPoint(aaSkill, kdPoint.convertToScreen());
      }
    }
function removeDuplicates(arr, prop) {
  return arr.filter((obj, index, self) =>
    index === self.findIndex(o => o[prop] === obj[prop])
  );
}

    const targetsNoDups = removeDuplicates(targets, '_eventId')

    return console.log(point), targetsNoDups;
  };


};

Sprite_AAMapSkill2Projectile.prototype._targetHitProcess = function(target) {
    //"HIT".p()
    //console.info(target)
    if (AA.PP.isUseMorePreciseProjectileAnimations() && !AA.Network.isNetworkGame()) {
      target.__aaLastProjectileHitPoint = {
        x: this.x,
        y: this.y
      };
    }
    AABattleActionsManager.applySkillAction(this.skill.getSubject(), target, this.skill.aaSkill, this._mz3d_z);
    // * Vector On Hit Actions работают отдельно, не в AABattleActionsManager
    if (target instanceof Game_Event) {
      target.aaOnVectorHit(this.skill.id());
      //console.log(target);
    }
    if (!this.skill.isPhantom()) {
      AANetworkManager.endAASkillOnMap(this.skill.uniqueId);
    }
  };

  
Sprite_AAMapSkill2Projectile.prototype._checkCollisionNew = function () {
  try {
    if (this.skill.isPhantom() || this.opacity < 255) return;

    // Calculate grid position once
    const x = Math.floor(this.skill.x / $gameMap.tileWidth());
    const y = Math.floor(this.skill.y / $gameMap.tileWidth());
    this.skill.refreshColliderPosition(this.x, this.y);

    // Party member collision
    const partyMember = this._checkHitPartyMemberNew(x, y);
    if (partyMember) {
      const zRangePM = Math.abs((partyMember._mv3d_data.z + PROJECTILE_Z_OFF) - this._mz3d_z) <= mz3d.STAIR_THRESH;
      if (zRangePM) {
        this.onHit(partyMember);
        return;
      }
    }

    // Event collision
    const event = this._checkHitEventNew(x, y);

    // Map collision (old system)
    if (this._checkHitMap(x, y) === true) {
      this.onHit({ x, y });
      return;
    }

    // Point collision (old system)
    const point = this._checkHitPoint(x, y, this.skill.getSubject().z);
    if (point === true) {
      let zRangeEv = false, zRangePM = false;
      if (this.skill.packedSubject.type === 1 && event) {
        zRangeEv = Math.abs((event.z + PROJECTILE_Z_OFF) - this._mz3d_z) <= mz3d.STAIR_THRESH;
      } else if (partyMember) {
        zRangePM = Math.abs((partyMember._mv3d_data.z + PROJECTILE_Z_OFF) - this._mz3d_z) <= mz3d.STAIR_THRESH;
      }
      if (zRangeEv || zRangePM) {
        this.onHit({ x, y });
        return;
      }
    }

    // Map collider collision (new system)
    const mapColliders = $gameMap.aaGetExCollidersWithin(x, y, 2);
    const collider = this.skill.getCollider();
    for (let i = 0; i < mapColliders.length; i++) {
      if (collider.isCollideWith(mapColliders[i])) {
        this.onHit({ x, y });
        return;
      }
    }

    // Event collider collision (new system)
    if (event) {
      const zRangeEv = Math.abs((event.z + PROJECTILE_Z_OFF) - this._mz3d_z) <= mz3d.STAIR_THRESH;
      if (zRangeEv) {
        this.onHit(event);
        return;
      }
    }

    // Network character collision
    if (AA.Network.isNetworkGame()) {
      const netChar = this._checkHitNetworkChar();
      if (netChar) {
        this.onHit(netChar);
      }
    }
  } catch (error) {
    KDCore.warning(error);
  }
};


const _checkCollision = Sprite_AAMapSkill2Projectile.prototype._checkCollisionNew;
Sprite_AAMapSkill2Projectile.prototype._checkCollisionNew = function () {
  if (!mz3d.is3D()) return _checkCollision.apply(this, arguments);
    //console.log("ISRUNNING")
    const x = this.x;
    const y = this.y;
    const disabled = mz3d.$saveData.disabled;
    mz3d.$saveData.disabled = true;
    Sprite_AAMapSkill2Projectile.prototype._updatePosition.apply(this, arguments);
    _checkCollision.apply(this, arguments);
    mz3d.$saveData.disabled = disabled;
    this.x = x;
    this.y = y;
  };

  // Effekseer - Get correct Z for endpoint.
  Sprite_Animation.prototype.updateEffectGeometry = function() {
    const pos = new BABYLON.Vector3();
    let targetCount = 0;
    let zEnd = this.zEnd || JM.AA3DMZ.projectileEndingZ;

    for (let i = 0; i < this._targets.length; i++) {
      const target = this._targets[i];
      const char = target._character;
      if (!char) continue;
      const sprite = char.mv3d_sprite;
      if (sprite) {
        pos.addInPlace(sprite.position);
      } else {
        if (!this.zEnd) this.zEnd = zEnd;
        pos.addInPlace(new BABYLON.Vector3(char.x, this.zEnd, -char.y));
      }
      ++targetCount;
    }

    if (targetCount) {
      pos.x /= targetCount;
      pos.y /= targetCount;
      pos.z /= targetCount;
    }

    if (this.mz3d_height) {
      pos.y += this.mz3d_height;
    }

    let scale = this._animation.scale / 100;
    if (this.mz3d_scale) scale *= this.mz3d_scale;
    const rx = mz3d.util.degtorad(this._animation.rotation.x);
    const ry = mz3d.util.degtorad(180 + this._animation.rotation.y - Number(this.mz3d_rot || 0));
    const rz = mz3d.util.degtorad(this._animation.rotation.z);

    if (this._handle) {
      this._handle.setLocation(pos.x, pos.y, pos.z);
      this._handle.setRotation(rx, ry, rz);
      this._handle.setScale(scale * -1, scale, scale);
      this._handle.setSpeed(this._animation.speed / 100);
    }
  }
  //--------------------------------------------------------------------------------
  // Give some extra space between characters when calculating pathfinding
  // Fixes enemies coming too close and getting stuck inside the players collider

  Game_Map.prototype.aaFindPathBetweenCharacters = function(char1, char2) {
    $gameTemp.aaPathFindIgnoreCharacters = [char1, char2];
    
    // Use a lookup table for direction offsets
    const dirOffsets = {
      2:  [0, 2],    // DOWN
      4:  [-2, 0],   // LEFT
      6:  [2, 0],    // RIGHT
      8:  [0, -2],   // UP
      1:  [-2, 2],   // DOWN LEFT
      3:  [2, 2],    // DOWN RIGHT
      7:  [-2, -2],  // UP LEFT
      9:  [2, -2]    // UP RIGHT
    };
    const dir = 10 - char1._mv3d_data.direction;
    const [xPlus, yPlus] = dirOffsets[dir] || [0, 0];

    // Find path with offset to avoid overlap
    const path = this.aaFindPath(
      char1.x, char1.y,
      char2.x + xPlus, char2.y + yPlus,
      char1.aaIsThisCharCanUseDiagMovement()
    );
    $gameTemp.aaPathFindIgnoreCharacters = null;
    return path;
  };
};