class Enemy extends Phaser.GameObjects.Sprite {

	constructor(scene, x, y, texture, frame, speed, points) {
		super(scene, x, y, texture, frame);

		scene.add.existing(this);

		this.points = points;
		this.speed = speed;

		return this;
	}

	update(time, delta) {
		this.y += this.speed * delta;
	}
}