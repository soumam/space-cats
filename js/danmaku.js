// need to override SimpleSubRunner to accept dt
// NOTE: when a bullet's action list < 2, bulletmljs uses SimpleSubRunner
// NOTE: if a bullet's action list is > 1, SubRunner is used
bulletml.runner.SimpleSubRunner.prototype.update = function(dt) {
    if (this.deltaX === null) this.deltaX = Math.cos(this.direction) * this.speed;
    if (this.deltaY === null) this.deltaY = Math.sin(this.direction) * this.speed;

    this.x += this.deltaX * this.config.speedRate * dt * 60;
    this.y += this.deltaY * this.config.speedRate * dt * 60;
};
bulletml.runner.SubRunner.prototype.update = function(dt) {
    if (this.stop) return;

    this.age += dt * 60;

    var conf = this.config;

    // update direction
    if (this.age < this.chDirEnd) {
        this.direction += this.dirIncr;
    } else if (this.age === this.chDirEnd) {
        this.direction = this.dirFin;
    }

    // update speed
    if (this.age < this.chSpdEnd) {
        this.speed += this.spdIncr;
    } else if (this.age === this.chSpdEnd) {
        this.speed = this.spdFin;
    }

    // update accel
    if (this.age < this.aclEnd) {
        this.speedH += this.aclIncrH;
        this.speedV += this.aclIncrV;
    } else if (this.age === this.aclEnd) {
        this.speedH = this.aclFinH;
        this.speedV = this.aclFinV;
    }

    // move
    this.x += Math.cos(this.direction) * this.speed * conf.speedRate;
    this.y += Math.sin(this.direction) * this.speed * conf.speedRate;
    this.x += this.speedH * conf.speedRate;
    this.y += this.speedV * conf.speedRate;

    // proccess walker
    if (this.age < this.waitTo || this.completed) {
        return;
    }
    var cmd;
    while (cmd = this.walker.next()) {
        switch (cmd.commandName) {
        case "fire":
            this.fire(/**@type{bulletml.Fire}*/(cmd));
            break;
        case "wait":
            this.waitTo = this.age + cmd.value;
            return;
        case "changeDirection":
            this.changeDirection(/**@type{bulletml.ChangeDirection}*/(cmd));
            break;
        case "changeSpeed":
            this.changeSpeed(/**@type{bulletml.ChangeSpeed}*/(cmd));
            break;
        case "accel":
            this.accel(/**@type{bulletml.Accel}*/(cmd));
            break;
        case "vanish":
            this.onVanish();
            break;
        case "notify":
            this.notify(/**@type{bulletml.Notify}*/(cmd));
            break;
        }
    }

    // complete
    this.completed = true;
    if (this.parentRunner !== null) {
        this.parentRunner.completedChildCount += 1;
    }
};

const CreateDanmakuConfig = (target) => ({
    target: target,
    createNewBullet: function(runner, spec) {
        let bullet = CreateDanmakuBullet(game, spriteSheet, runner, spec)
        runner.onVanish = function() {
            debugger
        };
        gameBoard.add(bullet)
    }
})


// danmaku descriptions
// Danmaku_00: shoots a single lightly aimed purple bullet with random wait ten times
// Danmaku_01: 
// Danmaku_02: shoots burst of precise aimed red bullets ten times
// Danmaku_03: 
// Danmaku_04: 
// Danmaku_05: 
// Danmaku_06: shoots straight up
// Danmaku_07: shoots straight down
// Danmaku_08: shoots three bullets downward
// Danmaku_09: continuous radial blasts

bulletml.dsl("bml_");
Danmaku_00 = new bulletml.Root({
    top: bml_action([
        bml_repeat(10, [
            bml_wait("$rand * 240"),
            bml_fire(bml_direction("-30 + $rand * 60", "aim"), bml_speed(1.5), bml_bullet()),
            bml_wait("240"),
        ]),
    ]),
});
Danmaku_01 = new bulletml.Root({
    top: bml_action([
        bml_repeat(999, [
            bml_repeat(5, [
                bml_fire(bml_speed(1.5), bml_bullet()),
                bml_repeat(17, [
                    // bml_wait(1),
                    bml_fire(bml_direction(20, "sequence"), bml_speed(0, "sequence"), bml_bullet()),
                ]),
                bml_wait(20)
            ]),
            bml_wait(120),
            bml_repeat(5, [
                bml_fire(bml_speed(3.0), bml_bullet()),
                bml_repeat(17, [
                    // bml_wait(1),
                    bml_fire(bml_direction(20, "sequence"), bml_speed(0, "sequence"), bml_bullet()),
                ]),
                bml_wait(20)
            ]),
            bml_wait(120),
            bml_fire(bml_speed(1.5), bml_bullet()),
            bml_repeat(100, [
                bml_wait(2),
                bml_fire(bml_direction(-16, "sequence"), bml_speed(0, "sequence"), bml_bullet()),
            ]),
            bml_wait(120)
        ]),
    ]),
});

