import * as THREE from "three";
import { createStage, Male, Mannequin } from "mannequin";
import { camera, controls, renderer, scene, systemAnimate } from "mannequin/scene.js";
import { Torso } from "../organs/Torso.js";
import { Head } from "../organs/Head.js";
import { Pelvis } from "../organs/Pelvis.js";
import { Ankle } from "../organs/Ankle.js";
import { Wrist } from "../organs/Wrist.js";
import { MannequinPostureVersionError } from "../bodies/Mannequin.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";


const EPS = 0.00001;
const PRESET_LIBRARY_STORAGE_KEY = 'mannequin.postureLibrary.v1';



// create a scene with a better shadow
createStage( animate );



// create gauge indicator
var gauge = new THREE.Mesh(
		new THREE.CircleGeometry( 10, 32, 9 / 4 * Math.PI, Math.PI / 2 ),
		new THREE.MeshPhongMaterial(
			{
				side: THREE.DoubleSide,
				color: 'blue',
				transparent: true,
				opacity: 0.75,
				alphaMap: gaugeTexture()
			} )
	),
	gaugeMaterial = new THREE.MeshBasicMaterial(
		{
			color: 'navy'
		} );

gauge.add( new THREE.Mesh( new THREE.TorusGeometry( 10, 0.1, 8, 32, Math.PI / 2 ).rotateZ( Math.PI / 4 ), gaugeMaterial ) );
gauge.add( new THREE.Mesh( new THREE.ConeGeometry( 0.7, 3, 6 ).translate( -10, 0, 0 ).rotateZ( 5 * Math.PI / 4 ), gaugeMaterial ) );
gauge.add( new THREE.Mesh( new THREE.ConeGeometry( 0.7, 3, 6 ).translate( 10, 0, 0 ).rotateZ( 3 * Math.PI / 4 ), gaugeMaterial ) );


function gaugeTexture( size = 256 ) {

	var canvas = document.createElement( 'canvas' );
	canvas.width = size;
	canvas.height = size;
	var r = size / 2;

	var ctx = canvas.getContext( '2d' );
	ctx.fillStyle = 'black';
	ctx.fillRect( 0, 0, size, size );

	var grd = ctx.createRadialGradient( r, r, r / 2, r, r, r );
	grd.addColorStop( 0, "black" );
	grd.addColorStop( 1, "gray" );

	// Fill with gradient
	ctx.fillStyle = grd;
	ctx.fillRect( 1, 1, size - 2, size - 2 );

	var start = Math.PI,
		end = 2 * Math.PI;

	ctx.strokeStyle = 'white';
	ctx.lineWidth = 1;
	ctx.beginPath();
	for ( var rr = r; rr > 0; rr -= 25 )
		ctx.arc( size / 2, size / 2, rr, start, end );

	for ( var i = 0; i <= 12; i++ ) {

		ctx.moveTo( r, r );
		var a = start + i / 12 * ( end - start );
		ctx.lineTo( r + r * Math.cos( a ), r + r * Math.sin( a ) );

	}

	ctx.stroke();

	var texture = new THREE.CanvasTexture( canvas, THREE.UVMapping );
	texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
	texture.repeat.set( 1, 1 );

	return texture;

}


