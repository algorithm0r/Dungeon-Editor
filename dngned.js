window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

function AssetManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = [];
    this.downloadQueue = [];
}

AssetManager.prototype.queueDownload = function (path) {
    console.log(path.toString());
    this.downloadQueue.push(path);
}

AssetManager.prototype.isDone = function () {
    return (this.downloadQueue.length == this.successCount + this.errorCount);
}
AssetManager.prototype.downloadAll = function (callback) {
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        img.addEventListener("load", function () {
            console.log("dun: " + this.src.toString());
            that.successCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.addEventListener("error", function () {
            that.errorCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.src = path;
        this.cache[path] = img;
    }
}

AssetManager.prototype.getAsset = function(path){
    console.log(path.toString());
    return this.cache[path];
}


function GameEngine() {
    this.entities = [];
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
}

GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();

    console.log('game initialized');
}

GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startInput = function () {
    console.log('Starting input');

    var getXandY = function (e) {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top;

        if (x < 1024) {
            x = Math.floor(x / 32);
            y = Math.floor(y / 32);
        }

        return { x: x, y: y };
    }

    var that = this;

    this.ctx.canvas.addEventListener("click", function (e) {
        that.click = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousewheel", function (e) {
        that.wheel = e;
    }, false);

    console.log('Input started');
}

GameEngine.prototype.addEntity = function (entity) {
    console.log('added entity');
    this.entities.push(entity);
}

GameEngine.prototype.draw = function (drawCallback) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    if (drawCallback) {
        drawCallback(this);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function () {
    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) {
            entity.update();
        }
    }

    for (var i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function () {
    this.update();
    this.draw();
    this.click = null;
    this.wheel = null;
}

function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
}

Entity.prototype.draw = function (ctx) {
    if (this.game.showOutlines && this.radius) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.stroke();
        ctx.closePath();
    }
}

Entity.prototype.rotateAndCache = function (image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size / 2, size / 2);
    offscreenCtx.rotate(angle);
    offscreenCtx.translate(0, 0);
    offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
}

function Dungeon() {
    Entity.call(this, game, 0, 0);

    this.dungeon = new Array(32);
    for (var i = 0; i < 32; i++) {
        this.dungeon[i] = new Array(24);
    }
    this.sprites = new Array(48);

    var testDungeon = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,12,45,44,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,46,47,14,13,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,15,36,5,27,36,8,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,2,1,4,37,35,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,6,3,7,41,43,0,0,0,0,0,0,0,0,0,0,0], // bottom --->>>
                        [0,0,0,0,0,19,22,26,40,36,32,31,43,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,23,21,20,27,28,27,25,38,42,47,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,33,34,18,23,25,26,43,9,11,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,29,30,24,24,39,10,16,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];

    this.dungeon = testDungeon;

    this.sprites[0] = null;
    this.sprites[1] = ASSET_MANAGER.getAsset("./img/tile1.png");
    this.sprites[2] = ASSET_MANAGER.getAsset("./img/tile2.png");
    this.sprites[3] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile2.png"), Math.PI / 2);
    this.sprites[4] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile2.png"), Math.PI);
    this.sprites[5] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile2.png"), -Math.PI / 2);
    this.sprites[6] = ASSET_MANAGER.getAsset("./img/tile3.png");
    this.sprites[7] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile3.png"), Math.PI / 2);
    this.sprites[8] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile3.png"), Math.PI);
    this.sprites[9] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile3.png"), -Math.PI / 2);
    this.sprites[10] = ASSET_MANAGER.getAsset("./img/tile4.png");
    this.sprites[11] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile4.png"), Math.PI / 2);
    this.sprites[12] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile4.png"), Math.PI);
    this.sprites[13] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile4.png"), -Math.PI / 2);
    this.sprites[14] = ASSET_MANAGER.getAsset("./img/tile5.png");
    this.sprites[15] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile5.png"), Math.PI / 2);
    this.sprites[16] = ASSET_MANAGER.getAsset("./img/tile6.png");
    this.sprites[17] = ASSET_MANAGER.getAsset("./img/tile7.png");
    this.sprites[18] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile7.png"), Math.PI / 2);
    this.sprites[19] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile7.png"), Math.PI);
    this.sprites[20] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile7.png"), -Math.PI / 2);
    this.sprites[21] = ASSET_MANAGER.getAsset("./img/tile8.png");
    this.sprites[22] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile8.png"), Math.PI / 2);
    this.sprites[23] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile8.png"), Math.PI);
    this.sprites[24] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile8.png"), -Math.PI / 2);
    this.sprites[25] = ASSET_MANAGER.getAsset("./img/tile9.png");
    this.sprites[26] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile9.png"), Math.PI / 2);
    this.sprites[27] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile9.png"), Math.PI);
    this.sprites[28] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile9.png"), -Math.PI / 2);
    this.sprites[29] = ASSET_MANAGER.getAsset("./img/tile11.png");
    this.sprites[30] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile11.png"), Math.PI / 2);
    this.sprites[31] = ASSET_MANAGER.getAsset("./img/tile10.png");
    this.sprites[32] = ASSET_MANAGER.getAsset("./img/tile12.png");
    this.sprites[33] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile12.png"), Math.PI / 2);
    this.sprites[34] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile12.png"), Math.PI);
    this.sprites[35] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile12.png"), -Math.PI / 2);
    this.sprites[36] = ASSET_MANAGER.getAsset("./img/tile13.png");
    this.sprites[37] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile13.png"), Math.PI / 2);
    this.sprites[38] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile13.png"), Math.PI);
    this.sprites[39] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile13.png"), -Math.PI / 2);
    this.sprites[40] = ASSET_MANAGER.getAsset("./img/tile14.png");
    this.sprites[41] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile14.png"), Math.PI / 2);
    this.sprites[42] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile14.png"), Math.PI);
    this.sprites[43] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile14.png"), -Math.PI / 2);
    this.sprites[44] = ASSET_MANAGER.getAsset("./img/tile15.png");
    this.sprites[45] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile15.png"), Math.PI / 2);
    this.sprites[46] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile15.png"), Math.PI);
    this.sprites[47] = this.rotateAndCache(ASSET_MANAGER.getAsset("./img/tile15.png"), -Math.PI / 2);

}

