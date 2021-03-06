const CreateGame = (opts) => {
    let options = opts || {},
        boards = [],
        dt = 0,
        last = 0,
        fpsMeter = null,
        state = {}
    if (options.debug){
        fpsMeter = new FPSMeter({
            graph: 1,
            heat: 1,
            theme: "dark",
            interval: 50
        })  
    }
    const DEBUG_MODE = options.debug || false
    const KEY_CODES = {
        13:"enter",
        32:"space", 
        37:"left", 
        38:"up", 
        39:"right", 
        40:"down",
        80:"p",
        81:"q",
        88:"x",
        90:"z",
    }
    const STEP = 1 / 60
    const slowMoFactor = 1
    const timestamp = () => {
        return window.performance && 
            window.performance.now ? 
            window.performance.now() : 
            new Date().getTime()
    }
    const setupInput = () => {
        state.keys = state.keys || {}
        window.addEventListener('keydown', function (e) {
            // console.log(e.keyCode)
            if (KEY_CODES[e.keyCode]) {
                state.keys[KEY_CODES[e.keyCode]] = true
                e.preventDefault()
            }
        }, false)
        window.addEventListener('keyup', function (e) {
            if (KEY_CODES[e.keyCode]) {
                state.keys[KEY_CODES[e.keyCode]] = false
                e.preventDefault()
            }
        }, false)
        state.canvas.onmousedown = function (evt) {
            // console.log("mouse down")
            // console.log("canvas x: " + evt.layerX)
            // console.log("canvas y: " + evt.layerY)
        }
        state.canvas.onmouseup = function (evt) {}
        // state.canvas.ontouchstart = function (evt) {}
        // state.canvas.ontouchend = function (evt) {}
    }
    const loop = () => {
        if (options.debug)
            fpsMeter.tick()
        let now = timestamp()
        dt += Math.min(1, (now - last) / 1000)
        if (state.keys["p"] && !state.pDown){
            this.pause = !this.pause
            state.pDown = true
        } else if (!state.keys["p"] && state.pDown){
            state.pDown = false
        }
        if (this.pause)
            dt = 0

        while(dt > STEP) {
            dt -= STEP
            update(STEP / state.sloMoFactor)
        }
        draw()
        last = now
        requestAnimationFrame(loop)
    }
    const update = (step) => { 
        boards.forEach((b) => {
            if(b){ b.step(step) }
        })
    }
    const draw = () => { 
        state.renderer.cls()
        boards.forEach((b) => {
            if (b) { b.draw(state.gl) }
        })
        state.renderer.flush()
    }
    state = {
        gameOver: false,
        sloMoFactor: 1,
        gameScore: 0,
        score: (amount) => {
            state.gameScore += amount
        },
        initialize: (canvasElementId, callback) => {
            state.canvas = document.getElementById(canvasElementId);

            state.playerOffset = 10
            state.canvasMultiplier = 1
            state.setupMobile()

            state.maxX = state.canvas.width
            state.minX = 0
            state.maxY = state.canvas.height
            state.minY = 0

            state.width = state.canvas.width
            state.height = state.canvas.height

            state.renderer = TS(state.canvas)
            state.gl = state.renderer.g

            setupInput()
            last = timestamp()
            loop()

            if (typeof callback === "function")
                callback()
        },
        setBoard: (num, board) => {
            boards[num] = board
        },
        removeBoard: (num) => {
            if (boards[num])
                boards[num] = null
        },
        debug: () => {
            console.log(boards)
        },
        setupMobile: () => {
            const container = document.getElementById("container"),
                  hasTouch = !!('ontouchstart' in window)
            let w = window.innerWidth
            let h = window.innerHeight
            // check if touch available
            if (hasTouch) { state.mobile = true; }
            // if not, or screen too big -> not mobile
            if (screen.width >= 1280 || !hasTouch) { return false; }
            // add touch controls
            state.keys = state.keys || {}
            state.keys.touchDX = 0
            state.keys.touchDY = 0
            // if screen is landscape, ask to rotate
            if (w > h) {
                alert("Please rotate the device and then click OK")
                w = window.innerWidth
                h = window.innerHeight
            }
            // set container to double height
            // (not totally sure why)
            container.style.height = h * 2 + "px"
            // scroll window to left and top minus 1 pixel
            window.scrollTo(0, 1)
            // set container to window height
            h = window.innerHeight + 2
            container.style.height = h + "px"
            container.style.width = w + "px"
            container.style.padding = 0

            // in case window.innerHeight is quite big
            // halve the resolution
            if (h >= state.canvas.height * 1.75 || w >= state.canvas.height * 1.75) {
                state.canvasMultiplier = 2
                state.canvas.width = w / 2
                state.canvas.height = h / 2
                state.canvas.style.width = w + "px"
                state.canvas.style.height = h + "px"
            } else {
                state.canvas.width = w
                state.canvas.height = h
            }
            // set canvas to absolute positioning
            state.canvas.style.position = 'absolute'
            state.canvas.style.left = "0px"
            state.canvas.style.top = "0px"
        }
    }
    return Object.assign(state)
}