// name body parts and their motions
var names = [
	[ 'body', '左右倾斜', '水平转身', '前后弯曲' ],
	[ 'pelvis', '左右倾斜', '水平转动', '前后弯曲' ],
	[ 'torso', '左右倾斜', '水平转动', '前后弯曲' ],
	[ 'neck', '左右歪头', '左右转头', '低头抬头' ],
	[ 'head', '左右歪头', '左右转头', '低头抬头' ],
	[ 'l_leg', '向外张开', '左右扭转', '前后抬腿' ],
	[ 'l_knee', '', '', '弯曲膝盖' ],
	[ 'l_ankle', '左右倾斜', '左右扭转', '脚踝弯曲' ],
	[ 'l_arm', '向外张开', '左右扭转', '前后抬臂' ],
	[ 'l_elbow', '', '', '弯曲手肘' ],
	[ 'l_wrist', '左右倾斜', '左右扭转', '手腕弯曲' ],
	[ 'l_finger_0', '向外张开', '左右扭转', '手指弯曲' ],
	[ 'l_finger_1', '向外张开', '', '手指弯曲' ],
	[ 'l_finger_2', '向外张开', '', '手指弯曲' ],
	[ 'l_finger_3', '向外张开', '', '手指弯曲' ],
	[ 'l_finger_4', '向外张开', '', '手指弯曲' ],
	[ 'l_mid_0', '', '', '中段弯曲' ],
	[ 'l_mid_1', '', '', '中段弯曲' ],
	[ 'l_mid_2', '', '', '中段弯曲' ],
	[ 'l_mid_3', '', '', '中段弯曲' ],
	[ 'l_mid_4', '', '', '中段弯曲' ],
	[ 'l_tip_0', '', '', '指尖弯曲' ],
	[ 'l_tip_1', '', '', '指尖弯曲' ],
	[ 'l_tip_2', '', '', '指尖弯曲' ],
	[ 'l_tip_3', '', '', '指尖弯曲' ],
	[ 'l_tip_4', '', '', '指尖弯曲' ],
	[ 'r_leg', '向外张开', '左右扭转', '前后抬腿' ],
	[ 'r_knee', '', '', '弯曲膝盖' ],
	[ 'r_ankle', '左右倾斜', '左右扭转', '脚踝弯曲' ],
	[ 'r_arm', '向外张开', '左右扭转', '前后抬臂' ],
	[ 'r_elbow', '', '', '弯曲手肘' ],
	[ 'r_wrist', '左右倾斜', '左右扭转', '手腕弯曲' ],
	[ 'r_finger_0', '向外张开', '左右扭转', '手指弯曲' ],
	[ 'r_finger_1', '向外张开', '', '手指弯曲' ],
	[ 'r_finger_2', '向外张开', '', '手指弯曲' ],
	[ 'r_finger_3', '向外张开', '', '手指弯曲' ],
	[ 'r_finger_4', '向外张开', '', '手指弯曲' ],
	[ 'r_mid_0', '', '', '中段弯曲' ],
	[ 'r_mid_1', '', '', '中段弯曲' ],
	[ 'r_mid_2', '', '', '中段弯曲' ],
	[ 'r_mid_3', '', '', '中段弯曲' ],
	[ 'r_mid_4', '', '', '中段弯曲' ],
	[ 'r_tip_0', '', '', '指尖弯曲' ],
	[ 'r_tip_1', '', '', '指尖弯曲' ],
	[ 'r_tip_2', '', '', '指尖弯曲' ],
	[ 'r_tip_3', '', '', '指尖弯曲' ],
	[ 'r_tip_4', '', '', '指尖弯曲' ],
];


var models = [];
var model = null;

function addModel( ) {

	model = new Male();
	models.push( model );

	model.l_mid_0 = model.l_finger_0.mid;
	model.l_mid_1 = model.l_finger_1.mid;
	model.l_mid_2 = model.l_finger_2.mid;
	model.l_mid_3 = model.l_finger_3.mid;
	model.l_mid_4 = model.l_finger_4.mid;

	model.r_mid_0 = model.r_finger_0.mid;
	model.r_mid_1 = model.r_finger_1.mid;
	model.r_mid_2 = model.r_finger_2.mid;
	model.r_mid_3 = model.r_finger_3.mid;
	model.r_mid_4 = model.r_finger_4.mid;

	model.l_tip_0 = model.l_finger_0.tip;
	model.l_tip_1 = model.l_finger_1.tip;
	model.l_tip_2 = model.l_finger_2.tip;
	model.l_tip_3 = model.l_finger_3.tip;
	model.l_tip_4 = model.l_finger_4.tip;

	model.r_tip_0 = model.r_finger_0.tip;
	model.r_tip_1 = model.r_finger_1.tip;
	model.r_tip_2 = model.r_finger_2.tip;
	model.r_tip_3 = model.r_finger_3.tip;
	model.r_tip_4 = model.r_finger_4.tip;

	for ( var nameData of names ) {

		var name = nameData[ 0 ];
		for ( var part of model[ name ].children[ 0 ].children )
			part.name = name;
		for ( var part of model[ name ].children[ 0 ].children[ 0 ].children )
			part.name = name;
		if ( model[ name ].children[ 0 ].children[ 1 ])
			for ( var part of model[ name ].children[ 0 ].children[ 1 ].children )
				part.name = name;
		model[ name ].nameUI = {
			x: nameData[ 1 ],
			y: nameData[ 2 ],
			z: nameData[ 3 ]
		};

	}

	renderer.render( scene, camera );

}

addModel( );





var mouse = new THREE.Vector2(), // mouse 3D position
	mouseButton = undefined, // pressed mouse buttons
	raycaster = new THREE.Raycaster(), // raycaster to grab body part
	dragPoint = new THREE.Mesh(), // point of grabbing
	obj = undefined; // currently selected body part


