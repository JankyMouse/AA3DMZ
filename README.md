This is a compatibility and cross-feature adaptation patch. Its primary purpose is to integrate and enhance the functionality between three core plugins: MZ3D V.9.2.8 (by Cutievirus), AlphaABSZ 0.9.4.1 (by Kage Desu), and OmniMove (by Cutievirus). The plugin is currently in release, at version 0.9.

Main Themes & Objectives:

The core objective of AA3DMZ is to bridge the functionalities of the specified 3D and action battle system plugins, enabling a more cohesive and robust 3D combat experience within the RPG Maker MZ environment. Key themes include:

3D Projectile Management: Implementing and standardizing various projectile types (3D models, sprites, particle systems) for skills and weapons within a 3D environment.
Character Animation and Action Logic: Controlling 3D character animations based on movement states (stop, walk, run) and skill casting, including automatic action playback for player and AI.
Enhanced 3D Movement and Collision: Improving character movement, jump mechanics, impulse (knockback), and collision detection in a 3D space, especially concerning Z-axis interactions and pathfinding.
UI/UX Improvements and Fixes: Addressing various quality-of-life issues such as title screen skipping, gamepad input, cursor/pointer lock behavior, and menu button positioning.
Optimized Asset Loading and Management: Preloading 3D models and particle systems for skills to reduce in-game loading hitches and implementing optimized mesh visibility for equipped items.
Compatibility and Bug Fixing: Providing specific fixes for issues arising from the interaction of MZ3D with other systems, such as Electron environment compatibility and depth write buffer issues in Babylon.js.
Most Important Ideas/Facts:

1. Projectile System (Models, Sprites, Particles):
The plugin introduces a flexible system for defining and handling projectiles for skills and weapons, offering three distinct visual types:

3D Model: "For models, just plug the name of your projectile model (which goes in your 'Models' folder) into skill parameter in your skill/weapon notetags. AA3DMZ will use the first NLA track and loop it." (Documentation) These are typically .glb files.
3D Sprite: "For sprites, AA3DMZ will project a flat sprite into the 3D space and setup is the same as it's originl behavior. Append '_frames' to the img name to define the ammount of animation frames." (Documentation) These use images from the "Pictures" folder.
Particle System: "For particles, you can use the particle editor here https://playground.babylonjs.com/#M7MYT8#11 and then save the particle system to a JSON file." (Documentation) These are saved to a "particles" folder.
Projectile types can be defined per skill/weapon using a notetag (e.g., projectile:model, projectile:sprite, projectile:particle) or default to a value set in the plugin options. The plugin also includes logic for asynchronous loading and disposal of these projectile assets, ensuring efficient memory management.

2. Dynamic Character Actions and Animations:
AA3DMZ implements a "MoveState / Model Action Logic" to play character animations based on their current state:

Stopped: actionName (e.g., "Attack")
Moving (Walk): actionName + "Walk" (e.g., "Attackwalk")
Running: actionName + "Run" (e.g., "Attackrun")
This system automatically triggers appropriate 3D animations for both the player character and AI events. The plugin also handles "Casting Skill direction / follow mouselook when pointerlocked" ensuring that casting animations align with player input.

3. 3D Collision and Movement Refinements:
Several critical updates enhance 3D character interaction and movement:

Z-Collision Fixes: Addressed in Game_CharacterBase: Jump / Z Collision Fix and Game_Character AI: Impulse (knockback) / Z collision fix. This is crucial for verticality in a 3D environment, ensuring characters and projectiles interact correctly with varying terrain heights and preventing "getting stuck inside the players collider."
Projectile Z-Axis Logic: Projectiles now calculate their _mz3d_z (Z-position) based on terrain, with parameters like PROJECTILE_Z_OFF, PROJECTILE_CLIMB_HEIGHT, and PROJECTILE_FALL_TIME to control their vertical movement and interaction with obstacles. Collision detection includes Z-axis range checks (Math.abs((partyMember._mv3d_data.z + PROJECTILE_Z_OFF) - this._mz3d_z) <= mz3d.STAIR_THRESH).
Pathfinding Improvements: Game_Map.prototype.aaFindPathBetweenCharacters adds "extra space between characters when calculating pathfinding" by introducing direction offsets, preventing characters from overlapping or getting stuck.
4. Equip Mesh Handling:
If the _useMeshEquip parameter is enabled, the plugin dynamically manages the visibility of 3D meshes for equipped weapons and armors:

