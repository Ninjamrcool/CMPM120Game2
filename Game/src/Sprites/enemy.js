class Enemy extends Phaser.GameObjects.Sprite {

	constructor(scene, x, y, texture, frame, speed, points, health) {
		super(scene, x, y, texture, frame);

		scene.add.existing(this);

		// Constants
		this.points = points;
		this.speed = speed;
		this.fadeSpeed = 2;
		this.damageDuration = 0.15;

		// Dynamic
		this.health = health;
		this.dead = false;

		return this;
	}

	update(time, delta) {
		if (this.dead){
			this.alpha -= this.fadeSpeed * delta;
			if (this.alpha <= 0){
				this.destroy();
			}
			return;
		}

		if (time/1000 - this.timeDamaged < this.damageDuration){
            this.setTexture("zombieHurt");
		}
		else{
            this.setTexture("zombieIdle");
		}

		this.y += this.speed * delta;
	}

	damage(damage, time){
		this.health -= damage;
		if (this.health <= 0) {
			this.dead = true;
		}
		else{
			this.timeDamaged = time/1000;
		}
	}
}