class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");

        // sceneData stores all non constant data
        //  - "sprite"      holds created sprites
        //  - "text"        holds created bitmap text objects
        //  - "playerSpeed" holds the player's current speed
        //  - "score"       holds current score
        this.sceneData = {sprite: {}, text: {}, playerSpeed: 0, score: 0};

        // Create a property inside "sprite" named "bullet".
        // The bullet property has a value which is an array.
        // This array will hold bindings (pointers) to bullet sprites
        this.sceneData.sprite.bullet = [];   


        // ----- CONFIG -----
        this.maxBullets = 10;

        // Physics
        this.playerAcceleration = 2000;
        this.maxPlayerSpeed = 350;
        this.playerDynamicFriction = 3;
        this.playerStaticFriction = 40;

        this.bulletSpeed = 300;  

        // Positioning
        this.scoreTextX = 10;    
        this.scoreTextY = 560;   

        this.playerYOffset = 80;    

    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("elephant", "elephant.png");
        this.load.image("heart", "heart.png");
        this.load.image("hippo", "hippo.png");

        // For animation
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

        // Sound asset from the Kenny Music Jingles pack
        // https://kenney.nl/assets/music-jingles
        this.load.audio("impactMetal", "impactMetal_light_000.ogg");
        this.load.audio("music", "djartmusic-the-return-of-the-8-bit-era-301292.mp3");
    }

    create() {
        let sceneData = this.sceneData;

        sceneData.sprite.player = this.add.sprite(game.config.width/2, game.config.height - this.playerYOffset, "elephant");
        sceneData.sprite.player.setScale(0.25);

        sceneData.sprite.hippo = this.add.sprite(game.config.width/2, 80, "hippo");
        sceneData.sprite.hippo.setScale(0.25);
        sceneData.sprite.hippo.scorePoints = 25;


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

        // Put title on screen
        this.add.text(10, 5, "Hippo Hug!", {
            fontFamily: 'Times, serif',
            fontSize: 24,
            wordWrap: {
                width: 60
            }
        });
    }

    update(time, delta) {
        let sceneData = this.sceneData;
        let deltaTime = delta / 1000;

        this.updatePlayer(sceneData, deltaTime);

        this.fireBullets(sceneData);

        this.removeOffscreenBullets(sceneData);

        this.checkCollisions(sceneData);

        this.moveBullets(sceneData, deltaTime);
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

    updatePlayer(sceneData, deltaTime) {
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
        if (sceneData.sprite.player.x < 0 || sceneData.sprite.player.x > 800) {
            this.sceneData.playerSpeed = 0;
        }
        sceneData.sprite.player.x = Math.min(Math.max(sceneData.sprite.player.x, 0), 800);

        //Flip sprite
        if (this.sceneData.playerSpeed < 0){
            sceneData.sprite.player.flipX = true;
        }
        else{
            sceneData.sprite.player.flipX = false;
        }

        console.log(this.sceneData.playerSpeed);

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

    fireBullets(sceneData) {
        // Check for bullet being fired
        if (Phaser.Input.Keyboard.JustDown(this.space)) {
            // Are we under our bullet quota?
            if (sceneData.sprite.bullet.length < this.maxBullets) {
                sceneData.sprite.bullet.push(this.add.sprite(
                    sceneData.sprite.player.x, sceneData.sprite.player.y-(sceneData.sprite.player.displayHeight/2), "heart")
                );
            }
        }
    }

    removeOffscreenBullets(sceneData) {
        sceneData.sprite.bullet = sceneData.sprite.bullet.filter((bullet) => bullet.y > -(bullet.displayHeight/2));
    }

    checkCollisions(sceneData) {
        for (let bullet of sceneData.sprite.bullet) {
            if (this.collides(sceneData.sprite.hippo, bullet)) {
                // start animation
                this.puff = this.add.sprite(sceneData.sprite.hippo.x, sceneData.sprite.hippo.y, "whitePuff03").setScale(0.25).play("puff");
                // clear out bullet -- put y offscreen, will get reaped next update
                bullet.y = -100;
                sceneData.sprite.hippo.visible = false;
                sceneData.sprite.hippo.x = -100;
                // Update score
                this.sceneData.score += sceneData.sprite.hippo.scorePoints;
                this.updateScore();
                this.impactMetalSound.play();

                // Have new hippo appear after end of animation
                this.puff.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                    sceneData.sprite.hippo.visible = true;
                    sceneData.sprite.hippo.x = Math.random()*config.width;
                }, this);

            }
        }
    }

    moveBullets(sceneData, deltaTime) {
        for (let bullet of sceneData.sprite.bullet) {
            bullet.y -= this.bulletSpeed * deltaTime;
        }
    }
}
         