const CreateSpriteSheet = (filePath) => {
    let state = { map: {} }

    state = {
        load: (spriteData, renderer, callback) => {
            state.map = spriteData
            state.renderer = renderer
            let image = new Image()
            image.onload = () => {
                state.texture = TCTex(
                    state.renderer.g, 
                    image,
                    image.width,
                    image.height
                )
                if (typeof callback === "function")
                    callback()
            }
            image.src = filePath || "img/cats.png"
        },
        draw: (sprite, x, y, scale, tint, center) => {
            scale = scale || 1
            tint = tint || false
            const frame = state.map[sprite],
                tex = state.texture,
                u0 = frame.sx / tex.width,
                v0 = frame.sy / tex.height,
                u1 = u0 + (frame.w / tex.width),
                v1 = v0 + (frame.h / tex.height)
            const colCache = state.renderer.col
            let centerX = 0
            let centerY = 0
            if (center) {
                centerX = -frame.w/2
                centerY = -frame.h/2
            }
            if (tint)
                state.renderer.col = tint
            state.renderer.img(
                tex,
                centerX,       // initial rendering 
                centerY,       // location before translation
                frame.w, 
                frame.h,
                0,                  // rotation
                x, y,               // translation
                scale,scale,        // scale (x, y)
                u0,                 // These values are x, y, w, h
                v0,                 // for the texture normalized
                u1,                 // to [0-1]
                v1                  // I hope that makes sense
            )
            state.renderer.col = colCache
        },
        drawVerbose: (x, y, scaleX, scaleY, tint, centerX, centerY, rot, u0, v0, u1, v1) => {

            const colCache = state.renderer.col
            if (tint)
                state.renderer.col = tint
            state.renderer.img(
                state.texture,
                centerX,       // initial rendering 
                centerY,       // location before translation
                frame.w, 
                frame.h,
                rot,                  // rotation
                x, y,               // translation
                scaleX,scaleY,        // scale (x, y)
                u0,                 // These values are x, y, w, h
                v0,                 // for the texture normalized
                u1,                 // to [0-1]
                v1                  // I hope that makes sense
            )
            state.renderer.col = colCache
        }
    }
    return Object.assign(state)
}

const CreateGameBoard = (game) => {
    let state = {
        game: game,
        objects: [],
        cnt: {},
        add: (obj) => {
            obj.board = state
            state.objects.push(obj)
            state.cnt[obj.type] = (state.cnt[obj.type] || 0) + 1
            return obj
        },
        remove: (obj) => {
            let idx = state.removed.indexOf(obj)
            if (idx === -1) {
                state.removed.push(obj)
                return true
            } else {
                return false
            }
        },
        resetRemoved: () => state.removed = [],
        finalizeRemoved: () => {
            state.removed.forEach((e) => {
                let idx = state.objects.indexOf(e)
                if (idx !== -1) {
                    state.cnt[e.type]--
                    state.objects.splice(idx, 1)
                }
            })
        },
        iterate: function (funcName) {
            var args = Array.prototype.slice.call(arguments, 1)
            state.objects.forEach((e,i) => {
                e[funcName].apply(e, args)
            })
        },
        detect: (func) => {
            return state.objects.find((e) => {
                return func(e)
            }) || false
        },
        binDetect: (bin, func) => {
            return bin.find((e) => {
                return func(e)
            }) || false
        },
        step: (dt) => {
            state.bins = []
            state.resetRemoved()
            state.iterate("step", dt)
            state.finalizeRemoved()
        },
        draw: (ctx) => {
            state.iterate("draw", ctx)
        },
        overlap: (o1, o2) => {
            return !(
                (o1.y+o1.h-1<o2.y) || 
                (o1.y>o2.y+o2.h-1) ||
                (o1.x+o1.w-1<o2.x) || 
                (o1.x>o2.x+o2.w-1)
            )
        },
        collide: (obj, type) => {
            return state.detect((e) => {
                if (obj != e){
                    let col = (!type || e.type & type) && state.overlap(obj, e)
                    return col ? e : false
                }
            })
        },
        binCollide: (obj, type) => {
            if (!obj.bin)
                return
            return state.binDetect(obj.bin, (e) => {
                let col = (!type || e.type & type) && state.overlap(obj, e)
                return col ? e : false
            })
        },
        binSize: 48,
        bins: [],
        checkBin: (col, cell) => {
            if (cell < 0 || col < 0)
                return false
            if (!state.bins[col])
                state.bins[col] = []
            if (!state.bins[col][cell])
                state.bins[col][cell] = []
            return true
        },
        resetBins: () => {
            state.bins = []
        },
        reportPosition: (obj) => {
            let col = Math.floor( (obj.x - state.game.minX) / state.binSize )
            let cell = Math.floor( (obj.y - state.game.minY) / state.binSize )
            let xOverflow = (obj.x + obj.w) > state.binSize
            let yOverflow = (obj.y + obj.h) > state.binSize
            let xyOverflow = xOverflow && yOverflow
            if (col < 0 || cell < 0)
                return false
            if(state.checkBin(col, cell))
                state.bins[col][cell].push(obj)
            if (xOverflow && state.checkBin(col + 1, cell)){
                state.bins[col+1][cell].push(obj)
            }
            if (yOverflow && state.checkBin(col, cell + 1)){
                state.bins[col][cell+1].push(obj)
            }
            if (xyOverflow && state.checkBin(col + 1, cell + 1)){
                state.bins[col+1][cell+1].push(obj)
            }
                
            return state.bins[col][cell]
        }
    }
    return Object.assign(state)
}

