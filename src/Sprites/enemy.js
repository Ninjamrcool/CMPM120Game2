class Enemy extends Phaser.GameObjects.Sprite {

	constructor(scene, x, y, texture, frame, speed, points, health, typeString) {
		super(scene, x, y, texture, frame);

		scene.add.existing(this);

		// Constants --------------
		this.points = points;
		this.speed = speed;
		this.fadeSpeed = 2;
		this.damageDuration = 0.15;
		this.typeString = typeString;
		this.minDistanceToMove = 25;
		// Speedy
		this.horizontalSpeed = 50;
		// Tank
		this.tankEnemyFireCooldown = 4.5;

		// Dynamic --------------
		this.health = health;
		this.dead = false;
		this.lastFireTime = 0;

		return this;
	}

	update(time, delta, scene, playerX) {
		if (time/1000 - this.timeDamaged < this.damageDuration){
            this.setTexture(this.typeString + "ZombieHurt");
		}
		else{
            this.setTexture(this.typeString + "ZombieIdle");
		}

		if (this.dead){
			this.alpha -= this.fadeSpeed * delta;
			if (this.alpha <= 0){
				this.destroy();
			}
			return;
		}

		this.y += this.speed * delta;

		if (this.typeString == "speedy" && Math.abs(playerX - this.x) > this.minDistanceToMove){
			if (playerX < this.x){
				this.x -= this.horizontalSpeed * delta;
			}
			else{
				this.x += this.horizontalSpeed * delta;
			}
		}

		if (this.typeString == "tank" && time/1000 - this.lastFireTime > this.tankEnemyFireCooldown){
			let temp = scene.add.sprite(this.x, this.y-(this.displayHeight/2), "tire1");
			temp.setScale(2);
			temp.setDepth(-1);
			temp.angle = -90;
			temp.y += temp.displayHeight;
			scene.sceneData.sprite.tankBullets.push(temp);
			temp.play("tire");

			this.lastFireTime = time/1000;
		}
	}

	damage(damage, time){
		this.health -= damage;
		this.timeDamaged = time/1000;
		if (this.health <= 0) {
			this.dead = true;
		}
	}
}