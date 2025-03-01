let player; //create the character
let bullets = [];
let shootCooldown = 0; //cooldown
let keysPressed = {}; //track hold keys
let enemies = []; //add enemies

//load image
let playerImg, enemyImg;

function preload() {
    //local path
    playerImg = loadImage("https://github.com/UoB-COMSM0166/2025-group-17/blob/Ted's-Work/Ted's_Local_work/Assets/player/Pete.png");
    enemyImg = loadImage("https://github.com/UoB-COMSM0166/2025-group-17/blob/Ted's-Work/Ted's_Local_work/Assets/enemy/horse.png");
}

function setup() {
    createCanvas(600, 400);
    player = new Player();

    for (let i = 0; i < 5; i++) {
        let enemy;
        let validSpawn = false;

        while (!validSpawn) {
            let enemyX = random(width);
            let enemyY = random(height);
            enemy = new Enemy(enemyX, enemyY);
            validSpawn = true;

            //Ensure enemies do not spawn overlapping each other or near the player
            for (let other of enemies) {
                if (dist(enemy.pos.x, enemy.pos.y, other.pos.x, other.pos.y) < enemy.size * 2 || dist(enemy.pos.x, enemy.pos.y, player.pos.x, player.pos.y) < player.size * 2) {
                    validSpawn = false;
                    break;
                }
            }
        }
        enemies.push(enemy);
    }
}

function draw() {
    background(30);

    if (player.hp > 0) {
        player.update();
        player.display();
    } else {
        fill(255, 0, 0);
        textSize(32);
        textAlign(CENTER, CENTER);
        text("Game Over", width / 2, height / 2);
        return;
    }

    //Draw Player's hp
    fill(255);
    textSize(16);
    textAlign(LEFT, TOP);
    text("HP: " + player.hp, 10, 10);


    //shooting system
    if (shootCooldown > 0) shootCooldown--; //reduce Cooldown

    //fire bullets continuously if key is held down
    if (shootCooldown === 0) {
        if (keysPressed[LEFT_ARROW]) bullets.push(new Bullet(player.pos, createVector(-1, 0)));
        if (keysPressed[RIGHT_ARROW]) bullets.push(new Bullet(player.pos, createVector(1, 0)));
        if (keysPressed[UP_ARROW]) bullets.push(new Bullet(player.pos, createVector(0, -1)));
        if (keysPressed[DOWN_ARROW]) bullets.push(new Bullet(player.pos, createVector(0, 1)));

        shootCooldown = 20; //fire rate
    }

    // Update and display bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].update()) {
            bullets.splice(i, 1);
        } else {
            bullets[i].display();
        }
    }

    // Update and display enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();
        enemies[i].display();
    }
}

/********* Key Pressed Detect **********/
//Detect when a key is pressed
function keyPressed() {
    keysPressed[keyCode] = true;
}
//Detect when a key is released
function keyReleased() {
    keysPressed[keyCode] = false;
}
/**************************************/

/**
//shoot while press the keys
function keyPressed(){
  if(shootCooldown === 0){
    if(keyCode===LEFT_ARROW) bullets.push(new Bullet(player.pos, createVector(-1, 0)));
    else if(keyCode===RIGHT_ARROW) bullets.push(new Bullet(player.pos, createVector(1, 0)));
    else if(keyCode===UP_ARROW) bullets.push(new Bullet(player.pos, createVector(0, -1)));
    else if(keyCode===DOWN_ARROW) bullets.push(new Bullet(player.pos, createVector(0, 1)));
    
    shootCooldown = 20; //add a short cooldown
  }
}
**/

class Entity {
    constructor(x, y, size, speed, color) {
        this.pos = createVector(x, y);
        this.size = size;
        this.speed = speed;
        this.color = color;
    }
    update() {
        //default behavior (to be overriden)
    }
    display() {
        fill(this.color);
        ellipse(this.pos.x, this.pos.y, this.size);
    }
}


