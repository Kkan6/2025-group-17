class Enemy {
  constructor(x, y, hp) {
    this.hp = hp;
    this.position = createVector(x, y);
    this.size = createVector(
        hp === smallEnemyHp ? heightInPixel / 12 : largeEnemySize.w,
        hp === smallEnemyHp ? heightInPixel / 12 : largeEnemySize.h
    );
    this.velocity = createVector(random([-1, 1]), random([-1, 1]));
  }

  update() {
    this.position.add(this.velocity);
    if (this.position.x < leftBoundary || this.position.x > rightBoundary - this.size.x) {
      this.velocity.x *= -1;
    }
    if (this.position.y < topBoundary || this.position.y > bottomBoundary - this.size.y) {
      this.velocity.y *= -1;
    }
  }

  display() {
    fill('green');
    rect(this.position.x, this.position.y, this.size.x, this.size.y);
  }
}