Danmaku_02 = new bulletml.Root({
    top: bml_action([
        bml_repeat(10, [
            bml_fire(bml_speed(4.5), bml_bullet({ tint: 0xFF8888FF})),
            bml_repeat(5,[
                bml_wait(5),
                bml_fire(bml_speed(0, "sequence"), bml_direction(0, "sequence"), bml_bullet({ tint: 0xFF8888FF})),
            ]),
            bml_wait("60 + $rand * 120")
        ]),
    ]),
});

Danmaku_03 = new bulletml.Root({
    top: bml_action([
        bml_repeat(3, [
            bml_wait(100),
            bml_repeat(1, [
                bml_fire(bml_speed(1.5), bml_direction(45, "absolute"), bml_bullet({ tint: 0xFFFF88FF})),
                bml_repeat(3,[
                    bml_fire(bml_speed(0, "sequence"), bml_direction(90, "sequence"), bml_bullet({ tint: 0xFFFF88FF})),
                ]),
                bml_wait(50)
            ]),
            bml_wait(100),
            bml_repeat(1, [
                bml_fire(bml_speed(1.5), bml_direction(90, "absolute"), bml_bullet({ tint: 0xFF88FF88})),
                bml_repeat(3,[
                    bml_fire(bml_speed(0, "sequence"), bml_direction(90, "sequence"), bml_bullet({ tint: 0xFF88FF88})),
                ]),
                bml_wait(50)
            ])
        ]),
    ]),
});
// 50 frames
Danmaku_04 = new bulletml.Root({
    top: bml_action([
        bml_repeat(1, [
            bml_repeat(5, [
                bml_fire(bml_direction(0, "absolute"), bml_speed(1.5), bml_bullet()),
                bml_repeat(17, [
                    // bml_wait(1),
                    bml_fire(bml_direction(20, "sequence"), bml_speed(0, "sequence"), bml_bullet()),
                ]),
                bml_wait(10)
            ]),
        ]),
    ]),
});
// 240 frames
Danmaku_05 = new bulletml.Root({
    top: bml_action([
        bml_repeat(6, [
            bml_fire(bml_direction(180, "absolute"), bml_speed(1.5), bml_bullet({ tint: 0xFFFF88FF})),
            bml_repeat(5,[
                bml_fire(bml_speed(0.5, "sequence"), bml_direction(0, "sequence"), bml_bullet({ tint: 0xFFFF88FF})),
            ]),
            bml_wait(40)
        ]),
    ]),
});
Danmaku_06 = new bulletml.Root({
    top: bml_action([
        bml_repeat(10, [
            bml_wait("$rand * 240"),
            bml_fire(bml_direction(0, "absolute"), bml_speed(1.5), bml_bullet()),
            bml_wait("240"),
        ]),
    ]),
});
Danmaku_07 = new bulletml.Root({
    top: bml_action([
        bml_repeat(10, [
            bml_wait("$rand * 240"),
            bml_fire(bml_direction(180, "absolute"), bml_speed(1.5), bml_bullet()),
            bml_wait("240"),
        ]),
    ]),
});
Danmaku_08 = new bulletml.Root({
    top: bml_action([
        bml_repeat(10, [
            bml_wait("$rand * 240"),
            bml_fire(bml_direction(165, "absolute"), bml_speed(2.0), bml_bullet({ tint: 0xFF88FFFF})),
            bml_repeat(2, [
                bml_fire(bml_direction(15, "sequence"), bml_speed(2.0), bml_bullet({ tint: 0xFF88FFFF}))
            ]),
            bml_wait("120"),
        ]),
    ]),
});
Danmaku_09 = new bulletml.Root({
    top: bml_action([
        bml_repeat(Infinity, [
            bml_repeat(5, [
                bml_fire(bml_direction(0, "absolute"), bml_speed(1.5), bml_bullet()),
                bml_repeat(17, [
                    // bml_wait(1),
                    bml_fire(bml_direction(20, "sequence"), bml_speed(0, "sequence"), bml_bullet()),
                ]),
                bml_changeSpeed(1.6,0),
                bml_wait(20)
            ]),
        ]),
    ]),
});