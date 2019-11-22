function getHttp(url) {
    return new Promise((res,rej) => {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    res(xhttp);
                } else {
                    rej(xhttp);
                }
            }
        };
        xhttp.open("GET", url, true);
        xhttp.send();
    });
}

let materials = {};
let colors = ["#0F0","#F00","#00F","#0FF","#FF0","#F0F"];
let rotationSpeed = 0.01;
let cubes = new Set();
let words;
let sleep = (ms) => new Promise(res=>setTimeout(res,ms));

//-5 y is offscreen while z=0

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const canvas = document.getElementById("hidden");
const ctx = canvas.getContext("2d");

function getMaterial(string) {
    if (materials[string]) {
        return materials[string];
    } else {
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = colors[string.charCodeAt(0)%colors.length];
        ctx.lineWidth = 64;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.strokeRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = "#000";
        ctx.font = "128px Arial";
        ctx.lineHeight
        ctx.textAlign = "center";
        if (string == 9 || string==99 || string==69 || string==96 || string==6 || string==66) {
            const length = ctx.measureText(string);
            ctx.fillRect( canvas.width/2 - (length.width/2), canvas.height/2 + 8, length.width, 2);
        }
        ctx.fillText(string, canvas.width/2, (canvas.height/2)+(32));
        const data = canvas.toDataURL("image/png");
        const texture = new THREE.TextureLoader().load(data);
        const material = new THREE.MeshBasicMaterial( { map: texture } );
        materials[string] = material;
        return material;
    }
}

function createCube(num) {
    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const cube = new THREE.Mesh( geometry, getMaterial(num) );
    //Todo: Change velocity based on screen size
    cube.velocity = {x:0,y:0.2,z:0,rx:rotationSpeed,ry:rotationSpeed};
    cube.position.z = -2;
    cube.position.y = -5;
    //cube.position.x = (Math.random()*10)-5;
    scene.add( cube );
    return cube;
}

async function getWords() {
    if (words)
        return words;

    const wordlist = (await getHttp("./words.txt")).responseText;
    words = wordlist.split("\n");
    return words;
}

async function spawnWord(word) {
    for(let i=0; i<word.length; i++) {
        const cube = createCube(word[i].toUpperCase());
        cube.position.x = (i-3)*1.5;
        cubes.add(cube);
        await sleep(50);
    }
    await sleep(5000);
    return word;
}

async function test() {
    let wl = await getWords();
    console.log(await spawnWord(wl[Math.floor(Math.random()*(wl.length-1))]));
}

camera.position.z = 5;
let frame = 0;

function doVelocity(obj) {
    obj.position.x += obj.velocity.x;
    obj.position.y += obj.velocity.y;
    obj.position.z += obj.velocity.z;
    obj.rotation.x += obj.velocity.rx;
    obj.rotation.y += obj.velocity.ry;
}

window.addEventListener("keydown",(e)=>{
    console.log(e.code);
    if (e.code.startsWith("Key")) {
        cubes.add(createCube(e.code.replace("Key","")));
    } else if (e.code.startsWith("Digit")) {
        cubes.add(createCube(e.code.replace("Digit","")));
    }
});

function animate() {
    frame++;
    cubes.forEach(cube=>cube.velocity.y-=0.0025);
    cubes.forEach(cube=>doVelocity(cube));
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate();

test();
setInterval(test,5000);
