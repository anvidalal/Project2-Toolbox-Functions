
// Skybox texture from: https://github.com/mrdoob/three.js/tree/master/examples/textures/cube/skybox

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import {pcurve, ease_in_out_quadratic, impulse} from './helpers'

var user_input = 
{
    feather_curvature : 0.5,
    feather_distribution : 0.1, 
    feather_count : 100,
    feather_size : 1,
    feather_color : 0xaaaaaa, 
    feather_orientation : 0,
    flapping_speed : 0.5,
    flapping_motion : 0,
    wind_speed : 1
};
var time = 0;
var phong = new THREE.MeshPhongMaterial({ color: user_input.feather_color, shininess : 4 });
var featherGeo;
var feather_meshes = [];
var wing = new THREE.Object3D();
wing.name = "wing";

function alignFeathers(scale, feather_distribution, feather_count, z_offset, color)
{
    phong.color.set(color);

    var length = feather_distribution * feather_count;
    for (var x = feather_distribution; x < length; x += feather_distribution)
    {
        var mesh = new THREE.Mesh(featherGeo, phong);
        var y = impulse(x, user_input.feather_curvature);
        var z = ease_in_out_quadratic(x / length) - z_offset / 4;
        mesh.position.set(x, y, z);
        mesh.scale.set(scale, scale, scale);
        var rot = Math.abs(0.5 * Math.sin(2 * x) * Math.cos(2 * x));
        mesh.rotation.set(Math.PI / 2, 
            Math.PI / 2 * rot + user_input.feather_orientation, 
            Math.PI);
        mesh.name = "feather";
        wing.add(mesh);
    }
}

function makeWing()
{
    for (var i = 1; i <= 6 * user_input.feather_distribution / 0.1; i++)
    {   
        var color = new THREE.Color(user_input.feather_color);
        color.addScalar(i * 0.2);
        var scale = i * 0.5 * user_input.feather_size;
        var feather_distribution = 0.1 * i;
        var feather_count = user_input.feather_count / i;
        alignFeathers(scale, feather_distribution, feather_count, (i - 1) / 4, color);
    }
}

function removeFeathers()
{
    for(var i = 0; i < wing.children.length; i++) 
    { 
    wing.remove(wing.children[i]);
    }
}

// called after the scene loads
function onLoad(framework) 
{
    var {scene, camera, renderer, gui, stats} = framework;

    // Set light
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(1, 3, 2);
    directionalLight.position.multiplyScalar(10);

    // set skybox
    var loader = new THREE.CubeTextureLoader();
    var urlPrefix = '/images/skymap/';

    var skymap = new THREE.CubeTextureLoader().load([
        urlPrefix + 'px.jpg', urlPrefix + 'nx.jpg',
        urlPrefix + 'py.jpg', urlPrefix + 'ny.jpg',
        urlPrefix + 'pz.jpg', urlPrefix + 'nz.jpg'
    ] );

    scene.background = skymap;

    // load a simple obj mesh
    var objLoader = new THREE.OBJLoader();
    objLoader.load('/geo/feather.obj', function(obj) {

        // LOOK: This function runs after the obj has finished loading
        featherGeo = obj.children[0].geometry;
        makeWing();
        // for (var i = 0; i < feather_meshes.length; i++)
        // {
        //     scene.add(feather_meshes[i]);
        // }
    });

    scene.add(wing);

    // set camera position
    camera.position.set(-2, 0, 10);
    camera.lookAt(new THREE.Vector3(0,0,0));

    // scene.add(lambertCube);
    scene.add(directionalLight);

    // edit params and listen to changes like this
    // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
    gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
        camera.updateProjectionMatrix();
    });
    gui.add(user_input, 'feather_curvature', 0, 1).onChange(function(newVal) {
        removeFeathers();
        makeWing();
    });
    gui.add(user_input, 'feather_distribution', 0, 0.2).onChange(function(newVal) {
        removeFeathers();
        makeWing();
    });
    gui.add(user_input, 'feather_size', 0.5, 1.5).onChange(function(newVal) {
        removeFeathers();
        makeWing();
    });
    gui.add(user_input, 'feather_orientation', 0, 2).onChange(function(newVal) {
        removeFeathers();
        makeWing();
    });
    gui.add(user_input, 'wind_speed', 1, 5);
    gui.addColor(user_input, 'feather_color', 0, 2).onChange(function(newVal) {
        removeFeathers();
        makeWing();
    });
}

function flap(wing)
{
    var sin = Math.sin(time * user_input.wind_speed / 500);
    wing.rotation.z += 0.005 * sin;
}


function wind(scene, wing)
{

    for (var i = 0; i < wing.children.length; i++)
    {
        var sin = Math.sin(time * user_input.wind_speed / 500);
        wing.children[i].rotation.x += 0.005 * sin;
        wing.children[i].rotation.y -= 0.002 * sin;
    }
}

// called on frame updates
function onUpdate(framework) 
{
    var wing = framework.scene.getObjectByName("wing");    
    if (wing !== undefined) {
        var date = new Date();
        time = date.getTime();
        flap(wing);
        wind(framework.scene, wing);
    }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);