

var view = ( function () {

    'use strict';

    var isReady = false;
    var isClear = false;
    var isHero = false;
    var isHead = false;
    var isNeedDate = false;
    var isMouseDown = false;

    var params = {

        Speed: 1,

        background: false,
        sphere: false,
        
        // toneMapping
        exposure: 3.0,
        whitePoint: 5.0,
        tone: "Uncharted2",

        pixelRatio : 1,

    }

    var interval = null;


    var tmpShader = null;

    var materials = [ null, null, null, null, null ];
    var buffers_1  = [ null, null, null, null, null ];
    var buffers_2  = [ null, null, null, null, null ];

    var tmp_txt = [];

    var currentScene = -1;

    var degtorad = 0.0174532925199432957;
    var radtodeg = 57.295779513082320876;

    var gl, canvas, renderer, gputmp, scene, camera, controls, light;//, clock;
    var vsize, mouse, key = new Float32Array( 20 );

    var time = 0;
    var date = null;

    var vs = { w:1, h:1, l:0, x:0 , y:0, r:0};


    var txt = {};
    var txt_name = [];
    var cube_name = [];

    var lights = [];

    var geo = {};

    var dummyTexture;

    var extraUpdate = [];
    var toneMappings;

    var isWebGL2 = false;
    //var isMobile = false;
    var isLoaded = false;
    var isError = false;

    var mesh, mesh2;

    var tmp_buffer = [];
    var common = '';

    var hero, head, bone, heroMat;

    var precision = 'highp';


    view = {

        isMobile: false,

        render: function () {

            var i, name, over, delta;

            requestAnimationFrame( view.render );

            i = extraUpdate.length;
            while(i--) extraUpdate[i]();

            key = user.getKey();

            delta = params.Speed * 0.01;
            time += delta;

            if( isNeedDate ) view.upDate();

            if(isHero) THREE.SEA3D.AnimationHandler.update( delta/2 );


            /*if(isClear) { 

                gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
                isClear = false; 
            }*/

            //console.log(clock.getDelta())

            //i = materials.length;
            for( i = 0; i < 5; i ++ ){

                if( materials[i] !== null ){

                    if( i !== 0 || isHero ){ 

                        name = materials[i].name;
                        over = materials[i].overdraw;

                        

                        /*var ch = materials[i].channels;
                        var j = 4;
                        while(j--){
                            if(ch[j].name === name) materials[i].uniforms['iChannel'+j].value = dummyTexture.texture;
                        }*/
                        

                        //txt[ name ] = dummyTexture.texture;;
                        gputmp.render( materials[i], buffers_1[i] );
                        //gputmp.render( materials[i], buffers_1[i] );
                        if( over ) gputmp.renderTexture( buffers_1[i].texture, buffers_2[i] );//, buffers_1[i].width, buffers_1[i].height );
                        
                        //txt[ name ] = buffers_1[i].texture;

                        materials[i].uniforms.iFrame.value ++;
                        materials[i].uniforms.iTimeDelta.value = delta;


                        //materials[i].uniforms.iFrame.value ++;
                        //materials[i].uniforms.iTimeDelta.value = delta;
                        
                    }

                    materials[i].uniforms.iTime.value = time;
                    materials[i].uniforms.iGlobalTime.value = time;

                }

            }

             
            renderer.render( scene, camera );

            
            
        },

        resize: function () {

            if(!isReady) return;

            vsize.x = window.innerWidth - vs.x - vs.y;
            vsize.y = window.innerHeight;
            vsize.z = vsize.x / vsize.y;
            camera.aspect = vsize.z;
            camera.updateProjectionMatrix();
            renderer.setSize( vsize.x, vsize.y );

            canvas.style.left = vs.x +'px';

            if( currentScene === 0 ){ 
                // 1 is distance from camera
                var h = 2 * Math.tan( (camera.fov * degtorad) * 0.5 ) * 1;
                mesh.scale.set(h*vsize.z, h, 1);

            }

            for(var i = 1; i < 5; i++){
                if(materials[i] !== null){
                    if( buffers_1[i].isFull ){
                        buffers_1[i].setSize( vsize.x, vsize.y );
                        if( materials[i].overdraw ) buffers_2[i].setSize( vsize.x, vsize.y );
                        materials[i].uniforms.iFrame.value = 0;
                    }            
                }
                
            }

            editor.resizeMenu( vsize.x );

        },

        

        testMobile: function () {

            var n = navigator.userAgent;
            if (n.match(/Android/i) || n.match(/webOS/i) || n.match(/iPhone/i) || n.match(/iPad/i) || n.match(/iPod/i) || n.match(/BlackBerry/i) || n.match(/Windows Phone/i)) view.isMobile = true;
            else view.isMobile = false;  

        },

        getWebGL: function ( force ) {

            // WebGLExtensions
            // 

            //var canvas = document.createElement("canvas");
            //canvas.style.cssText = 'position: absolute; top:0; left:0; width:100%; height:100%;'//pointer-events:auto;

            isWebGL2 = false;

            var options = { 
                antialias: view.isMobile ? false : true, 
                alpha: view.isMobile ? false : true, 
                stencil:false, depth:true, precision:"highp", premultipliedAlpha:false, preserveDrawingBuffer:false 
            }

            if( !force ){

                gl = canvas.getContext( 'webgl2', options );
                if (!gl) gl = canvas.getContext( 'experimental-webgl2', options );
                isWebGL2 = !!gl;

            }

            if(!isWebGL2) {
                gl = canvas.getContext( 'webgl', options );
                if (!gl) gl = canvas.getContext( 'experimental-webgl', options );
            }

            options.canvas = canvas;
            options.context = gl;
            //version = isWebGL2 ? 'GL2':'GL1';

            view.isGL2 = isWebGL2;

            if(isWebGL2){ 
                gl.v2 = true;

                //var bf = gl.getExtension('EXT_color_buffer_float');
                //var fa = gl.getExtension('EXT_texture_filter_anisotropic');

                if (!gl.getExtension("EXT_color_buffer_float")) console.error("FLOAT color buffer not available");
                if (!gl.getExtension("EXT_texture_filter_anisotropic")) console.error("anisotropic filter not available");

                
            }


            return options;

        },

        init: function ( forceGL1 ) {

            view.testMobile();

            //precision = isMobile ? 'lowp' : 'mediump';

            toneMappings = {
                None: THREE.NoToneMapping,
                Linear: THREE.LinearToneMapping,
                Reinhard: THREE.ReinhardToneMapping,
                Uncharted2: THREE.Uncharted2ToneMapping,
                Cineon: THREE.CineonToneMapping
            };

            vsize = new THREE.Vector3( window.innerWidth, window.innerHeight, 0);
            vsize.z = vsize.x / vsize.y;

            mouse = new THREE.Vector4();
            date = new THREE.Vector4();
            this.upDate(true);

            

            var drawBuffer = false;

            ///////////



            canvas = document.createElement("canvas");
            canvas.className = 'canvas3d';
            canvas.oncontextmenu = function(e){ e.preventDefault(); };
            canvas.ondrop = function(e) { e.preventDefault(); };
            //document.body.appendChild( canvas );
            document.body.insertBefore( canvas, document.body.childNodes[0] );

            isWebGL2 = false;

            var options = { antialias: false, alpha:false, stencil:false, depth:true, precision:precision, preserveDrawingBuffer:drawBuffer }

            // Try creating a WebGL 2 context first
            /*gl = canvas.getContext( 'webgl2', options );
            if (!gl) {
                gl = canvas.getContext( 'experimental-webgl2', options );
            }
            isWebGL2 = !!gl;

            if(!isWebGL2) {
                gl = canvas.getContext( 'webgl', options );
                if (!gl) gl = canvas.getContext( 'experimental-webgl', options );
            }

            console.log('Webgl 2 is ' + isWebGL2 );*/


            //renderer = new THREE.WebGLRenderer({ canvas:canvas, context:gl, antialias:false, alpha:false, precision:precision, preserveDrawingBuffer:drawBuffer, stencil:false  });
            renderer = new THREE.WebGLRenderer( view.getWebGL( forceGL1 ) );
            //renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:false, alpha:false, preserveDrawingBuffer:true, precision:precision });
            renderer.setPixelRatio( params.pixelRatio );
            renderer.setSize( vsize.x, vsize.y );
            renderer.setClearColor( 0x1e1e1e, 1 );

            renderer.gl2 = isWebGL2;

            //console.log(renderer.getPrecision())



            //

            renderer.gammaInput = true;
            renderer.gammaOutput = true;

            //renderer.autoClear = false;
            //renderer.sortObjects = false;
            renderer.autoClearColor = drawBuffer ? false : true;
            //renderer.autoClearStencil = false;

            //gl = renderer.getContext();

            //

            scene = new THREE.Scene();
            scene.matrixAutoUpdate = false;

            camera = new THREE.PerspectiveCamera( 45, vsize.z, 0.1, 5000 );
            camera.position.set(0,0,10);
            scene.add(camera);

            controls = new THREE.OrbitControls( camera, canvas );
            controls.target.set(0,0,0);
            controls.enableKeys = false;
            controls.update();


            window.addEventListener( 'resize', view.resize, false ); 
           // window.addEventListener( 'error', function(e, url, line){  editor.setTitle('Error'); }, false );

            //window.onerror = function(e, url, line){  editor.setTitle('Error'); };

            renderer.domElement.addEventListener( 'mousemove', view.move, false );
            renderer.domElement.addEventListener( 'mousedown', view.down, false );
            renderer.domElement.addEventListener( 'mouseup', view.up, false );
            //renderer.domElement.addEventListener( 'mousewheel', view.wheel, false );

            //renderer.domElement.addEventListener( 'drop', function(e){ e.preventDefault(); return false; }, false );  
            renderer.domElement.addEventListener( 'dragover', function(e){ e.preventDefault(); return false; }, false );


            dummyTexture = view.addRenderTarget( 1, 1, false );

            gputmp = new view.GpuSide();


            this.setTone();
            this.render();

            isReady = true;

            this.resize();
            this.loadAssets();
            
        },

        upDate : function( full ) {

            var d = new Date();
            if(full){
                date.x = d.getFullYear();
                date.y = d.getMonth();
                date.z = d.getDate();
            }
            
            date.w = (d.getHours() * 3600) + (d.getMinutes() * 60) + d.getSeconds();

        },



        setTone : function(v) {

            var nup = false;

            if(v!==undefined){ 
                params.tone = v;
                nup = true;
            }

            renderer.toneMapping = toneMappings[ params.tone ];
            renderer.toneMappingExposure = params.exposure;
            renderer.toneMappingWhitePoint = params.whitePoint;

            if( materials[0] && nup ) materials[0].needsUpdate = true;


        },

        setQuality: function ( v ) {

            params.pixelRatio = v;
            renderer.setPixelRatio( params.pixelRatio );

        },

        //

        move: function ( e ) {
            if( isHead ){
                var x = ((e.clientX - vs.x) / vsize.x ) * 2 - 1;
                var y = - ( e.clientY / vsize.y ) * 2 + 1;


                bone.rotation.x = (-x*36)*degtorad;
                bone.rotation.y = (-y*25)*degtorad;

                //console.log(x, y)


            }
            if( isMouseDown ){
                mouse.x = (e.clientX - vs.x);
                mouse.y =  (vsize.y - e.clientY);

                //mouse.x = mouse.z;
                //mouse.y = mouse.w;
            }
            
        },

        down: function ( e ) {
            mouse.x = (e.clientX - vs.x);
            mouse.y =  (vsize.y - e.clientY);

            mouse.z = mouse.x;
            mouse.w = mouse.y;
            isMouseDown = true;



           // mouse.x = (e.clientX - vs.x);
           // mouse.y =  (vsize.y - e.clientY);
          //  mouse.z = 1;
            
        },

        up: function () {
            isMouseDown = false;
            mouse.z = -Math.abs( mouse.z );
            mouse.w = -Math.abs( mouse.w );
            //mouse.z = 0;
        },

        wheel : function( e ){

            e.preventDefault();
            var delta = 0;
            if(e.wheelDeltaY) delta = -e.wheelDeltaY*0.04;
            else if(e.wheelDelta) delta = -e.wheelDelta*0.2;
            else if(e.detail) delta = e.detail*4.0;

            //mouse.w = delta;

        },

        //

        setLeft: function ( x, y ) { 
            vs.x = x; 
            vs.y = y;
        },

        needFocus: function () {
            canvas.addEventListener('mouseover', editor.unFocus, false );
        },

        haveFocus: function () {
            canvas.removeEventListener('mouseover', editor.unFocus, false );
        },

        // -----------------------
        //  LOADING SIDE
        // -----------------------

        loadAssets : function ( EnvName ) {

            //envName = envName || 'grey1'

            cube_name = [ 'grey1' ];

            txt_name = [ 'stone', 'bump', 'tex06', 'tex18', 'tex07', 'tex03', 'tex09', 'tex00', 'tex08', 'tex01', 'tex05', 'tex02', 'tex12', 'tex10', 'tex17' ];

            pool.load( [ 'models/hero.sea', 'models/head.sea', 'textures/basic.png', 'textures/noise.png' ], view.initModel );

        },

        loadAssetsPlus : function ( EnvName ) {

            var urls = [];

            editor.setMessage( 'load' );
            
            var i = txt_name.length;
            while(i--) urls.push('textures/'+txt_name[i]+'.png');

            i = cube_name.length;
            while( i-- ) urls.push('textures/cube/'+cube_name[i]+'.cube');

            pool.load( urls, view.endLoading );

        },

        endLoading: function() {

            isLoaded = true;

            if(!isError) editor.setMessage( 'gl' + (isWebGL2 ? '2' : '1'));
            else editor.setMessage('error');

            var p = pool.getResult();

            // init textures

            var i = txt_name.length, tx, j, name;
            while(i--){

                name = txt_name[i];
                tx = new THREE.Texture( p[name] );
                tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
                if( name === 'tex10'|| name === 'tex12') tx.flipY = false;
                else tx.flipY = true;
                //tx.minFilter = THREE.LinearFilter;
                tx.needsUpdate = true;
                txt[name] = tx;

            }

            i = cube_name.length;
            while(i--){
                name = cube_name[i];
                txt[name] = p[name];
            }

            // apply texture after final load
            i = materials.length;
            while(i--){
                view.pushChannel(i);
            }

        },

        // -----------------------
        //  VIEW RESET
        // -----------------------

        reset: function ( ) {

            var i, name, over;

            //console.clear();

            for( i = 1; i < 5; i++ ){

                if(materials[i] !== null ){

                    name = materials[i].name;
                    over = materials[i].overdraw;

                    if( txt[ name ] ){ 
                        txt[ name ].dispose();
                        txt[ name ] = null;
                    }

                    materials[i].dispose();
                    buffers_1[i].dispose();

                    materials[i] = null;
                    buffers_1[i] = null;

                    if( over ){ 
                        buffers_2[i].dispose();
                        buffers_2[i] = null;
                    }
                    
                }

            }

            time = 0;
            isNeedDate = false;

            tmp_buffer = [];

            //isClear = true;

            //console.log('view reset');

        },

        // -----------------------
        //  FRAGMENT
        // -----------------------

        setCommon: function ( frag ) {

            common = frag;

        },

        getCommon: function () {

            return common;

        },

        applyFragment : function( frag, n ) {

            if( n === 0 ){ 
                var name = editor.getCurrent();
                materials[0].name = name;
                if(name === 'number' || name === 'iceworld') isNeedDate = true;
                editor.setTitle();
            }

            if( n < 5 ) view.validate( materials[n].completeFragment( frag ), n );

            //  common setting for shader
            else {

                this.setCommon( frag );

                for( var i = 0; i < 5; i++ ){
                    if( materials[i] ) materials[i].updateCommon();// = frag; //console.log( materials[i].name )
                    //isNeedDate = true;
                }
                //console.log( materials.length )
            }
            

        },

        pushChannel : function ( ) {

            var n, i, name, buff, channel, size;

            var edName = editor.getCurrent();

            for( n = 0; n < 5; n ++ ){

                if( materials[n] !== null ){

                    if( materials[n].commonName && !common ) editor.load( materials[n].commonName );

                    channel = materials[n].channels;

                    if( materials[n].name === edName ) editor.upChannelPad( channel );

                    if( channel.length === 4 ){

                        for( i = 0; i < 4; i++ ){

                            name = channel[i].name;
                            buff = channel[i].buffer;

                            if(buff){

                                size = channel[i].size;
                                if(size === "FULL") materials[n].setChannelResolution( i, vsize.x, vsize.y );
                                else materials[n].setChannelResolution( i, Number( size ), Number( size ) );


                                if( tmp_buffer.indexOf(name) === -1 ) {

                                    editor.load( name, channel[i].size ); 
                                    tmp_buffer.push( name );

                                }
                                
                            }
                                
                            if( name && txt[name] ){ 

                                materials[n].uniforms['iChannel'+i].value = txt[name];
                                //materials[n].channelRes[i].x = 128;
                                //materials[n].channelRes[i].y = 128;
                            }
                        }
                        
                    }
                }
            }



        },

        addBuffer : function ( frag, n, name, size ){

            //console.log( n, name, size );

            var isFull = size === "FULL" ? true : false;

            var w = isFull ? vsize.x : Number( size ); 
            var h = isFull ? vsize.y : Number( size );
            //if(size !== "FULL") w = h = Number( size );
            //var d = w / h;

            materials[n] = new THREE.Shadertoy( frag, false, isFull );
            materials[n].uniforms.iResolution.value = vsize;///new THREE.Vector3( w, h, d );
            materials[n].uniforms.iMouse.value = mouse;
            materials[n].uniforms.iDate.value = date;
            materials[n].uniforms.key.value = key;

            materials[n].name = name;

            // find if texture is same than target
            var overdraw = false;
            var ch = materials[n].channels;
            var j = 4;
            while(j--){
                if(ch[j].name === name) overdraw = true;
            }

            materials[n].overdraw = overdraw;

            //console.log( materials[n].overdraw )

            buffers_1[n] = view.addRenderTarget( w, h, isFull );
            

            if( !overdraw ){ 
                txt[ name ] = buffers_1[n].texture;
            } else {
                buffers_2[n] = buffers_1[n].clone();//view.addRenderTarget( w, h, isFull );
                txt[ name ] = buffers_2[n].texture;
            }


            view.pushChannel( n );

        },

        addRenderTarget : function ( w, h, full ) {

            //console.log(w, h)

            full = full || false;

            var min = THREE.NearestFilter;
            var max = THREE.NearestFilter;
            var wt = THREE.ClampToEdgeWrapping;
            var ws = THREE.ClampToEdgeWrapping;

            var format = THREE.RGBAFormat;
            var intern = isWebGL2 ? THREE.RGBA32Format : THREE.RGBAFormat;

            //var type = isWebGL2 ? THREE.UnsignedByteType : THREE.FloatType;
            var type = THREE.FloatType;

          // var r = new THREE.WebGLRenderTarget( w, h, { minFilter: min, magFilter: max, type: THREE.FloatType, stencilBuffer: false, depthBuffer :false, format: THREE.RGBAFormat, wrapT:wt, wrapS:ws });
            var r = new THREE.WebGLRenderTarget( w, h, { minFilter: min, magFilter: max, type: type, format: format, intern: intern, stencilBuffer: false, depthBuffer :false, wrapT:wt, wrapS:ws, anisotropy:0, generateMipmaps:false });
         
            r.isFull = full || false;
            return r;

        },

        addTexture : function( w, h ) {

            w = w || vsize.x;
            h = h || vsize.y;

            //var type = isWebGL2 ? THREE.UnsignedByteType : THREE.FloatType;
            //var type = THREE.FloatType;
            var type = THREE.UnsignedByteType;

            var a = new Float32Array( w * h * 4 );
            var texture = new THREE.DataTexture( a, w, h, THREE.RGBAFormat, type );
            //var texture = new THREE.DataTexture( a, w, h, THREE.RGBAFormat, gl.FLOAT );
            texture.needsUpdate = true;

            //console.log(texture)

            return texture;

        },

    

        addMaterial : function ( n ){

            materials[n] = new THREE.Shadertoy();
            materials[n].uniforms.iResolution.value = vsize;
            materials[n].uniforms.iMouse.value = mouse;
            materials[n].uniforms.iDate.value = date;
            materials[n].uniforms.key.value = key;
            materials[n].overdraw = false;

        },

        // -----------------------
        //  EDITOR VALIDATE FRAG
        // -----------------------

        validate : function ( frag, n ) {

            var details, error, i, line, lines, log, message, status, _i, _len;
            var data = [];//{lineNumber:0, message:''}];

            var baseVar = [
                'precision '+precision+' float;',
                'precision '+precision+' int;',
                'uniform mat4 viewMatrix;',
                'uniform vec3 cameraPosition;',
            ].join('\n');

            var string = baseVar + frag;

            if(isWebGL2){
                string = '#version 300 es\n' + string;
                string = string.replace('uniform vec3 cameraPosition;', "uniform vec3 cameraPosition;\nout vec4 FragColor_gl;\n");
                string = string.replace('#extension GL_OES_standard_derivatives : enable', "");
                string = string.replace('#extension GL_EXT_shader_texture_lod : enable', "");
                string = string.replace(/varying /g, "in ");
                string = string.replace(/transpose/g, "transposition");
                string = string.replace(/gl_FragColor/g, "FragColor_gl");
                string = string.replace(/texture2D/g, "texture");
                string = string.replace(/textureCube/g, "texture");
            }

            try {

                tmpShader = gl.createShader( gl.FRAGMENT_SHADER );
                gl.shaderSource( tmpShader, string );
                gl.compileShader( tmpShader );
                status = gl.getShaderParameter( tmpShader, gl.COMPILE_STATUS );

            } catch ( e ) {

                data.push( { lineNumber:0, message:e.getMessage } );

            }

            isError = status ? false : true;

            if ( isError ) {

                log = gl.getShaderInfoLog( tmpShader );
                lines = log.split('\n');
                for (_i = 0, _len = lines.length; _i < _len; _i++) {
                    i = lines[_i];
                    if (i.substr(0, 5) === 'ERROR') { error = i; }
                }

                if ( !error ) data.push( {lineNumber:0, message:'Unable to parse error.'} );
            
                details = error.split(':');
                if ( details.length < 4 ) data.push( {lineNumber:0, message:error } );

                line = details[2];
                message = details.splice(3).join(':');
                data.push( { lineNumber:parseInt( line )-11, message:message } );

            }

            gl.deleteShader( tmpShader );
            tmpShader = null;

            editor.validate( data );

            if( isError ){ 

                if( isLoaded ) editor.setMessage( 'error' );

            } else {

                materials[n].updateFragment( frag );

                view.pushChannel( n );

                if( isLoaded ){ 
                    editor.setMessage( 'gl' + (isWebGL2 ? '2' : '1'));
                    //view.pushChannel( n );
                }

            }

        },

        // -----------------------
        //  BASIC SCENE
        // -----------------------

        initModel : function () {

            var p = pool.getResult();

            hero = p['hero'][0];
            head = p['head'][0];

            //console.log(hero, head)
        
            // init base textures

            var tx = new THREE.Texture( p['basic'] );
            tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
            tx.needsUpdate = true;
            txt['basic'] = tx;

            tx = new THREE.Texture( p['noise'] );
            tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
            tx.flipY = false;
            tx.needsUpdate = true;
            txt['noise'] = tx;

            view.addMaterial( 0 );

            view.setScene( 0 );

            ready();

            view.loadAssetsPlus();

        },

        // -----------------------
        //  SCENE SWITCH
        // -----------------------

        resetCamera : function(){

            camera.position.set(0,0,10);
            controls.target.set(0,0,0);
            controls.enableKeys = false;
            controls.enableZoom = false;
            controls.enableRotate = false;
            controls.update();

        },

        setScene : function( n ){

            view.resetCamera();

            if(buffers_1[0]!==null){
                buffers_1[0].dispose();
                buffers_1[0] = null;

                heroMat.dispose();
                view.removeLight();
                
            }

            isHero = false;
            isHead = false;

            var g;

            if(mesh !== null){
                if(currentScene === 0 ) camera.remove( mesh );
                else scene.remove( mesh );
            }

            if( n === 0 ){

                g = new THREE.PlaneBufferGeometry( 1, 1, 1, 1 );
                mesh = new THREE.Mesh( g, materials[0] );
     
                var mh = 2 * Math.tan( (camera.fov * degtorad) * 0.5 ) * 1;
                mesh.scale.set(mh*vsize.z, mh, 1);
                mesh.position.set(0,0,-1);

                camera.add( mesh );

            }

            if( n === 1 ){

                g = new THREE.SphereBufferGeometry(3, 30, 26, 30*degtorad, 120*degtorad, 45*degtorad, 90*degtorad );
                mesh = new THREE.Mesh( g, materials[0] );
                scene.add( mesh );

                controls.enableRotate = true;

            }

            if( n === 2 ){

                view.addLight();

                isHero = true;

                buffers_1[0] = view.addRenderTarget( 512, 512, false );

                //g = new THREE.TorusBufferGeometry( 3, 1, 50, 20 );
               // materials[0].skinning = true;
               //materials[0].morphTargets = true;

                mesh = hero;//new THREE.SEA3D.SkinnedMesh( hero.geometry, materials[0], false );//new THREE.Mesh( g, materials[0] );
                //mesh.material = new THREE.MeshBasicMater;

                heroMat = new THREE.MeshPhongMaterial({map:buffers_1[0].texture, skinning:true, morphTargets:true, shininess:60 })
                mesh.material = heroMat;
                //mesh.material.map.flipY = false;

                mesh.scale.set(0.04,0.04,0.04);
                mesh.position.set(0,0,0);
                //
                //mesh = new THREE.Mesh( hero.geometry, materials[0] );
                scene.add( mesh );

                mesh.play( 'walk' );

                controls.enableRotate = true;

            }

            if( n === 3 ){

                view.addLight();
                
                isHero = true;
                isHead = true;

                buffers_1[0] = view.addRenderTarget( 512, 512, false );
                buffers_1[0].texture.flipY = false;

                //g = new THREE.TorusBufferGeometry( 3, 1, 50, 20 );
               // materials[0].skinning = true;
               //materials[0].morphTargets = true;

                mesh = head;//new THREE.SEA3D.SkinnedMesh( hero.geometry, materials[0], false );//new THREE.Mesh( g, materials[0] );
                //mesh.material = new THREE.MeshBasicMater;

                //heroMat = new THREE.MeshLambertMaterial({map:buffers_1[0].texture, skinning:true, morphTargets:true });
                heroMat = new THREE.MeshPhongMaterial({ map:buffers_1[0].texture, skinning:true, shininess:10})//map:buffers_1[0].texture, skinning:true, morphTargets:true, shininess:10 })
                /* heroMat.onBeforeCompile = function ( shader ) {

                    //name = shader.name;
                    var uniforms = shader.uniforms;
                    var vertex = shader.vertexShader;
                   var fragment = shader.fragmentShader;
                   fragment = fragment.replace(/texture2D/g, "texture");
                   shader.vertexShader = vertex;
                   shader.fragmentShader = fragment;

           // console.log(shader.fragmentShader)

           // return shader;

                 }*/
                mesh.material = heroMat;
                

                mesh.scale.set(0.16,0.16,0.16);
                mesh.position.set(0,-2,0);
                //
                //mesh = new THREE.Mesh( hero.geometry, materials[0] );
                scene.add( mesh );

               

                bone = mesh.skeleton.bones[1];

                //mesh.play( 'walk' );

            }

            currentScene = n;

        },

        removeLight : function () {

            var i = lights.length;
            while(i--){
                scene.remove(lights[i]);
            }

        },

        addLight : function () {

            lights[0] = new THREE.AmbientLight( 0x030303 );

            lights[1] = new THREE.SpotLight( 0xFFFFFF, 2, 600 );
            lights[1].position.set(-3,7,10).multiplyScalar( 10 );
            lights[1].lookAt(new THREE.Vector3(0,0,0));

            lights[2] = new THREE.PointLight( 0xFFFFFF, 1, 600);
            lights[2].position.set( 3, 5, -5 ).multiplyScalar( 10 );

            lights[3] = new THREE.PointLight( 0x8888FF, 1, 600);
            lights[3].position.set( -6,-10,-10 ).multiplyScalar( 10 );

            var i = lights.length;
            while(i--){
                scene.add(lights[i]);
            }

        },

        setBackground: function(){

            if( params.background ) scene.background = textureCube;
            else scene.background = null;

        },


        // -----------------------
        //  GET FUNCTION
        // -----------------------

        getMouse: function () { return mouse; },

        getKey: function () { return key; },

        getContext: function () { return gl; },

        getParams: function () { return params; },

        getPixel: function ( texture, x, y, w, h ) { 

            w = w || 1;
            h = h || 1;
            var read = new Float32Array( 4 * (w * h) );
            if (isWebGL2){
                var rgb = 0.003921569;
                var read2 = new Uint8Array( 4 * (w * h) );
                renderer.readRenderTargetPixels( texture, x || 0, y || 0, w, h, read2 );
                var i = read2.length;
                while(i--) read[i] = read2[i] * rgb;
            }
            else { 
                renderer.readRenderTargetPixels( texture, x || 0, y || 0, w, h, read ); 
            }
            return read;
            
        },

        getBgColor: function(){ return renderer.getClearColor(); },

        getRenderer: function(){ return renderer; },

        getDom: function () { return renderer.domElement; },

        getCamera: function () { return camera; },

        getScene: function () { return scene; },

        getControls: function () { return controls; },

        // -----------------------
        //  BASIC FUNCTION
        // -----------------------

        add: function ( mesh ) { scene.add( mesh ); },
        remove: function ( mesh ) { scene.remove( mesh ); },

        initGeometry: function(){

            geo = {};

            geo[ 'box' ] =  new THREE.BoxBufferGeometry( 1, 1, 1 );
            geo[ 'sphere' ] = new THREE.SphereBufferGeometry( 1, 12, 10 );
            geo[ 'cylinder' ] =  new THREE.CylinderBufferGeometry( 1, 1, 1, 12, 1 );
            //geo[ 'capsule' ] =  new THREE.CapsuleBufferGeometry( 1, 1, 12, 1 );

        },

        

        addUpdate: function ( fun ) {

            extraUpdate.push( fun );

        },


        
        // -----------------------
        //  MATH FUNCTION
        // -----------------------

        toRad: function ( r ) {

            var i = r.length;
            while(i--) r[i] *= degtorad;
            return r;

        },

        lerp: function ( a, b, percent ) { return a + (b - a) * percent; },
        randRange: function ( min, max ) { return view.lerp( min, max, Math.random()); },
        randRangeInt: function ( min, max, n ) { return view.lerp( min, max, Math.random()).toFixed(n || 0)*1; },

    }

    // ------------------------------
    //   GPU RENDER
    // ------------------------------

    view.GpuSide = function(){

        this.renderer = view.getRenderer();
        this.gl = this.renderer.getContext();
        this.v2 = this.gl.v2;

        //console.log('is Gl2', this.v2)
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        this.camera.position.z = 1;

        this.baseMat = new THREE.MeshBasicMaterial({ color:0x00FFFF });
        this.mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ) , this.baseMat );
        
        this.scene.add( this.mesh );

        this.passThruUniforms = { map: { value: null } };//, resolution: { value: new THREE.Vector2(128,128) } };
        this.passThruShader = new THREE.ShaderMaterial( {
            uniforms: this.passThruUniforms,
            vertexShader: [
                'varying vec2 vUv;',
                'void main() {',
                '    vUv = uv;',
                '    gl_Position = vec4( position, 1.0 );', 
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform sampler2D map;',
                'varying vec2 vUv;',
                'void main() {',
                    'gl_FragColor = texture2D( map, vUv );', 
                '}'
            ].join('\n')
        }); 

    };

    view.GpuSide.prototype = {

        render : function ( mat, output ) {

            this.mesh.material = mat;
            this.renderer.render( this.scene, this.camera, output, true );
            //this.mesh.material = this.passThruShader;

        },

        /*addResolutionDefine:function ( materialShader ) {

            materialShader.defines.resolution = 'vec2( ' + sizeX.toFixed( 1 ) + ', ' + sizeY.toFixed( 1 ) + " )";

        },*/

        renderTexture : function ( input, output ) {

            //this.passThruUniforms.resolution.value.x = w;
           // this.passThruUniforms.resolution.value.y = h;
            
            this.passThruUniforms.map.value = input;
            this.render( this.passThruShader, output );
            //this.passThruUniforms.texture.value = null;

        }
    }


    return view;

})();



