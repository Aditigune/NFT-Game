/** Connect to Moralis server */
const serverUrl = "";
const appId = "";
Moralis.start({ serverUrl, appId });

/** Add from here down */
async function login() {
  let user = Moralis.User.current();
  if (!user) {
    try {
      user = await Moralis.authenticate({ signingMessage: "Hello World!" });
      //console.log(user)
      //console.log(user.get('ethAddress'))
      launch();
    } catch (error) {
      console.log(error);
    }
  }
}

async function logOut() {
  await Moralis.User.logOut();
  console.log("logged out");
  location.reload();
}

document.getElementById("btn-login").onclick = login;
document.getElementById("btn-logout").onclick = logOut;

/** Useful Resources  */

// https://docs.moralis.io/moralis-server/users/crypto-login
// https://docs.moralis.io/moralis-server/getting-started/quick-start#user
// https://docs.moralis.io/moralis-server/users/crypto-login#metamask

/** Moralis Forum */

// https://forum.moralis.io/
// phaser

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

//var game = new Phaser.Game(config);
var game;

var platforms;

var player;
var competitors = {};

var cursors;

var jumpHeight = -300;
var that;

async function launch() {
  let user = Moralis.User.current();
  if (!user) {
    try {
      console.log("PLEASE LOG IN WITH METAMASK");
    } catch (error) {
      console.log(error);
    }
  } else {
    console.log(user.get("ethAddress") + " " + " is logged in.");
    game = new Phaser.Game(config);
  }
}

launch();

//loading asset
async function preload() {
  that = this;
  this.load.image("background", "/assets/png/BG.png");
  this.load.image("ground", "/assets/png/Tiles/Tile (2).png");
  this.load.image("comptetitor", "/assets/png/gotchi.png");

  // fetch player SVG
  const numericTraits = [1, 99, 99, 99, 1, 1]; // UI to change the traits
  const equippedWearables = [23, 61, 2, 43, 0, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0];

  const rawSVG = await Moralis.Cloud.run("getSVG", {
    numericTraits: numericTraits,
    equippedWearables: equippedWearables,
  });

  const svgBlob = new Blob([rawSVG], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  this.load.image("player", url);

  this.load.on(
    "filecomplete",
    function () {
      initPlayer();
    },
    this
  );
  this.load.start();
}

async function initPlayer() {
  player = that.physics.add
    .sprite(500, 250, "player")
    .setScale(0.3)
    .refreshBody();
  player.setBounce(0.3);
  that.physics.add.collider(player, platforms);
}
//initial setup
async function create() {
  this.add.image(400, 300, "background").setScale(0.55);
  platforms = this.physics.add.staticGroup();
  platforms.create(470, 400, "ground").setScale(0.5).refreshBody();
  platforms.create(535, 400, "ground").setScale(0.5).refreshBody();
  platforms.create(600, 400, "ground").setScale(0.5).refreshBody();
  platforms.create(665, 400, "ground").setScale(0.5).refreshBody();
  platforms.create(730, 400, "ground").setScale(0.5).refreshBody();

  player = this.physics.add
    .sprite(500, 300, "player")
    .setScale(0.3)
    .refreshBody();
  player.setBounce(0.1);
  // player.setCollideWorldBounds(true);

  this.physics.add.collider(player, platforms);
  cursors = this.input.keyboard.createCursorKeys();

  let user = Moralis.User.current();
  let query = new Moralis.Query("PlayerPosition");
  let subscription = await query.subscribe();
  subscription.on("create", (plocation) => {
    // console.log("plocation->", plocation.get("player"));
    // console.log("user->" ,user.get("ethAddress"));
    if (plocation.get("player") != user.get("ethAddress")) {
      //if first time seeing
      if (competitors[plocation.get("player")] == undefined) {
        competitors[plocation.get("player")] = this.physics.add
          .sprite(plocation.get("x"), plocation.get("y"), "competitor")
          .setScale(0.3);
      } else {
        competitors[plocation.get("player")].x = plocation.get("x");
        competitors[plocation.get("player")].y = plocation.get("y");
      }

      console.log("someone moved");
      console.log("player", plocation.get("player"));
      console.log("new X", plocation.get("x"));
      console.log("new Y", plocation.get("y"));
    }
  });
}

//60 times per second - 60 frames per second
async function update() {
  //console.log("upload");
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
  } else {
    player.setVelocityX(0);
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(jumpHeight);
  }

  if (player.lastX != player.x || player.lastY != player.y) {
    let user = Moralis.User.current();

    const PlayerPosition = Moralis.Object.extend("PlayerPosition");
    const playerPosition = new PlayerPosition();

    playerPosition.set("player", user.get("ethAddress"));
    playerPosition.set("x", player.x);
    playerPosition.set("y", player.y);

    player.lastX = player.x;
    player.lastY = player.y;

    await playerPosition.save();
  }
}