Dungeon.prototype = new Entity();
Dungeon.prototype.constructor = Dungeon;

Dungeon.prototype.update = function () {
    if (this.game.click) {
        if (this.game.click.x < 32) {
            this.dungeon[this.game.click.x][this.game.click.y] = game.mouseShadow.tile;
        }
    }
    Entity.prototype.update.call(this);
}

Dungeon.prototype.draw = function (ctx) {
    for (var i = 0; i < 32; i++) {
        for (var j = 0; j < 24; j++) {
            var sprite = this.sprites[this.dungeon[i][j]];
            if (sprite) {
                ctx.drawImage(sprite, i * 32, j * 32);
            }
        }
    }
}

function TilePalette(game) {
    Entity.call(this, game, 33, 2);
    this.sprites = new Array(15);
    this.tiles = new Array(15);

    this.sprites[0] = ASSET_MANAGER.getAsset("./img/tile1.png");
    this.sprites[1] = ASSET_MANAGER.getAsset("./img/tile2.png");
    this.sprites[2] = ASSET_MANAGER.getAsset("./img/tile3.png");
    this.sprites[3] = ASSET_MANAGER.getAsset("./img/tile4.png");
    this.sprites[4] = ASSET_MANAGER.getAsset("./img/tile5.png");
    this.sprites[5] = ASSET_MANAGER.getAsset("./img/tile6.png");
    this.sprites[6] = ASSET_MANAGER.getAsset("./img/tile7.png");
    this.sprites[7] = ASSET_MANAGER.getAsset("./img/tile8.png");
    this.sprites[8] = ASSET_MANAGER.getAsset("./img/tile9.png");
    this.sprites[9] = ASSET_MANAGER.getAsset("./img/tile10.png");
    this.sprites[10] = ASSET_MANAGER.getAsset("./img/tile11.png");
    this.sprites[11] = ASSET_MANAGER.getAsset("./img/tile12.png");
    this.sprites[12] = ASSET_MANAGER.getAsset("./img/tile13.png");
    this.sprites[13] = ASSET_MANAGER.getAsset("./img/tile14.png");
    this.sprites[14] = ASSET_MANAGER.getAsset("./img/tile15.png");

    this.tiles[0] = 1;
    this.tiles[1] = 2;
    this.tiles[2] = 6;
    this.tiles[3] = 10;
    this.tiles[4] = 14;
    this.tiles[5] = 16;
    this.tiles[6] = 17;
    this.tiles[7] = 21;
    this.tiles[8] = 25;
    this.tiles[9] = 29;
    this.tiles[10] = 31;
    this.tiles[11] = 32;
    this.tiles[12] = 36;
    this.tiles[13] = 40;
    this.tiles[14] = 44;

}

TilePalette.prototype = new Entity();
TilePalette.prototype.constructor = TilePalette;

TilePalette.prototype.update = function () {
    if (game.click) {
        if ((game.click.x >= this.x * 32) && (game.click.x < (this.x + 1) * 32)) {
            flag = false; //true if click on button
            for (var i = 0; i < 15; i++) {
                if ((game.click.y >= (this.y + i) * 32 + 8 * i) && (game.click.y < (this.y + i + 1) * 32 + 8 * i)) {
                    flag = true;
                    break;
                }
            }
            if (flag) {
                this.game.mouseShadow.changeTile(this.tiles[i]);
            }
        }
    }
}

TilePalette.prototype.draw = function () {
    for (var i = 0; i < 15; i++) {
        ctx.drawImage(this.sprites[i], this.x * 32, (this.y + i) * 32 + 8*i);
    }
}

