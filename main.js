"use strick";

const NB_ITER = 60;

const FOV = "1.0";

let canv, gl;

const mPI = Math.PI;
const mPIS2 = Math.PI / 2;
const m2PI = Math.PI * 2;
const msin = Math.sin;
const mcos = Math.cos;
const matan2 = Math.atan2;

const mhypot = Math.hypot;
const msqrt = Math.sqrt;


  function alea (min, max) {

    if (typeof max == 'undefined') return min * mrandom();
    return min + (max - min) * mrandom();
  }



  function intAlea (min, max) {


    if (typeof max == 'undefined') {
      max = min; min = 0;
    }
    return mfloor(min + (max - min) * mrandom());
  } 


let vertexSource = `
attribute vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

let fragmentSource = `

#define NB_ITER ${NB_ITER}
#define FOV ${FOV}

#define PI 3.14159265358979323846

 precision mediump float;
 uniform float width;
 uniform float height;
 uniform float xc;
 uniform float yc;
 uniform float z;     // 'altitude'
 uniform float time;
 uniform int colorSchema;
   
 vec2 resolution;
 vec2 center;
 vec2 uv;
vec3 fn(vec2 z0) {

    vec2 z = vec2(0.0,0.0);
    
    for (int k = 0; k < NB_ITER; ++k) {
         z = vec2(z.x * z.x - z.y * z.y,
                     2.0 * z.x * z.y) + z0;
        if (length(z) > 2.0) { // point outside Mandelbrot's set
            if (colorSchema == 1) {
                float s = float(k) / float(NB_ITER);
                s = (s < 0.33) ? (2.0 * s) : ((s < 0.67) ? (-1.205882353 * s + 1.057941176):(2.878787879
                    * s -1.678787879 ));

                s = mod(s + 1.0 + sin(time / 12345.0), 1.0) * 6.0;

                return vec3(clamp(vec3(max( 2.0 - s, -4.0 + s), 2.0 - abs( 2.0 -s),2.0 - abs(4.0 - s)),
                       0.0, 1.0));             
            }
            break;
        }
    }
    
    z.x = cos(z.x + 10.0 * sin(time / 5500.0));
    z.y = sin(z.y + 10.0 * sin (time / 6123.0));
    return vec3((z + 1.0) / 2.0, abs(z.x * z.y));  
}