var cbInverseKinematics = document.getElementById( 'inverse-kinematics' ),
	cbBiologicalConstraints = document.getElementById( 'biological-constraints' ),
	cbRotZ = document.getElementById( 'rot-z' ),
	cbRotX = document.getElementById( 'rot-x' ),
	cbRotY = document.getElementById( 'rot-y' ),
	cbMovX = document.getElementById( 'mov-x' ),
	cbMovY = document.getElementById( 'mov-y' ),
	cbMovZ = document.getElementById( 'mov-z' ),
	btnGetPosture = document.getElementById( 'gp' ),
	btnSetPosture = document.getElementById( 'sp' ),
	btnExportPosture = document.getElementById( 'ep' ),
	btnAddModel = document.getElementById( 'am' ),
	btnRemoveModel = document.getElementById( 'rm' ),
	txtPresetName = document.getElementById( 'preset-name' ),
	selPresetList = document.getElementById( 'preset-list' ),
	btnSavePreset = document.getElementById( 'save-preset' ),
	btnLoadPreset = document.getElementById( 'load-preset' ),
	btnDeletePreset = document.getElementById( 'delete-preset' );


// set up event handlers
document.addEventListener( 'pointerdown', onPointerDown );
document.addEventListener( 'pointerup', onPointerUp );
document.addEventListener( 'pointermove', onPointerMove );
document.addEventListener( 'keydown', onKeyDown );

cbRotZ.addEventListener( 'click', processCheckBoxes );
cbRotX.addEventListener( 'click', processCheckBoxes );
cbRotY.addEventListener( 'click', processCheckBoxes );
cbMovX.addEventListener( 'click', processCheckBoxes );
cbMovY.addEventListener( 'click', processCheckBoxes );
cbMovZ.addEventListener( 'click', processCheckBoxes );


btnGetPosture.addEventListener( 'click', getPosture );
btnSetPosture.addEventListener( 'click', setPosture );
btnExportPosture.addEventListener( 'click', exportPosture );
btnAddModel.addEventListener( 'click', addModel );
btnRemoveModel.addEventListener( 'click', removeModel );
btnSavePreset.addEventListener( 'click', savePreset );
btnLoadPreset.addEventListener( 'click', loadPreset );
btnDeletePreset.addEventListener( 'click', deletePreset );

refreshPresetLibrary();


controls.addEventListener( 'start', function () {

	renderer.setAnimationLoop( systemAnimate );

} );


controls.addEventListener( 'end', function () {

	renderer.setAnimationLoop( null );
	renderer.render( scene, camera );

} );


window.addEventListener( 'resize', function () {

	renderer.render( scene, camera );

} );


function processCheckBoxes( event ) {

	if ( event ) {

		if ( event.target.checked ) {

			cbRotX.checked = cbRotY.checked = cbRotY.checked = cbRotZ.checked = cbMovX.checked = cbMovY.checked = cbMovZ.checked = false;
			event.target.checked = true;

		}

	}

	if ( !obj ) return;

	if ( cbRotZ.checked ) {

		obj.rotation.reorder( 'XYZ' );

	}

	if ( cbRotX.checked ) {

		obj.rotation.reorder( 'YZX' );

	}

	if ( cbRotY.checked ) {

		obj.rotation.reorder( 'ZXY' );

	}

}


function axisLabel( label, shortcut ) {

	return label ? label + ' (' + shortcut + ')' : '不可用';

}


function setRotationAxis( axis ) {

	cbRotX.checked = axis == 'x';
	cbRotY.checked = axis == 'y';
	cbRotZ.checked = axis == 'z';
	cbMovX.checked = cbMovY.checked = cbMovZ.checked = false;

	processCheckBoxes();

}


function isTextEditingTarget( target ) {

	if ( !target ) return false;
	if ( target.isContentEditable ) return true;

	var tagName = target.tagName?.toLowerCase();
	return tagName == 'input' || tagName == 'textarea' || tagName == 'select';

}


function onKeyDown( event ) {

	if ( event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey ) return;
	if ( isTextEditingTarget( event.target ) ) return;

	var key = event.key.toLowerCase();

	if ( key == 'x' || key == 'y' || key == 'z' ) {

		event.preventDefault();
		setRotationAxis( key );

	}

}


function onPointerUp( /*event*/ ) {

	controls.enabled = true;
	mouseButton = undefined;
	deselect();
	renderer.setAnimationLoop( null );
	renderer.render( scene, camera );

}