function MouseShadow(game) {
    Entity.call(this, game, 0, 0);
    this.tile = 1;
    this.sprite = ASSET_MANAGER.getAsset("./img/tile1.png");
    this.visible = true;

    this.scrollUp = new Array(48);
    this.scrollDown = new Array(48);

    this.scrollUp[0] = 0;
    this.scrollUp[1] = 1;
    this.scrollUp[2] = 5;
    this.scrollUp[3] = 2;
    this.scrollUp[4] = 3;
    this.scrollUp[5] = 4;
    this.scrollUp[6] = 9;
    this.scrollUp[7] = 6;
    this.scrollUp[8] = 7;
    this.scrollUp[9] = 8;
    this.scrollUp[10] = 13;
    this.scrollUp[11] = 10;
    this.scrollUp[12] = 11;
    this.scrollUp[13] = 12;
    this.scrollUp[14] = 15;
    this.scrollUp[15] = 14;
    this.scrollUp[16] = 16;
    this.scrollUp[17] = 20;
    this.scrollUp[18] = 17;
    this.scrollUp[19] = 18;
    this.scrollUp[20] = 19;
    this.scrollUp[21] = 24;
    this.scrollUp[22] = 21;
    this.scrollUp[23] = 22;
    this.scrollUp[24] = 23;
    this.scrollUp[25] = 28;
    this.scrollUp[26] = 25;
    this.scrollUp[27] = 26;
    this.scrollUp[28] = 27;
    this.scrollUp[29] = 30;
    this.scrollUp[30] = 29;
    this.scrollUp[31] = 31;
    this.scrollUp[32] = 35;
    this.scrollUp[33] = 32;
    this.scrollUp[34] = 33;
    this.scrollUp[35] = 34;
    this.scrollUp[36] = 39;
    this.scrollUp[37] = 36;
    this.scrollUp[38] = 37;
    this.scrollUp[39] = 38;
    this.scrollUp[40] = 43;
    this.scrollUp[41] = 40;
    this.scrollUp[42] = 41;
    this.scrollUp[43] = 42;
    this.scrollUp[44] = 47;
    this.scrollUp[45] = 44;
    this.scrollUp[46] = 45;
    this.scrollUp[47] = 46;

    for (var i = 0; i < 48; i++) {
        this.scrollDown[this.scrollUp[i]] = i;
    }
}

MouseShadow.prototype = new Entity();
MouseShadow.prototype.constructor = MouseShadow;

MouseShadow.prototype.changeTile = function (tile) {
    this.tile = tile;
    this.sprite = game.dungeon.sprites[tile];
}

MouseShadow.prototype.update = function () {
    if (this.game.wheel) {
        if (this.game.wheel.wheelDelta > 0) {
            this.changeTile(this.scrollUp[this.tile]);
        }
        else {
            this.changeTile(this.scrollDown[this.tile]);
        }
    }
    if (this.game.mouse) {
        this.x = this.game.mouse.x;
        this.y = this.game.mouse.y;
    }
    Entity.prototype.update.call(this);
}

MouseShadow.prototype.draw = function (ctx) {
    if (this.x < 32) {
        ctx.drawImage(this.sprite, this.x * 32, this.y * 32);
    }
}

function DungeonEd() {
    GameEngine.call(this);
}
DungeonEd.prototype = new GameEngine();
DungeonEd.prototype.constructor = DungeonEd;

DungeonEd.prototype.start = function() {
    this.mouseShadow = new MouseShadow(this);
    this.dungeon = new Dungeon(this);
    this.palette = new TilePalette(this);
    this.addEntity(this.dungeon);
    this.addEntity(this.mouseShadow);
    this.addEntity(this.palette);
    GameEngine.prototype.start.call(this);
}

DungeonEd.prototype.update = function() {       
    GameEngine.prototype.update.call(this);
}

DungeonEd.prototype.draw = function() {
    GameEngine.prototype.draw.call(this);
}


console.log("starting up da sheild");
var canvas = document.getElementById('gameWorld');
var ctx = canvas.getContext('2d');
var game = new DungeonEd();

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./img/tile1.png");
ASSET_MANAGER.queueDownload("./img/tile2.png");
ASSET_MANAGER.queueDownload("./img/tile3.png");
ASSET_MANAGER.queueDownload("./img/tile4.png");
ASSET_MANAGER.queueDownload("./img/tile5.png");
ASSET_MANAGER.queueDownload("./img/tile6.png");
ASSET_MANAGER.queueDownload("./img/tile7.png");
ASSET_MANAGER.queueDownload("./img/tile8.png");
ASSET_MANAGER.queueDownload("./img/tile9.png");
ASSET_MANAGER.queueDownload("./img/tile10.png");
ASSET_MANAGER.queueDownload("./img/tile11.png");
ASSET_MANAGER.queueDownload("./img/tile12.png");
ASSET_MANAGER.queueDownload("./img/tile13.png");
ASSET_MANAGER.queueDownload("./img/tile14.png");
ASSET_MANAGER.queueDownload("./img/tile15.png");

ASSET_MANAGER.downloadAll(function () {
    game.init(ctx);
    game.start();
});