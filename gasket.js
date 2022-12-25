"use strict";

var canvas;
var gl;

var points = [];
var colors = [];
var vertices;
var NumTimesToSubdivide = 2;

// add colors and vertices for one triangle
var baseColors = [
    vec4(0.07059, 0.80784, 0.99216, 1.0),
    vec4(0.03922, 0.50588, 1.0, 1.0),
    vec4(0.0, 1.0, 0.53333, 1.0),
    vec4(1.0, 1.0, 0.0, 1.0)
];

var speedAnimation = 1.0;
var start = false;          // change the status if 'Start' button is clicked

// Variables for rotation part
var theta = [0, 0, 0];
var thetaLoc;
var axis = 0;
var xAxis = 0, yAxis = 1, zAxis = 2;
var endRotation = false, endRotation2 = false;

// Variables for scaling part
var s = 1.0;                // store the scale factor
var scale;
var scaleStatus = false;

// Variables for translation part
var trans = [0.0, 0.0, 0.0];
var transLoc;
var xTranspeed = 0.01, yTranspeed = 0.01, zTranspeed = 0.01;
var transMode = 3;

// Variables for menu listener
var menu, menuTransMode;


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the vertices of our 3D gasket
    // Four vertices on unit circle
    // Intial tetrahedron with equal length sides

    vertices = [
        vec3(0.0, 0.0, -0.25),
        vec3(0.0, 0.2357, 0.0833),
        vec3(-0.2041, -0.1179, 0.0833),
        vec3(0.2041, -0.1179, 0.0833)
    ];

    divideTetra( vertices[0], vertices[1], vertices[2], vertices[3],
                 NumTimesToSubdivide);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    // enable hidden-surface removal

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    displayObject();
    
// *****************************************************************
//                  Display Rendering Object Function
// *****************************************************************
    function displayObject(){
        points = [];
        colors = [];
        
        divideTetra( vertices[0], vertices[1], vertices[2], vertices[3],
            NumTimesToSubdivide);           

        // Create a buffer object, initialize it, and associate it with the
        //  associated attribute variable in our vertex shader
        var cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    
        var vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );
    
        var vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );
        
   
    }
    
    // Rotation part
    thetaLoc = gl.getUniformLocation(program, "theta");

    // Scaling part
    scale = gl.getUniformLocation(program, "scale");
    gl.uniform1f(scale, s);

    // Translation part
    transLoc = gl.getUniformLocation(program, "translate");
    gl.uniform3fv(transLoc, trans);


    // event for subdivision slider 
    const subDivSlider = document.querySelector(".numSubDiv .slider");
    const subDivValue = document.querySelector(".numSubDiv .value");
    subDivValue.textContent = subDivSlider.value;
    subDivSlider.oninput = function (){
        
        subDivValue.textContent = this.value;
        NumTimesToSubdivide = subDivValue.textContent;
        displayObject();
    }

    // event for speedAnimation slider 
    const speedAnimSlider = document.querySelector(".speedAnim .slider");
    const speedAnimValue = document.querySelector(".speedAnim .value");
    speedAnimValue.textContent = speedAnimSlider.value;
    speedAnimSlider.oninput = function (){
        
        speedAnimValue.textContent = this.value;
        speedAnimation = speedAnimValue.textContent;
    }

    // color picker
    const colorPickers = Array.from(document.querySelectorAll(".colorpicker"));
    colorPickers.forEach((cP, i) => {
      cP.addEventListener("change", () => {
        baseColors[i] = hexTorgb(cP.value);
        displayObject();
      });
    });
    
    // Menu listener for intial scale
    menu = document.getElementById("controls");
    menu.addEventListener('change', function (){
              
        menuSelectOption();         // Call menuSelectOption function
        gl.uniform1f(scale, s);
    });
    
    // Select Option function for initial scale part
    function menuSelectOption(){

        switch(menu.value){
            case '0':
                s = 0.5;
                break;
            
            case '1':
                s = 1.0;
                break;

            case '2':
                s = 1.5;
                break;

            case '3':
                s = 2.0;
                break;  

            case '4':
                s = 3.0;
                break;
        }
    }

    // Menu listener for translation mode
    menuTransMode = document.getElementById("translationMode");
    menuTransMode.addEventListener('change', function (){
        switch(menuTransMode.value){
            case '0':
                transMode = 0;
                break;
            
            case '1':
                transMode = 1;
                break;

            case '2':
                transMode = 2;
                break;

            case '3':
                transMode = 3;
                break;  

        }
    });


    // event listeners for start buttons to begin and stop animation
    const btnText = document.querySelector(".btnText");
    document.getElementById("StartBtn").onclick = () => {

        if (btnText.innerText == "Start"){
            btnText.innerText = "Stop";
            start = true;
            rotation();
        }

        else{
            btnText.innerText = "Start";
            start = false;
            resetAnimation();
        }        
    }

    // Reset to the original state of the object
    function resetAnimation(){
        theta = [0, 0, 0];
        menuSelectOption();
        trans = [0.0, 0.0, 0.0];
        endRotation = false;
        endRotation2 = false;
        scaleStatus = false;
    
        gl.uniform3fv(thetaLoc, flatten(theta));
        gl.uniform1f(scale, s);
        gl.uniform3fv(transLoc, trans);
    }

    render();
};