function isPanelEvent( event ) {

	return event.target?.closest?.( '.panel' );

}


function blurTextEditor() {

	if ( isTextEditingTarget( document.activeElement ) ) {

		document.activeElement.blur();

	}

}


function select( object ) {

	deselect();
	obj = object;
	obj?.select( true );

}


function deselect() {

	gauge.parent?.remove( gauge );
	obj?.select( false );
	obj = undefined;

}


function onPointerDown( event ) {

	if ( isPanelEvent( event ) ) return;

	blurTextEditor();
	userInput( event );

	gauge.parent?.remove( gauge );
	dragPoint.parent?.remove( dragPoint );

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( models, true );

	if ( intersects.length && ( intersects[ 0 ].object.name || intersects[ 0 ].object.parent.name ) ) {

		controls.enabled = false;

		var scanObj;
		for ( scanObj=intersects[ 0 ].object; !( scanObj instanceof Mannequin ) && !( scanObj instanceof THREE.Scene ); scanObj = scanObj?.parent ) {
		}

		if ( scanObj instanceof Mannequin ) model = scanObj;

		var name = intersects[ 0 ].object.name || intersects[ 0 ].object.parent.name;

		if ( name == 'neck' ) name = 'head';
		if ( name == 'pelvis' ) name = 'body';

		select( model[ name ]);

		document.getElementById( 'rot-x-name' ).innerHTML = axisLabel( model[ name ].nameUI.x, 'X' );
		document.getElementById( 'rot-y-name' ).innerHTML = axisLabel( model[ name ].nameUI.y, 'Y' );
		document.getElementById( 'rot-z-name' ).innerHTML = axisLabel( model[ name ].nameUI.z, 'Z' );

		dragPoint.position.copy( obj.worldToLocal( intersects[ 0 ].point ) );
		//obj.imageWrapper.add( dragPoint );
		obj.image.add( dragPoint );

		//if ( !cbMovX.checked && !cbMovY.checked && !cbMovZ.checked ) obj.imageWrapper.add( gauge );
		if ( !cbMovX.checked && !cbMovY.checked && !cbMovZ.checked ) obj.image.add( gauge );
		gauge.position.y = ( obj instanceof Ankle ) ? 2 : 0;


		processCheckBoxes();

	}

	renderer.setAnimationLoop( systemAnimate );

}


function relativeTurn( joint, rotationalAngle, angle ) {

	if ( rotationalAngle.startsWith( 'position.' ) ) {

		// it is translation, not rotation
		rotationalAngle = rotationalAngle.split( '.' ).pop();
		joint.position[ rotationalAngle ] += angle;
		return;

	}

	if ( joint.biologicallyImpossibleLevel ) {

		if ( cbBiologicalConstraints.checked ) {

			// there is a dedicated function to check biological possibility of joint
			var oldImpossibility = joint.biologicallyImpossibleLevel();

			joint[ rotationalAngle ] += angle;
			joint.updateMatrix();
			joint.updateWorldMatrix( true ); // ! important, otherwise get's stuck

			var newImpossibility = joint.biologicallyImpossibleLevel();

			if ( newImpossibility > EPS && newImpossibility >= oldImpossibility - EPS ) {

				// undo rotation
				joint[ rotationalAngle ] -= angle;
				return;

			}

		} else {

			joint.biologicallyImpossibleLevel();
			joint[ rotationalAngle ] += angle;

		}
		// keep the rotation, it is either possible, or improves impossible situation

	} else {

		// there is no dedicated function, test with individual rotation range

		var val = joint[ rotationalAngle ] + angle,
			min = joint.minRot[ rotationalAngle ],
			max = joint.maxRot[ rotationalAngle ];

		if ( cbBiologicalConstraints.checked || min == max ) {

			if ( val < min - EPS && angle < 0 ) return;
			if ( val > max + EPS && angle > 0 ) return;
			if ( min == max ) return;

		}

		joint[ rotationalAngle ] = val;

	}

	joint.updateMatrix();

} // relativeTurn


