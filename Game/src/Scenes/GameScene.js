class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");

        // sceneData stores all non constant data
        this.sceneData = {sprite: {}, text: {}, playerSpeed: 0, playerLastFiredTime: 0, lastEnemySpawnTime: 0, score: 0};

        this.sceneData.sprite.bullets = [];   
        this.sceneData.sprite.enemies = [];   


        // ----- CONFIG -----
        this.maxBullets = 10;

        // Physics
        this.playerAcceleration = 2000;
        this.maxPlayerSpeed = 350;
        this.playerDynamicFriction = 3;
        this.playerStaticFriction = 40;

        this.bulletSpeed = 700;

        // Waves
        this.enemySpawnInterval = 1;

        // Visual
        this.playerShootAnimationTime = 0.5;

        // Positioning
        this.scoreTextX = 10;    
        this.scoreTextY = 560;   

        this.playerYOffset = 80;

        this.bulletXOffset = 15;  
        
        this.enemySpawnY = -10;

        this.roadBoundLeft = 200;    
        this.roadBoundRight = 600;    


    }

    preload() {
        // ------------------- SPRITES -------------------
        this.load.setPath("./assets/sprites");

        this.load.image("playerShoot", "player/gun.png");
        this.load.image("playerIdle", "player/idle.png");
        this.load.image("bullet", "bullet.png");
        this.load.image("zombie", "zombie.png");

        // Animation
        this.load.image("whitePuff00", "whitePuff00.png");
        this.load.image("whitePuff01", "whitePuff01.png");
        this.load.image("whitePuff02", "whitePuff02.png");
        this.load.image("whitePuff03", "whitePuff03.png");

        // Load the Kenny Rocket Square bitmap font
        // This was converted from TrueType format into Phaser bitmap
        // format using the BMFont tool.
        // BMFont: https://www.angelcode.com/products/bmfont/
        // Tutorial: https://dev.to/omar4ur/how-to-create-bitmap-fonts-for-phaser-js-with-bmfont-2ndc
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");


        // -------------------- SOUNDS -------------------
        this.load.setPath("./assets/sounds");

        this.load.audio("impactMetal", "impactMetal_light_000.ogg");
        this.load.audio("music", "djartmusic-the-return-of-the-8-bit-era-301292.mp3");
    }

    create() {
        let sceneData = this.sceneData;

        sceneData.sprite.player = this.add.sprite(game.config.width/2, game.config.height - this.playerYOffset, "player");
        sceneData.sprite.player.setScale(1.25);
        sceneData.sprite.player.angle = -90;

        // Create white puff animation
        this.anims.create({
            key: "puff",
            frames: [
                { key: "whitePuff00" },
                { key: "whitePuff01" },
                { key: "whitePuff02" },
                { key: "whitePuff03" },
            ],
            frameRate: 20,    // Note: case sensitive (thank you Ivy!)
            repeat: 5,
            hideOnComplete: true
        });


        this.impactMetalSound = this.sound.add("impactMetal", {
            volume: 0.5
        });

        this.music = this.sound.add("music", {
            volume: 0.5, loop: true
        });
        this.music.play();

        // Create key objects
        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // update HTML description
        document.getElementById('description').innerHTML = '<h2>Array Boom.js</h2><br>A: left // D: right // Space: fire/emit';

        // Put score on screen
        sceneData.text.score = this.add.bitmapText(this.scoreTextX, this.scoreTextY, "rocketSquare", "Score " + this.sceneData.score);

        // // Put title on screen
        // this.add.text(10, 5, "Hippo Hug!", {
        //     fontFamily: 'Times, serif',
        //     fontSize: 24,
        //     wordWrap: {
        //         width: 60
        //     }
        // });
    }

    update(time, delta) {
        let sceneData = this.sceneData;
        let deltaTime = delta / 1000;

        this.updatePlayerPhysics(sceneData, deltaTime);

        this.fireBullets(sceneData, time);

        this.updatePlayerSprite(sceneData, time);

        this.removeOffscreenBullets(sceneData);

        this.checkCollisions(sceneData);

        this.moveBullets(sceneData, deltaTime);

        this.spawnEnemies(sceneData, time);

        this.updateEnemies(sceneData, time, delta);
        
        this.removeOffscreenEnemies(sceneData);
    }

    // A center-radius AABB collision check
    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2)) return false;
        return true;
    }

    updateScore() {
        let sceneData = this.sceneData;
        sceneData.text.score.setText("Score " + this.sceneData.score);
    }

    updatePlayerPhysics(sceneData, deltaTime) {
        //A and D change speed
        if (this.left.isDown){
            this.sceneData.playerSpeed -= this.playerAcceleration * deltaTime;
        }
        if (this.right.isDown){
            this.sceneData.playerSpeed += this.playerAcceleration * deltaTime;
        }

        //Dynamic Friction
        this.sceneData.playerSpeed = this.sceneData.playerSpeed - (this.sceneData.playerSpeed * this.playerDynamicFriction * deltaTime)
        
        //Static Friction
        if (this.sceneData.playerSpeed > 0){
            this.sceneData.playerSpeed -= this.playerStaticFriction * deltaTime;
            this.sceneData.playerSpeed = Math.max(0, this.sceneData.playerSpeed);
        }
        else{
            this.sceneData.playerSpeed += this.playerStaticFriction * deltaTime;
            this.sceneData.playerSpeed = Math.min(0, this.sceneData.playerSpeed);
        }

        //Clamp speed
        this.sceneData.playerSpeed = Math.min(Math.max(this.sceneData.playerSpeed, -1 * this.maxPlayerSpeed), this.maxPlayerSpeed);

        sceneData.sprite.player.x += this.sceneData.playerSpeed * deltaTime;

        //Clamp x position
        if (sceneData.sprite.player.x < this.roadBoundLeft || sceneData.sprite.player.x > this.roadBoundRight) {
            this.sceneData.playerSpeed = 0;
        }
        sceneData.sprite.player.x = Math.min(Math.max(sceneData.sprite.player.x, this.roadBoundLeft), this.roadBoundRight);

        //Change sprite
        /*
        if (Math.abs(this.sceneData.playerSpeed) > this.walkAnimationThreshhold){
            sceneData.sprite.playerIdle.visible = false;
            sceneData.sprite.playerWalk.visible = true;
        }
        else{
            sceneData.sprite.playerIdle.visible = true;
            sceneData.sprite.playerWalk.visible = false;
        }*/

    }

    updatePlayerSprite(sceneData, time) {
        if (time/1000 - sceneData.playerLastFiredTime < this.playerShootAnimationTime) {
            sceneData.sprite.player.setTexture("playerShoot");
        }
        else{
            sceneData.sprite.player.setTexture("playerIdle");
        }
    }

    fireBullets(sceneData, time) {
        if (!Phaser.Input.Keyboard.JustDown(this.space)) {
            return;
        }

        if (sceneData.sprite.bullets.length >= this.maxBullets) {
            return;
        }

        sceneData.sprite.bullets.push(this.add.sprite(
            sceneData.sprite.player.x + this.bulletXOffset, sceneData.sprite.player.y-(sceneData.sprite.player.displayHeight/2), "bullet")
        );
        sceneData.playerLastFiredTime = time/1000;
    }

    removeOffscreenBullets(sceneData) {
        sceneData.sprite.bullets = sceneData.sprite.bullets.filter((bullet) => bullet.y > -(bullet.displayHeight/2));
    }

    removeOffscreenEnemies(sceneData) {
        sceneData.sprite.enemies = sceneData.sprite.enemies.filter((enemy) => enemy.y < game.config.height + (enemy.displayHeight/2));
    }

    checkCollisions(sceneData) {
        for (let enemy of sceneData.sprite.enemies) {
            for (let bullet of sceneData.sprite.bullets) {
                if (this.collides(enemy, bullet)) {    
                    // start animation
                    this.puff = this.add.sprite(enemy.x, enemy.y, "whitePuff03").setScale(0.25).play("puff");

                    // Update score
                    this.sceneData.score += enemy.points;
                    this.updateScore();

                    // Sound
                    this.impactMetalSound.play();
                    
                    // put y offscreen, will get removed next update
                    bullet.y = -100;
                    enemy.y = 1000;

                    // // Have new hippo appear after end of animation
                    // this.puff.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                    //     sceneData.sprite.hippo.visible = true;
                    //     sceneData.sprite.hippo.x = Math.random()*config.width;
                    // }, this);

                }
            }
        }
    }

    moveBullets(sceneData, deltaTime) {
        for (let bullet of sceneData.sprite.bullets) {
            bullet.y -= this.bulletSpeed * deltaTime;
        }
    }

    spawnEnemies(sceneData, time) {
        if (time/1000 - sceneData.lastEnemySpawnTime > this.enemySpawnInterval) {
            let temp = new Enemy(this, game.config.width/2, this.enemySpawnY, "zombie", null, 0.1, 25)
            temp.setScale(1.25);
            temp.angle = 90;
            temp.x = (Math.random() * (this.roadBoundRight - this.roadBoundLeft)) + this.roadBoundLeft;
            sceneData.sprite.enemies.push(temp);

            sceneData.lastEnemySpawnTime = time/1000;
        }
    }

    updateEnemies(sceneData, time, delta){
        for (let enemy of sceneData.sprite.enemies) {
            enemy.update(time, delta);
        }
    }

}
         