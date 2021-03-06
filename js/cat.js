const CatStep = function(dt){
    this.reload -= dt
    if (this.game.sloMoFactor !== 1 && this.sloMoMeter > 0){
        this.sloMoMeter -= 0.25
    }
    if (this.sloMoMeter <= 0){
        this.game.sloMoFactor = 1
    }
        
    const gKeys = this.game.keys
    if (this.game.mobile){
        const sensitivity = 100
        this.vx = gKeys.touchDX * sensitivity
        this.vy = gKeys.touchDY * sensitivity
    } else {
        if (gKeys.right)
            this.vx = this.maxVel
        else if (gKeys.left)    
            this.vx = -this.maxVel
        else 
            this.vx = 0
        if (gKeys.down)    
            this.vy = this.maxVel
        else if (gKeys.up) 
            this.vy = -this.maxVel 
        else 
            this.vy = 0        
    }

    // shoot
    if (gKeys.z && !this.zDown) {
        // console.log("Z DOWN")
        
        this.fireFrame = 3000
        this.zDown = true
    } else if (!gKeys.z && this.zDown){
        // console.log("Z UP")
        this.zDown = false
    }

    if (this.zDown){
        this.fireFrame += Math.floor(dt * 60 * 1000)
        if (this.fireFrame > 6000){
            // debugger
            shot_sound.play()
            this.board.add(CreateCatMissile(
                game, spriteSheet, this.x, this.y,
                { cat: this }
            ))
            this.board.add(CreateCatMissile(
                game, spriteSheet, this.x+this.w, this.y,
                { cat: this }
            ))
            this.fireFrame = Math.floor(this.fireFrame - 6000)
        }        
    }

    // text explosion
    if (gKeys.q && !this.qDown){
        this.board.add(CreateExplosion(
            game, spriteSheet, this.x, this.y
        ))
        this.qDown = true
    } else if (!gKeys.q && this.qDown){
        this.qDown = false
    }
    // slow motion
    if (gKeys.space && !this.spaceDown){
        if (this.game.sloMoFactor === 5)
            this.game.sloMoFactor = 1
        else if (this.sloMoMeter > 0){
            this.game.sloMoFactor = 5
        }
        this.spaceDown = true
    } else if (!gKeys.space && this.spaceDown){
        this.spaceDown = false
    }

    let firingWeaponPenalty = this.zDown ? 0.3 : 1

    firingWeaponPenalty = 1

    this.x += this.vx * dt * firingWeaponPenalty
    this.y += this.vy * dt * firingWeaponPenalty

    if (this.x < 0)
        this.x = 0
    if (this.game.maxX - this.w < this.x) 
        this.x = this.game.maxX - this.w 
    if (this.y < 0)
        this.y = 0
    if (this.game.maxY - this.h < this.y)
        this.y = this.game.maxY - this.h

    this.board.reportPosition(this)

}

const CatHit = function(damage){
    this.board.remove(this)
    this.game.sloMoFactor = 6
    this.board.add(CreateExplosion(
        game, spriteSheet, this.x + this.w/2, this.y + this.h/2,
        {
            callback: ()=> this.game.sloMoFactor = 1
        }
    ))
    GameOver()
}

const CreateCat = (game, spriteSheet, catType, props) => {
    let cat = Object
        .create(Sprite)
        .init(spriteSheet, catType)
    cat.game = game
    cat.x = game.maxX/2 - cat.w/2
    cat.y = game.maxY - game.playerOffset - cat.h
    cat.reloadTime = 0.000
    cat.spaceDown = true
    cat.reload = cat.reloadTime
    cat.sloMoMeter = 0
    cat.type = OBJECT_PLAYER

    Object.assign(cat, props || {})
    Object.assign(cat, {
        draw: SpriteDraw,
        step: CatStep,
        hit: CatHit,
    })
    return cat
}
const CatMissileStep = function(dt) {
    this.y += this.vy * dt
    this.bin = this.board.reportPosition(this)

    const collision = (this.bin && this.bin.length > 1) ? 
                      this.board.binCollide(this, OBJECT_ENEMY) : 
                      false
    if (collision){
        collision.hit(this.damage, this.cat)
        this.board.remove(this)
    }else if (this.y < -this.h) {
        this.board.remove(this)
    }
}
const CreateCatMissile = (game, spriteSheet, x, y, props) => {
    let missile = Object
        .create(Sprite)
        .init(spriteSheet, "cat_missile", {
            vy: -700,
            damage: 1
        })
    missile.x = x - missile.w / 2
    missile.y = y - missile.h
    missile.type = OBJECT_PLAYER_PROJECTILE
    Object.assign(missile, props || {})
    Object.assign(missile, {
        draw: SpriteDraw,
        step: CatMissileStep
    })
    return missile
}