All weapon and armor meshes are initially hidden.
When an actor equips an item, its corresponding mesh becomes visible.
"Optimized mesh visibility handling" is implemented to ensure correct rendering upon loading saves or transferring maps.
5. UI/UX and System Enhancements:
Skip Title Screen: The _skipTitle parameter allows directly entering the map scene on game boot, useful for testing.
Gamepad Right Stick Fix: Corrects input mapping for the right stick on gamepads, crucial for 3D camera control (input_mv3d._gamepadStick.right.x/y).
Cursor/PointerLock Fixes: Manages pointer lock behavior, particularly for Scene_Map interactions, and ensures pointer release when canceling actions or opening the inventory (especially when PKD_MapInventory is used).
Menu Button Relocation: The _menuButton.x and _menuButton.y coordinates are adjusted to Graphics.width - 400 and -150 respectively, indicating a custom placement likely to avoid overlap with 3D elements or other UI.
Electron Fixes: Includes specific code to handle F5 (reload), Ctrl (toggle through), and window.close() behavior when running in an Electron environment (!Utils.isNwjs()).
6. Babylon.js Integration and Fixes:
The plugin directly interacts with Babylon.js, the underlying 3D engine:

BABYLON.GPUParticleSystem.prototype._update and render modifications: These patches "Make DepthWrite false" before updating/rendering particles and reset it after (engine.setDepthWrite(false); and engine.setDepthWrite(depthWriteState); // UPDATED), which are critical for correct particle rendering and avoiding visual glitches related to depth buffering.
Asset Import: Uses BABYLON.SceneLoader.ImportMeshAsync for loading 3D models (.glb files) and BABYLON.GPUParticleSystem.Parse (or BABYLON.ParticleSystem.Parse for fallback) for particle systems.
7. Preloading of Assets:
To prevent loading stutters, the plugin preloads skill-related models and particles upon map load:

"Preload all particles and models from Game_Player Skill Panel"
"Preload all particles and models from AI Skills"
This is handled by Sprite_AAMapSkill2Projectile.prototype.asyncImportModel and Sprite_AAMapSkill2Projectile.prototype.ImportParticle. These preloaded assets are then stored in JM.AA3DMZ.tempProjectile and enabled/disabled as needed.
Technical Details & Parameters:

Plugin Name: AA3DMZ
Version: 0.7 (beta)
Author: JankyMouse
Key Parameters:_skipTitle (boolean, default: true): Skips the title screen.
_useWalkRunSkill (boolean, default: true): Enables automatic 3D actions (Walk/Run).
_projectileType (select, default: 3D Sprite): Defines the default projectile type if not specified by a notetag. Options: 3D Model, 3D Sprite, Particle System.
_usePKDInventory (boolean, default: true): Indicates if the PKD Inventory plugin is being used, affecting mouse lock behavior.
_useMeshEquip (boolean): Enables mesh handling for equipped items.
Notetags for Projectiles: projectile:model, projectile:sprite, projectile:particle in weapon/skill database.
Action Naming Convention: For skill animations, add Attack, Attackwalk, Attackrun (or similar) NLA tracks to the 3D model.
File Paths: Models in "Models" folder, Sprites in "Pictures" folder, Particles in "particles" folder (JSON and textures).
TODOs Mentioned:

Detailed AA3DMZ documentation.
Fix "fav weapons circle and freedirection(original)" for GamePad Right Stick.
Possibly re-evaluate requestPointerLock promise handling.
Add visual feedback for skill range (blink/notify small range) when isInstant() or isInCertainPoint() skills are out of range.
Conclusion:

The AA3DMZ patch is an essential component for users aiming to create a comprehensive 3D battle system in RPG Maker MZ by integrating MZ3D, AlphaABSZ, and OmniMove. It provides crucial fixes, new features for projectile and animation handling, and vital optimizations for a smoother 3D experience. Its modular approach to projectile types and automatic character actions significantly enhances the visual and gameplay depth of a 3D combat system.