const CreateTouchControls = (game, spriteSheet) => {

    const gutterWidth = 10
    const unitWidth = game.maxX / 5
    const blockWidth = unitWidth - gutterWidth
    const threshold = 20

    let tC = {
        init: () => {
            game.canvas.addEventListener('touchstart', tC.trackTouch, true)
            game.canvas.addEventListener('touchend', (e)=>{
                for (let i=0;i<e.changedTouches.length;++i){
                    let touch = e.changedTouches[i]
                    let x = touch.pageX / game.canvasMultiplier - game.canvas.offsetLeft
                    let y = touch.pageY / game.canvasMultiplier - game.canvas.offsetTop
                    if (y < game.maxY - unitWidth || x < 3*unitWidth){
                        tC.touches = null
                        break
                    }
                }
                tC.oldPx = null
                tC.oldPy = null
                tC.trackTouch(e)
            }, true)

            game.canvas.addEventListener('touchmove', (e) => {
                // filters touches by location. basically, anywhere except our buttons is ok
                for (let i=0;i<e.touches.length;++i){
                    let touch = e.touches[i]
                    let x = touch.pageX / game.canvasMultiplier - game.canvas.offsetLeft
                    let y = touch.pageY / game.canvasMultiplier - game.canvas.offsetTop
                    if (y < game.maxY - unitWidth || x < 3*unitWidth){
                        tC.touches = touch
                        break
                    }
                }
            }, true)
        
            // For Android
            // game.canvas.addEventListener('dblclick', (e) => { e.preventDefault() }, true)
            // game.canvas.addEventListener('click', (e) => { e.preventDefault() }, true)
        
            game.playerOffset = unitWidth + 20
        },
        drawSquare: (x, y, on) => {
            const tint = on ? "0xAAFFFFFF" : "0x33FFFFFF"
            spriteSheet.draw(
                "square", x, y, blockWidth, tint, false
            )
        },
        draw: () => {    
            var yLoc = game.height - unitWidth
            // tC.drawSquare(gutterWidth, yLoc, game.keys['left'])
            // tC.drawSquare(unitWidth + gutterWidth, yLoc, game.keys['right'])
            tC.drawSquare(3 * unitWidth, yLoc, game.keys["space"])
            tC.drawSquare(4 * unitWidth, yLoc, game.keys['z'])
        },
        oldPx: null,
        oldPy: null,
        step: () => {        
            if(!tC.touches){
                tC.oldPx = null
                tC.oldPy = null
                game.keys.touchDX = 0
                game.keys.touchDY = 0
                return
            }
            let touch = tC.touches;
            let px = touch.pageX;
            let py = touch.pageY;
    
            // console.log('touch at ' + px +',' + py);
            tC.oldPx = tC.oldPx || px
            tC.oldPy = tC.oldPy || py
            let dX = px - tC.oldPx
            let dY = py - tC.oldPy
            if (dY > threshold || dY < -threshold || dX > threshold || dX < -threshold){
                dX = 0
                dY = 0
            }
    
            game.keys.touchDX = dX
            game.keys.touchDY = dY
            
            tC.oldPx = px
            tC.oldPy = py
        },
        trackTouch: (e) => {
            var touch, x
            e.preventDefault()
            if (e.type == 'touchstart' || e.type == 'touchend') {
                for (i = 0; i < e.changedTouches.length; i++) {
                    let touch = e.changedTouches[i]
                    let x = touch.pageX / game.canvasMultiplier - game.canvas.offsetLeft
                    let y = touch.pageY / game.canvasMultiplier - game.canvas.offsetTop
                    if (y > game.maxY - unitWidth){                     
                        if (x > 3*unitWidth && x < 4 * unitWidth) {
                            game.keys['space'] = (e.type === "touchstart")
                        }
                        if (x > 4 * unitWidth) {
                            game.keys['z'] = (e.type == 'touchstart')
                        }
                    } else if (y < game.maxY - unitWidth && (game.gameOver || game.win || game.titleScreen)){
                        game.keys["enter"] = (e.type === "touchstart")
                    }
                }
            }
        }
    } 

    return tC
}