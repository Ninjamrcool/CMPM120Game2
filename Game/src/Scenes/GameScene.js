class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");

        this.initializeScene();
    }

    initializeScene() {
        // sceneData stores all non constant data
        this.sceneData = {sprite: {}, text: {}, playerSpeed: 0, playerLastFiredTime: 0, playerLastHurtTime: 0, playerHealth: 3, lastScoreIncrementTime: 0, score: 0, rowNumber: 0, crosswalkChance: 0.0, lastEnemySpawnTime: 0, wave: 0, enemiesSpawnedThisWave: 0, lastWaveEndTime: 0};

        this.sceneData.sprite.bullets = [];   
        this.sceneData.sprite.enemies = [];   
        this.sceneData.sprite.tiles = []; //rows   


        // ----- CONFIG -----
        this.maxBullets = 10;
        this.bulletReloadTime = 0.15;

        // Physics
        this.playerAcceleration = 2000;
        this.maxPlayerSpeed = 350;
        this.playerDynamicFriction = 3;
        this.playerStaticFriction = 40;

        this.bulletSpeed = 700;

        this.shrinkCollisionsFactor = 0.9;

        // Waves
        this.waveTime = 15;
        this.waveDowntime = 3;
        this.enemyAmountIncreasePerWave = 2;
        this.baseEnemyAmount = 5;

        // Visual
        this.playerShootDuration = 0.5;
        this.playerDamageDuration = 0.15;

        this.waveTextFadeSpeed = 2;

        // Tiles
        this.tileSpeed = 50;
        this.roadLeftOffset = 4;
        this.roadRightOffset = 11;
        this.crosswalkChanceAdded = 0.07;

        // Positioning
        this.scoreTextX = 10;    
        this.scoreTextY = 560;   

        this.waveTextX = 400;
        this.waveTextY = 20;

        this.heartX = 775;    
        this.heartY = 575;   

        this.playerYOffset = 80;

        this.bulletXOffset = 15;  
        
        this.enemySpawnY = -10;

        this.roadBoundLeft = 225;    
        this.roadBoundRight = 575;    

        this.heartXGap = 40;    

        this.tileDimensions = 50;
    }

    preload() {
        // ------------------- SPRITES -------------------
        this.load.setPath("./assets/sprites");

        this.load.image("playerShoot", "player/gun.png");
        this.load.image("playerShootHurt", "player/gunHurt.png");
        this.load.image("playerIdle", "player/idle.png");
        this.load.image("playerIdleHurt", "player/idleHurt.png");

        this.load.image("bullet", "bullet.png");

        this.load.image("basicZombieIdle", "enemies/basicIdle.png");
        this.load.image("basicZombieHurt", "enemies/basicHurt.png");

        this.load.image("speedyZombieIdle", "enemies/speedyIdle.png");
        this.load.image("speedyZombieHurt", "enemies/speedyHurt.png");

        this.load.image("blackSquare", "UI/blackSquare.png");

        this.load.image("heart", "UI/heart.png");

        //Tiles
        this.load.image("roadLeft", "Tiles/roadLeft.png");
        this.load.image("roadCrosswalkLeft", "Tiles/roadCrosswalkLeft.png");
        this.load.image("roadRight", "Tiles/roadRight.png");
        this.load.image("roadCrosswalkRight", "Tiles/roadCrosswalkRight.png");
        this.load.image("roadMiddle", "Tiles/roadMiddle.png");
        this.load.image("roadCrosswalkMiddle", "Tiles/roadCrosswalkMiddle.png");

        this.load.image("roadCrackedMiddle1", "Tiles/roadCrackedMiddle1.png");
        this.load.image("roadCrackedMiddle2", "Tiles/roadCrackedMiddle2.png");
        this.load.image("roadCrackedMiddle3", "Tiles/roadCrackedMiddle3.png");

        this.load.image("grass1", "Tiles/grass1.png");
        this.load.image("grass2", "Tiles/grass2.png");
        this.load.image("grass3", "Tiles/grass3.png");

        this.load.image("grassDecorator1", "Tiles/grassDecorator1.png");
        this.load.image("grassDecorator2", "Tiles/grassDecorator2.png");
        this.load.image("grassDecorator3", "Tiles/grassDecorator3.png");

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

        for (let i = 0; i < sceneData.playerHealth; i++) {
            sceneData.sprite["heart" + (i + 1)] = this.add.sprite(this.heartX - (i * this.heartXGap), this.heartY, "heart");
            sceneData.sprite["heart" + (i + 1)].setScale(0.35);
            sceneData.sprite["heart" + (i + 1)].setDepth(3);
        }

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
        document.getElementById('description').innerHTML = '<h2>Gallery Shooter</h2><br>A: left // D: right // Space: fire/emit';

        // Put score on screen
        sceneData.text.score = this.add.bitmapText(this.scoreTextX, this.scoreTextY, "rocketSquare", "Score " + this.sceneData.score);
        sceneData.text.score.setDepth(3);

        // Put wave text
        sceneData.text.wave = this.add.bitmapText(this.waveTextX, this.waveTextY, "rocketSquare", "Wave " + this.sceneData.wave);
        sceneData.text.wave.setDepth(3);
        sceneData.text.wave.setOrigin(0.5);
        sceneData.text.wave.alpha = 0.0;

        for (let i = 0; i < game.config.height/this.tileDimensions; i++){
            this.createRow(Math.floor(game.config.height/this.tileDimensions - i) * this.tileDimensions, sceneData);
        }
    }

    update(time, delta) {
        // Game Over
        if (this.sceneData.playerHealth < 1){
            let pointer = this.input.activePointer;
            if (pointer.isDown){
                this.scene.restart();
                this.initializeScene();
            }

            return;
        }

        let sceneData = this.sceneData;
        let deltaTime = delta / 1000;

        this.updatePlayerPhysics(sceneData, deltaTime);

        this.fireBullets(sceneData, time);

        this.updatePlayerSprite(sceneData, time);

        this.removeOffscreenBullets(sceneData);

        // True when you die
        if (this.checkCollisions(sceneData, time) == true){
            return;
        }

        this.moveBullets(sceneData, deltaTime);

        this.spawnWaves(sceneData, time, deltaTime);

        this.updateEnemies(sceneData, time, deltaTime, sceneData.sprite.player.x);
        
        this.removeEnemies(sceneData);

        this.createTiles(sceneData);

        this.moveTiles(sceneData, deltaTime);

        this.removeTiles(sceneData);

        this.updateScore(time);
    }

    createTiles(sceneData){
        if (sceneData.sprite.tiles.length == 0){
            this.createRow(-this.tileDimensions, sceneData);
            return;
        }

        let highestRowY = sceneData.sprite.tiles[sceneData.sprite.tiles.length - 1][0].y;
        if (highestRowY > 0){
            this.createRow(highestRowY - this.tileDimensions, sceneData);
        } 
    }

    createRow(y, sceneData) {
        let crosswalk = "";
        if (Math.random() < sceneData.crosswalkChance){
            crosswalk = "Crosswalk";
            sceneData.crosswalkChance = 0;
        }

        let row = [];
        for (let i = 0; i < game.config.width/this.tileDimensions; i++){
            let tileType = "";
            let tileDecorator = "";
            let rotation = 0;
            if (i == this.roadLeftOffset){
                tileType = "road" + crosswalk + "Left";
            }
            else if (i == this.roadRightOffset){
                tileType = "road" + crosswalk + "Right";
            }
            else if (i > this.roadLeftOffset && i < this.roadRightOffset){
                if (crosswalk == "" && Math.random() < 0.1){
                    tileType = "roadCrackedMiddle" + (Math.floor(Math.random() * 3) + 1);
                    rotation = this.getRandomRotation();
                }
                else{
                    tileType = "road" + crosswalk + "Middle";
                }
            }
            else{
                if (Math.random() < 0.8){
                    tileType = "grass1";
                }
                else if (Math.random() < 0.9){
                    tileType = "grass2";
                    rotation = this.getRandomRotation();
                }
                else{
                    tileType = "grass3";
                    rotation = this.getRandomRotation();
                }

                if (Math.random() < 0.05){
                    tileDecorator = "grassDecorator" + (Math.floor(Math.random() * 3) + 1);
                }
            }

            let temp = this.add.sprite(i * this.tileDimensions, y, tileType);
            temp.x += 0.5 * this.tileDimensions;
            temp.setDepth(-2);
            temp.setScale(this.tileDimensions / temp.width); 
            temp.angle = rotation;
            row.push(temp);

            if (tileDecorator != ""){
                let tempDeco = this.add.sprite(i * this.tileDimensions, y, tileDecorator);
                tempDeco.x += 0.5 * this.tileDimensions;
                tempDeco.setDepth(1);
                if (tileDecorator == "grassDecorator3"){
                    tempDeco.setScale(2 * this.tileDimensions / tempDeco.width); 
                }
                else{
                    tempDeco.setScale(this.tileDimensions / tempDeco.width); 
                }
                row.push(tempDeco);
            }
        }
        sceneData.sprite.tiles.push(row);

        sceneData.rowNumber += 1;
        sceneData.crosswalkChance += this.crosswalkChanceAdded;
    }

    getRandomRotation(){
        let randomRotation = Math.floor(Math.random() * 4); //0 - 3
        return randomRotation * 90;
    }
    
    // A center-radius AABB collision check
    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2) * this.shrinkCollisionsFactor) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2) * this.shrinkCollisionsFactor) return false;
        return true;
    }

    updateScore(time) {
        if (time/1000 - this.sceneData.lastScoreIncrementTime > 1){
            this.sceneData.score += 3;
            this.sceneData.lastScoreIncrementTime = time/1000;
        }

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
    }

    updatePlayerSprite(sceneData, time) {
        if (time/1000 - sceneData.playerLastFiredTime < this.playerShootDuration) {
            if (time/1000 - sceneData.playerLastHurtTime < this.playerDamageDuration){
                sceneData.sprite.player.setTexture("playerShootHurt");
            }
            else{
                sceneData.sprite.player.setTexture("playerShoot");
            }
        }
        else{
             if (time/1000 - sceneData.playerLastHurtTime < this.playerDamageDuration){
                sceneData.sprite.player.setTexture("playerIdleHurt");
            }
            else{
                sceneData.sprite.player.setTexture("playerIdle");
            }
        }
    }

    fireBullets(sceneData, time) {
        let pointer = this.input.activePointer;
        if (!this.space.isDown && !pointer.isDown){
            return;
        }

        if (sceneData.sprite.bullets.length >= this.maxBullets) {
            return;
        }

        if (time/1000 - sceneData.playerLastFiredTime < this.bulletReloadTime){
            return;
        }

        sceneData.sprite.bullets.push(this.add.sprite(
            sceneData.sprite.player.x + this.bulletXOffset, sceneData.sprite.player.y-(sceneData.sprite.player.displayHeight/2), "bullet")
        );
        sceneData.playerLastFiredTime = time/1000;
    }

    removeOffscreenBullets(sceneData) {
        let bulletsNew = [];
        for (let bullet of sceneData.sprite.bullets) {
            if (bullet.y < -(bullet.displayHeight/2)){
                bullet.destroy();
            }
            else{
                bulletsNew.push(bullet);
            }
        }
        sceneData.sprite.bullets = bulletsNew;
    }

    removeEnemies(sceneData) {
        let enemiesNew = [];
        for (let enemy of sceneData.sprite.enemies) {
            if (enemy.y > game.config.height + (enemy.displayHeight/2) || enemy.alpha <= 0){
                enemy.destroy();
            }
            else{
                enemiesNew.push(enemy);
            }
        }
        sceneData.sprite.enemies = enemiesNew;
    }

    removeTiles(sceneData) {
        if (sceneData.sprite.tiles.length == 0){
            return;
        }

        let row = sceneData.sprite.tiles[0];
        if (row[0].y > game.config.height + this.tileDimensions + (row[0].displayHeight/2)){
            for (let tile of row) {
                tile.destroy();
            }
            sceneData.sprite.tiles.shift();
        }
    }

    checkCollisions(sceneData, time) {
        for (let enemy of sceneData.sprite.enemies) {
            for (let bullet of sceneData.sprite.bullets) {
                if (!enemy.dead && this.collides(enemy, bullet)) {    
                    enemy.damage(1, time);

                    // Update score
                    this.sceneData.score += enemy.points;

                    // Sound
                    this.impactMetalSound.play();
                    
                    // put y offscreen, will get removed next update
                    bullet.y = -100;
                }
            }
        }


        for (let enemy of sceneData.sprite.enemies) {
            if (!enemy.dead && this.collides(enemy, sceneData.sprite.player)) {    
                enemy.damage(9999, time);

                // Update score
                this.sceneData.playerHealth -= 1;
                this.sceneData.playerLastHurtTime = time/1000;
                if (this.updateHealth() == true){
                    return true;
                };
            }
        }
        return false;
    }

    moveBullets(sceneData, deltaTime) {
        for (let bullet of sceneData.sprite.bullets) {
            bullet.y -= this.bulletSpeed * deltaTime;
        }
    }

    spawnWaves(sceneData, time, deltaTime) {
        if (time/1000 - sceneData.lastWaveEndTime < this.waveDowntime){
            if (sceneData.wave > 0){
                sceneData.text.wave.alpha += this.waveTextFadeSpeed * deltaTime;
            }
            return;
        }

        let enemiesThisWave = (this.enemyAmountIncreasePerWave * (this.sceneData.wave - 1)) + this.baseEnemyAmount;

        if (sceneData.wave == 0 || sceneData.enemiesSpawnedThisWave >= enemiesThisWave){
            if (sceneData.sprite.enemies.length == 0){
                sceneData.wave += 1;
                sceneData.enemiesSpawnedThisWave = 0;
                sceneData.lastWaveEndTime = time/1000;
                sceneData.text.wave.setText("Wave " + this.sceneData.wave);
            }
            return;
        }

        sceneData.text.wave.alpha -= this.waveTextFadeSpeed * deltaTime;

        let timeBetweenEnemies = this.waveTime / enemiesThisWave;
        if (time/1000 - sceneData.lastEnemySpawnTime > timeBetweenEnemies) {
            let temp;
            if (sceneData.wave < 5 || Math.random() < 0.5){
                temp = new Enemy(this, game.config.width/2, this.enemySpawnY, "basicZombieIdle", null, 100, 5, 3, "basic");
            }
            else{
                temp = new Enemy(this, game.config.width/2, this.enemySpawnY, "speedyZombieIdle", null, 125, 5, 2, "speedy");
            }


            temp.setScale(1.25);
            temp.angle = 90;
            temp.x = (Math.random() * (this.roadBoundRight - this.roadBoundLeft)) + this.roadBoundLeft;
            sceneData.sprite.enemies.push(temp);

            sceneData.lastEnemySpawnTime = time/1000;
            sceneData.enemiesSpawnedThisWave += 1;
        }
    }

    updateEnemies(sceneData, time, delta, playerX){
        for (let enemy of sceneData.sprite.enemies) {
            enemy.update(time, delta, playerX);
        }
    }

    updateHealth() {
        let sceneData = this.sceneData;
        let health = this.sceneData.playerHealth;

        sceneData.sprite["heart" + (health + 1)].alpha = 0.1;

        if (health < 1 ){
            sceneData.text.gameOver = this.add.bitmapText(game.config.width/2, game.config.height/2 - 40, "rocketSquare", "Game Over!");
            sceneData.text.gameOver.setDepth(4);
            sceneData.text.gameOver.setOrigin(0.5);
            sceneData.text.gameOver.setScale(1.5);

            // why do i put this much effort into an assignment lol
            let waveText = " wave";
            if (sceneData.wave > 1){
                waveText += "s"
            }
            sceneData.text.gameOverWaves = this.add.bitmapText(game.config.width/2, game.config.height/2, "rocketSquare", "You lasted " + sceneData.wave + waveText);
            sceneData.text.gameOverWaves.setDepth(4);
            sceneData.text.gameOverWaves.setOrigin(0.5);

            sceneData.text.gameOverRestart = this.add.bitmapText(game.config.width/2, game.config.height/2 + 40, "rocketSquare", "- click to restart -");
            sceneData.text.gameOverRestart.setDepth(4);
            sceneData.text.gameOverRestart.setOrigin(0.5);

            sceneData.sprite.blackSquare = this.add.sprite(game.config.width/2, game.config.height/2, "blackSquare");
            sceneData.sprite.blackSquare.setDepth(3);
            sceneData.sprite.blackSquare.setScale(50);
            sceneData.sprite.blackSquare.alpha = 0.5;

            return true;
        }        
    } 
    
    moveTiles(sceneData, deltaTime) {
        for (let tileRow of sceneData.sprite.tiles) {
            for (let tile of tileRow) {
                tile.y += this.tileSpeed * deltaTime;
            }
        }
    }

}
         