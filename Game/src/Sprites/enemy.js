class Enemy extends Phaser.GameObjects.Sprite {

	constructor(scene, x, y, texture, frame, speed, points, health, typeString) {
		super(scene, x, y, texture, frame);

		scene.add.existing(this);

		// Constants
		this.points = points;
		this.speed = speed;
		this.fadeSpeed = 2;
		this.damageDuration = 0.15;
		this.typeString = typeString;
		this.minDistanceToMove = 25;
		this.horizontalSpeed = 50;

		// Dynamic
		this.health = health;
		this.dead = false;

		return this;
	}

	update(time, delta, playerX) {
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
	}

	damage(damage, time){
		this.health -= damage;
		this.timeDamaged = time/1000;
		if (this.health <= 0) {
			this.dead = true;
		}
	}
}