function kinematic2D( joint, rotationalAngle, angle, ignoreIfPositive ) {

	// returns >0 if this turn gets closer

	// swap Z<->X for wrist
	if ( joint instanceof Wrist ) {

		if ( rotationalAngle == 'x' )
			rotationalAngle = 'z';
		else if ( rotationalAngle == 'z' )
			rotationalAngle = 'x';

	}

	var screenPoint = new THREE.Vector3().copy( dragPoint.position );
	screenPoint = obj.localToWorld( screenPoint ).project( camera );

	var distOriginal = mouse.distanceTo( screenPoint ),
		oldAngle = joint[ rotationalAngle ];

	if ( joint instanceof Head ) { // head and neck

		var oldParentAngle = joint.parentJoint[ rotationalAngle ];
		relativeTurn( joint, rotationalAngle, angle / 2 );
		relativeTurn( joint.parentJoint, rotationalAngle, angle / 2 );
		joint.parentJoint.updateMatrixWorld( true );

	} else {

		relativeTurn( joint, rotationalAngle, angle );

	}

	joint.updateMatrixWorld( true );

	screenPoint.copy( dragPoint.position );
	screenPoint = obj.localToWorld( screenPoint ).project( camera );

	var distProposed = mouse.distanceTo( screenPoint ),
		dist = distOriginal - distProposed;

	if ( ignoreIfPositive && dist > 0 ) return dist;

	joint[ rotationalAngle ] = oldAngle;
	if ( joint instanceof Head ) { // head and neck

		joint.parentJoint[ rotationalAngle ] = oldParentAngle;

	}

	joint.updateMatrixWorld( true );

	return dist;

}


function inverseKinematics( joint, rotationalAngle, step ) {

	// try going in postive or negative direction
	var kPos = kinematic2D( joint, rotationalAngle, 0.001 ),
		kNeg = kinematic2D( joint, rotationalAngle, -0.001 );

	// if any of them improves closeness, then turn in this direction
	if ( kPos > 0 || kNeg > 0 ) {

		if ( kPos < kNeg ) step = -step;
		kinematic2D( joint, rotationalAngle, step, true );

	}

}


function animate( /*time*/ ) {

	// no selected object
	if ( !obj || !mouseButton ) return;

	var elemNone = !cbRotZ.checked && !cbRotX.checked && !cbRotY.checked && !cbMovX.checked && !cbMovY.checked && !cbMovZ.checked,
		spinA = ( obj instanceof Ankle ) ? Math.PI / 2 : 0;

	gauge.rotation.set( 0, 0, -spinA );
	if ( cbRotX.checked || elemNone && mouseButton & 0x2 ) gauge.rotation.set( 0, Math.PI / 2, 2 * spinA );
	if ( cbRotY.checked || elemNone && mouseButton & 0x4 ) gauge.rotation.set( Math.PI / 2, 0, -Math.PI / 2 );

	var joint = ( cbMovX.checked || cbMovY.checked || cbMovZ.checked ) ? model.body : obj;

	do {

		for ( var step = 5; step > 0.1; step *= 0.75 ) {

			if ( cbRotZ.checked || elemNone && ( mouseButton & 0x1 ) )
				inverseKinematics( joint, 'z', step );
			if ( cbRotX.checked || elemNone && ( mouseButton & 0x2 ) )
				inverseKinematics( joint, 'x', step );
			if ( cbRotY.checked || elemNone && ( mouseButton & 0x4 ) )
				inverseKinematics( joint, 'y', step );

			if ( cbMovX.checked )
				inverseKinematics( joint, 'position.x', step );
			if ( cbMovY.checked )
				inverseKinematics( joint, 'position.y', step );
			if ( cbMovZ.checked )
				inverseKinematics( joint, 'position.z', step );

		}

		joint = joint.parentJoint;

	}
	while ( joint && !( joint instanceof Mannequin ) && !( joint instanceof Pelvis ) && !( joint instanceof Torso ) && cbInverseKinematics.checked );

}


function onPointerMove( event ) {

	if ( isPanelEvent( event ) ) return;

	if ( obj ) userInput( event );

}


function userInput( event ) {

	event.preventDefault();

	mouseButton = event.buttons || 0x1;

	mouse.x = event.clientX / window.innerWidth * 2 - 1;
	mouse.y = -event.clientY / window.innerHeight * 2 + 1;

}


function getPosture() {

	if ( !model ) return;

	prompt( '当前姿势数据如下。请复制到剪贴板，用于之后恢复这个姿势。', model.postureString );

}


function setPosture() {

	if ( !model ) return;

	var string = prompt( '粘贴姿势数据，确认后会把当前人偶恢复到该姿势：', '{"version":7,"data":["0,[0,0,0],...]}' );

	if ( string ) {

		var oldPosture = model.posture;

		try {

			model.postureString = string;

		} catch ( error ) {

			model.posture = oldPosture;
			if ( error instanceof MannequinPostureVersionError )
				alert( '姿势数据版本不兼容：' + error.message );
			else
				alert( '提供的姿势数据无效，或无法识别。' );
			console.error( error );

		}

		renderer.render( scene, camera );

	}

}