/*********************Enemy Class******************/
class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 30, 1, color(255, 255, 255)); //white enemy, slow speed
        this.hp = 3;
        this.hitTimer = 0;
    }

    update() {
        if (this.hp <= 0) return; //prevent updating removed enemies

        let direction = p5.Vector.sub(player.pos, this.pos);
        direction.setMag(this.speed);
        this.pos.add(direction);

        if (this.hitTimer > 0) this.hitTimer--;

        // **Prevent enemies from overlapping**
        for (let other of enemies) {
            if (other !== this) {
                let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
                if (d < this.size) {
                    let pushAway = p5.Vector.sub(this.pos, other.pos);
                    pushAway.setMag(0.5);
                    this.pos.add(pushAway);
                }
            }
        }


        // **Check collision with player**
        let d = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);
        if (d < (this.size / 2 + player.size / 2)) {
            player.takeDamage();
            let pushBack = p5.Vector.sub(this.pos, player.pos);
            pushBack.setMag(10); // Push enemy back
            this.pos.add(pushBack);
        }
    }

    display() {
        if (this.hp <= 0) return; // Skip rendering if enemy is dead

        if (this.hitTimer > 0) {
            tint(255, 0, 0); //Flash red when hit
        } else {
            noTint();
        }
        //ellipse(this.pos.x, this.pos.y, this.size);
        imageMode(CENTER);
        image(enemyImg, this.pos.x, this.pos.y, this.size, this.size);
    }
}
/***************************************************/


/*********************Bullet Class******************/
class Bullet extends Entity {
    constructor(pos, dir) {
        super(pos.x, pos.y, 8, 5, color(0, 255, 255)); //Cyan bullet
        this.vel = dir.copy().mult(this.speed);
        this.range = 200; //max travel distance
        this.startPos = pos.copy(); //save initial pos
        this.steps = 4; //sub-step dividion for precise collision
    }

    update() {
        let step = p5.Vector.div(this.vel, this.steps);

        for (let i = 0; i < this.steps; i++) {
            this.pos.add(step);

            // **Check for enemy collision**
            for (let j = enemies.length - 1; j >= 0; j--) {
                let enemy = enemies[j];
                let d = dist(this.pos.x, this.pos.y, enemy.pos.x, enemy.pos.y);

                if (d < enemy.size / 2) {
                    enemy.hp--; // Reduce HP
                    enemy.hitTimer = 15; // Flash red
                    if (enemy.hp <= 0) {
                        enemies.splice(j, 1); // Remove dead enemy
                    }
                    return true; // Bullet should be removed
                }
            }

            // **Remove bullet if out of range**
            if (dist(this.pos.x, this.pos.y, this.startPos.x, this.startPos.y) > this.range) {
                return true;
            }
        }
        return false; //bullet continues moving
    }
}
/***************************************************/


/*********************Player Class******************/
class Player extends Entity {
    constructor() {
        super(width / 2, height / 2, 50, 3, color(255, 200, 0)); //size 50, speed 3, Yellow
        this.vel = createVector(0, 0);
        this.acceleration = 0.8;
        this.friction = 0.85;
        this.hp = 3;
        this.invincibleTimer = 0;
        this.blinkCounter = 0;
    }

    update() {
        if (this.hp <= 0) {
            return;
        }
        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
            this.blinkCounter = (this.blinkCounter + 1) % 10; //toggle every 10 frames
        }

        let input = createVector(0, 0);
        //wsad control the movement
        if (keyIsDown(65)) input.x = -1; //A
        if (keyIsDown(68)) input.x = 1;  //D
        if (keyIsDown(87)) input.y = -1;  //W
        if (keyIsDown(83)) input.y = 1;  //S

        input.normalize().mult(this.acceleration);
        this.vel.add(input);
        this.vel.mult(this.friction); //simulate friction
        this.pos.add(this.vel);

        this.pos.x = constrain(this.pos.x, 0, width);
        this.pos.y = constrain(this.pos.y, 0, height);
    }

    display() {
        if (this.invincibleTimer > 0 && this.blinkCounter < 5) {
            return;  //Player is invisible for half of the blinking cycle
        }
        //fill(this.color);
        //ellipse(this.pos.x, this.pos.y, this.size);
        imageMode(CENTER);
        image(playerImg, this.pos.x, this.pos.y, this.size, this.size);
    }

    takeDamage() {
        if (this.hp > 0 && this.invincibleTimer === 0) {
            this.hp--;
            this.invincibleTimer = 60; //// 1 seconds of invincibility
        }
    }
}
/***************************************************/