void main(){
  
   
  resolution = vec2(width, height);
  center = resolution / 2.0;
  
  //set up position
    
  uv = (gl_FragCoord.xy - center) / width * z * FOV;

  gl_FragColor = vec4(fn(uv + vec2(xc,yc)), 1.0 );
}
`;


function compileShader(shaderSource, shaderType){
  let shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
  	throw "Shader compile failed with: " + gl.getShaderInfoLog(shader);
  }
  return shader;
}

//From https://codepen.io/jlfwong/pen/GqmroZ
//Utility to complain loudly if we fail to find the attribute/uniform
function getAttribLocation(program, name) {
  let attributeLocation = gl.getAttribLocation(program, name);
  if (attributeLocation === -1) {
  	throw 'Cannot find attribute ' + name + '.';
  }
  return attributeLocation;
}

function getUniformLocation(program, name) {
  let attributeLocation = gl.getUniformLocation(program, name);
  if (attributeLocation === null) {
  	throw 'Cannot find uniform ' + name + '.';
  }
  return attributeLocation;
}


function initShadersStuff() {


  let vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
  let fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);

  //Create shader programs
  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.useProgram(program);

  //Set up rectangle covering entire canvas
  let vertexData = new Float32Array([
    -1.0,  1.0, 	// top left
    -1.0, -1.0, 	// bottom left
     1.0,  1.0, 	// top right
     1.0, -1.0, 	// bottom right
  ]);

  // Create vertex buffer
  let vertexDataBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
  // Layout of our data in the vertex buffer
  let positionHandle = getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionHandle);
  gl.vertexAttribPointer(positionHandle,
    2, 				// position is a vec2 (2 values per component)
    gl.FLOAT, // each component is a float
    false, 		// don't normalize values
    2 * 4, 		// two 4 byte float components per vertex (32 bit float is 4 bytes)
    0 				// how many bytes inside the buffer to start from
    );

  //Get uniform handles

  widthHandle = getUniformLocation(program, 'width');
  heightHandle = getUniformLocation(program, 'height');
  xcHandle = getUniformLocation(program, 'xc');
  ycHandle = getUniformLocation(program, 'yc');
  zHandle = getUniformLocation(program, 'z');
  colorSchemaHandle = getUniformLocation(program, 'colorSchema');
  timeHandle = getUniformLocation(program, 'time');

  gl.viewport(0, 0, innerWidth, innerHeight);

}

//---------------------------------------------------------

function drawMandel(xc, yc, z) {

    canv.width = window.innerWidth;
    canv.height = window.innerHeight;
        
    gl.uniform1f(heightHandle, window.innerHeight);
    gl.uniform1f(widthHandle, window.innerWidth);

    gl.uniform1f(xcHandle, xc);
    gl.uniform1f(ycHandle, yc);
    gl.uniform1f(zHandle, z);
    gl.uniform1i(colorSchemaHandle, colorSchema);
    gl.uniform1f(timeHandle, performance.now());
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    return true;
} // startOver

//---------------------------------------------------------
function MandelMove(src, dest, time) {

    this.src = src;
    this.dest = dest;
     
    this.t0 = time;
    const dx = this.dest.x - this.src.x;
    const dy = this.dest.y - this.src.y;
    const dz = this.dest.z - this.src.z;
    this.dist = mhypot(dx, dy, dz);
/*
    this.kx = dx / this.dist; 
    this.ky = dy / this.dist; 
    this.kz = dz / this.dist; 
*/ 
    let kt =  Math.log(dest.z / src.z);
    if (mabs(kt) > 0.1) {
        this.kexp = kt / this.dest.duration;
        this.kkexp = this.src.z / (this.src.z - this.dest.z);
        this.flat = false;
    } else this.flat = true;
 
} // MandelMove(src, dest, time)

//- - - - - - - - - - - - - - - - - - - - - - - - - - - - -

MandelMove.prototype.move = function(t) {

// does nothing and returns false when animation finished
// draws and returns true before end of animation
 
    let k;
    const tRel = (t - this.t0);
    if (tRel > this.dest.duration) return false; // could be improved if exact final position is required
    if (this.flat) {
        k = tRel / this.dest.duration; // linear movement
    } else {
        k = this.kkexp * (1 - Math.exp(this.kexp * tRel));
    }
    const k1 = 1 - k;
    drawMandel(this.dest.x * k + this.src.x * k1,
               this.dest.y * k + this.src.y * k1,
               this.dest.z * k + this.src.z * k1);
    return true;
      
} // MandelMove.prototype.move

//---------------------------------------------------------

const POI = [        // sightseeing tour stops
    {x:-0.5, y:0, z:5, duration: 4000,wait:2000},
    {x: -0.08281250000000001, y:-0.65625, z: 1, duration:2000, wait:500},
    {x:0.23212580240193906, y: -0.5949556709546434, z: 0.56, duration: 2000},
    {x:0.4131094930683646, y:-0.27767836557259273, z:0.29, duration:2000},
    {x:0.3651805323359944, y:0, z:0.29, duration:4000},
    {x:0.2609, y:0, z:0.01,duration:4000},
    {x:0.260910844255071, y:0.0018815379395498522, z:0.0013, duration:2000, wait:2000},
    {x:0.3919887414197095, y:0, z: 0.78, duration: 2000, wait:500},
    {x:0.47, y:0.29, z:1.5, duration: 1000},
    {x:0.38, y:0.50, z:0.5, duration: 1000},
    {x:0.359887443993058, y:0.586849692419685, z:0.0036, duration:3000, wait:2000},
    {x:0.3591751442720101, y:0.5880694650739761, z:0.0036, duration: 1000},
    {x:0.3598244708372448, y:0.5889377305741905, z:0.0036, duration:1000},
    {x:0.36006750102055657, y:0.5902175182420433, z:0.00017,duration:2000, wait:2000},
    {x:0.36006750102055657, y:0.5902175182420433, z:2.0,duration:4000},
    {x:-0.756, y:0.12450252543226688, z:2.0, duration:2000},
    {x:-0.756, y:0.12450252543226688, z:0.27, duration:2000},
    {x:-0.7479536372653206, y:0.12450252543226688, z:0.005019824996531184, duration:4000, wait:2000},
    {x:-0.7479536372653206, y:0.12450252543226688, z:2, duration:4000},
    {x:-1.996378165001725, y:0, z:3,duration: 2000},
    {x:-1.996378165001725, y:0, z:0.01,duration: 4000, wait:2000},
    {x:-1.996378165001725, y:0, z:0.0001,duration: 4000, wait:2000},
    {x:-1.6268759631564824, y: 0, z: 1.5, duration: 4000},
    {x:-1.40223811694657, y:0,z: 0.7809246147438568,duration:2000},
    {x:-1.3953509537990478, y:0, z:0.075, duration: 2000},
    {x:-1.4153762519736488, y:-0.04345155845238676, z:0.01, duration: 4000},
    {x:-1.4191580626304106, y:-0.04617646064308192, z:0.0026, duration: 4000},
    {x:-1.419258106974251, y:-0.04738699720354962, z:0.00094, duration: 4000, wait:2000},
    {x:-1.419258106974251, y:-0.04738699720354962, z:0.027, duration: 4000, wait:2000}
];

const lPOI = POI.length;

let animate;
let events = [];
{ // scope for animate

let tStart = 0;
let tWait;
let nM;
const step = 20; 
let animState = 0;
let kPOI; // index in POI
let tStartPause, returnState; 

    animate = function(tStamp){

    requestAnimationFrame(animate);

    let event;
        
    if (animState == 0) {
        ++animState;
        tStart = tStamp;
        kPOI = 0;
    }
    if (events.length > 0) event = events.shift();
     
    switch (animState) {
    
        case 0:
            kPOI = 0;
            ++animState;

        case 1:
            let kPOI1 = (kPOI + 1) % lPOI;
            nM = new MandelMove (POI[kPOI],POI[kPOI1], tStamp);
            tStart = tStamp;
            kPOI = kPOI1;
            ++ animState;    

        case 2:
            if (event === "click") {
                returnState = animState;
                animState = 10;
                tStartPause = tStamp;
                break;
            }
            if (tStamp - tStart < step) return;
            tStart += step;
            if (nM.move(tStamp) === true) return; // not finished
            if (typeof POI[kPOI].wait == "undefined") {
                animState = 1;
                return;
            }
            ++animState;
            tStart = tWait = tStamp; // for duration of refresh and wait
            break;
            
        case 3:
            if (event === "click") {
                returnState = animState;
                animState = 10;
                tStartPause = tStamp;
                break;
            }
            if (tStamp - tStart < step) return;
            tStart += step;
            drawMandel(POI[kPOI].x, POI[kPOI].y, POI[kPOI].z);
            if (tStamp - tWait < POI[kPOI].wait) return;
            animState = 1;
            break;            

        case 10: // pause in progress
            if (event === "click") { // end of pause
                // compensate animation start time for pause time
                nM.t0 += tStamp - tStartPause;
                animState = returnState
                return;
            }
            // keep color animation during pause
            if (tStamp - tStart < step) return;
            tStart += step;
            nM.move(tStartPause);
            break
    } // switch
    
    
} // animate

} // scope for animate

//- - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function resize () {
    gl.viewport(0, 0, innerWidth, innerHeight);
} // resize

function clicked() {
    events.push("click");
    document.querySelector("#xaz").style.display ="none";
}

//---------------------------------------------------------
// beginning of execution

  {
    canv = document.createElement('canvas');
    canv.style.position="absolute";
    document.body.appendChild(canv);
    gl = canv.getContext('webgl');
  } // canvas creation

    canv.addEventListener("click", clicked);
    document.querySelector("#chg").addEventListener("click",()=>colorSchema = 1-colorSchema);
    window.addEventListener('resize',resize);

    initShadersStuff();

    requestAnimationFrame(animate);