// *********************************************************************
//                         Render function
// *********************************************************************
function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays( gl.TRIANGLES, 0, points.length );

    requestAnimFrame(render);
}


// *********************************************************************
//                         Rotation function
// *********************************************************************
function rotation(){

    if(start){
        if((theta[zAxis] >= 0 && theta[zAxis] <= 180) && endRotation == false){
            theta[zAxis] += 2.0 * speedAnimation;
            gl.uniform3fv(thetaLoc, flatten(theta));
        }
        
        if(theta[zAxis] > 180 || endRotation == true){
            theta[zAxis] -= 2.0 * speedAnimation;
            gl.uniform3fv(thetaLoc, flatten(theta));
            endRotation = true;
        }
    
        if(theta[zAxis] < -180 || endRotation2 == true){
            theta[zAxis] += 2.0 * speedAnimation;
            gl.uniform3fv(thetaLoc, flatten(theta));
            endRotation = false;
            endRotation2 = true;
    
            if(theta[zAxis] >= 0){  
                scaling();        
                return;
            }
        }
        requestAnimationFrame(rotation);
    }
}

// *********************************************************************
//                           Scaling function
// *********************************************************************
function scaling(){

    if(start){
        if (s <= 3.0 && scaleStatus == false){   
            s += 0.1 * speedAnimation;
            gl.uniform1f(scale, s); 
        } 
        
        if(s > 3.0 || scaleStatus == true){
            s -= 0.1 * speedAnimation;
            gl.uniform1f(scale, s);
            scaleStatus = true;

            switch(menu.value){
                case '0':
                    if(s <= 0.5){
                        translation();
                        return;
                    }
                    break;
                
                case '1':
                    if(s <= 1.0){
                        translation();
                        return;
                    }
                    break;
    
                case '2':
                    if(s <= 1.5){
                        translation();
                        return;
                    }
                    break;
    
                case '3':
                    if(s <= 2.0){
                        translation();
                        return;
                    }
                    break;  
    
                case '4':
                    if(s <= 3.0){
                        translation();
                        return;
                    }
                    break;
            }
        }
    
        requestAnimationFrame(scaling);
    }
    
}

// *********************************************************************
//                        Translation function
// *********************************************************************
function translation(){
    
    if(start){

        switch(transMode){
            case 0:
                theta[0] -= 3.0 * speedAnimation;  // Rotate about x-axis while translating
                break;
            
            case 1:
                theta[1] -= 3.0 * speedAnimation;  // Rotate about y-axis while translating
                break;

            case 2:
                theta[2] -= 3.0 * speedAnimation;  // Rotate about z-axis while translating
                break;

            case 3:
                theta = [0, 0, 0];                 // Default mode (Does not rotate)
                break;  
        }
        gl.uniform3fv(thetaLoc, flatten(theta));

        // Update the translation position of the object
        trans[0] += xTranspeed * speedAnimation;
        trans[1] += yTranspeed * speedAnimation;
        gl.uniform3fv(transLoc, trans);

        // Reverse x-axis when any vertices hits left or right
        if(vertices.some(v => Math.abs(v[0] + trans[0] / s) > 0.96 / s)){
            xTranspeed = xTranspeed * -1;
            gl.uniform3fv(transLoc, trans);
        }
        
        // Reverse y-axis when any vertices hits top or bottom
        if(vertices.some(v => Math.abs(v[1] + trans[1] / s) > 0.96 / s)){
            yTranspeed = yTranspeed * -1;
            gl.uniform3fv(transLoc, trans);
        }

        requestAnimationFrame(translation);
    }
    
}

// *********************************************************************
//                    Convert Hex to RGB function
// *********************************************************************
function hexTorgb(hex) {

    let bigInt = parseInt(hex.substring(1), 16);
    let R = ((bigInt >> 16) & 255) / 255;
    let G = ((bigInt >> 8) & 255) / 255;
    let B = (bigInt & 255) / 255;
    return vec4(R, G, B, 1.0);
  }

function triangle( a, b, c, color )
{
    colors.push( baseColors[color] );
    points.push( a );
    colors.push( baseColors[color] );
    points.push( b );
    colors.push( baseColors[color] );
    points.push( c );
}

function tetra( a, b, c, d )
{
    // tetrahedron with each side using
    // a different color

    triangle( a, c, b, 0 );
    triangle( a, c, d, 1 );
    triangle( a, b, d, 2 );
    triangle( b, c, d, 3 );
}

function divideTetra( a, b, c, d, count )
{
    // check for end of recursion

    if ( count === 0 ) {
        tetra( a, b, c, d );
    }

    // find midpoints of sides
    // divide four smaller tetrahedra

    else {
        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var ad = mix( a, d, 0.5 );
        var bc = mix( b, c, 0.5 );
        var bd = mix( b, d, 0.5 );
        var cd = mix( c, d, 0.5 );

        --count;

        divideTetra(  a, ab, ac, ad, count );
        divideTetra( ab,  b, bc, bd, count );
        divideTetra( ac, bc,  c, cd, count );
        divideTetra( ad, bd, cd,  d, count );
    }
}