function getPresetLibrary() {

	try {

		var data = JSON.parse( localStorage.getItem( PRESET_LIBRARY_STORAGE_KEY ) || '[]' );
		return Array.isArray( data ) ? data.filter( preset => preset && preset.id && preset.name && preset.postureString ) : [];

	} catch ( error ) {

		console.error( error );
		return [];

	}

}


function setPresetLibrary( presets ) {

	localStorage.setItem( PRESET_LIBRARY_STORAGE_KEY, JSON.stringify( presets ) );

}


function refreshPresetLibrary( selectedId = selPresetList.value ) {

	var presets = getPresetLibrary();

	selPresetList.innerHTML = '';

	if ( presets.length == 0 ) {

		var emptyOption = document.createElement( 'option' );
		emptyOption.value = '';
		emptyOption.textContent = '暂无保存';
		selPresetList.appendChild( emptyOption );
		return;

	}

	for ( var preset of presets ) {

		var option = document.createElement( 'option' );
		option.value = preset.id;
		option.textContent = preset.name;
		selPresetList.appendChild( option );

	}

	if ( selectedId && presets.some( preset => preset.id == selectedId ) ) {

		selPresetList.value = selectedId;

	}

}


function makePresetName() {

	var value = txtPresetName.value.trim();
	if ( value ) return value;

	var now = new Date();
	var pad = value => String( value ).padStart( 2, '0' );
	return '姿势 ' + pad( now.getHours()) + ':' + pad( now.getMinutes()) + ':' + pad( now.getSeconds());

}


function savePreset() {

	if ( !model ) {

		alert( '当前没有可保存的人偶。' );
		return;

	}

	var presets = getPresetLibrary(),
		name = makePresetName(),
		existingIndex = presets.findIndex( preset => preset.name == name ),
		preset = {
			id: existingIndex >= 0 ? presets[ existingIndex ].id : String( Date.now()) + '-' + Math.random().toString( 36 ).slice( 2 ),
			name: name,
			postureString: model.postureString,
			updatedAt: new Date().toISOString()
		};

	if ( existingIndex >= 0 ) {

		if ( !confirm( '姿势库中已经有“' + name + '”。是否覆盖它？' ) ) return;
		presets[ existingIndex ] = preset;

	} else {

		presets.push( preset );

	}

	setPresetLibrary( presets );
	txtPresetName.value = name;
	refreshPresetLibrary( preset.id );
	alert( '已保存到姿势库：' + name );

}


function loadPreset() {

	if ( !model ) {

		alert( '当前没有可加载姿势的人偶。' );
		return;

	}

	var presets = getPresetLibrary(),
		preset = presets.find( item => item.id == selPresetList.value );

	if ( !preset ) {

		alert( '请先在姿势库中选择一个姿势。' );
		return;

	}

	var oldPosture = model.posture;

	try {

		model.postureString = preset.postureString;
		txtPresetName.value = preset.name;
		renderer.render( scene, camera );

	} catch ( error ) {

		model.posture = oldPosture;
		alert( '这个姿势数据无法加载，可能已经损坏或版本不兼容。' );
		console.error( error );

	}

}


function deletePreset() {

	var presets = getPresetLibrary(),
		preset = presets.find( item => item.id == selPresetList.value );

	if ( !preset ) {

		alert( '请先在姿势库中选择一个姿势。' );
		return;

	}

	if ( !confirm( '确定要删除“' + preset.name + '”吗？' ) ) return;

	presets = presets.filter( item => item.id != preset.id );
	setPresetLibrary( presets );
	txtPresetName.value = '';
	refreshPresetLibrary();

}


function exportPosture() {

	if ( !model ) return;

	var exporter = new GLTFExporter();

	exporter.parse(
		models, // objects to export
		( gltf ) => {

			var blob = new Blob([ gltf ], { type: 'application/octet-stream' } );
			var link = document.createElement( 'a' );
			link.href = URL.createObjectURL( blob );
			link.download = 'mannequin.glb';
			link.click();

		},
		( error ) => {

			throw error;

		},
		{ binary: true }
	);


} // exportPosture



function removeModel() {

	if ( !model ) return;
	scene.remove( model );
	models = models.filter( x => x!=model );

	if ( models.length > 0 )
		model = models[ 0 ];
	else
		model = null;

	renderer.render( scene, camera );

}
