
// La función se llama cuando la ventana esté completamente cargada
window.onload = function () {
  // Get the canvas and context
  var canvas = document.getElementById("viewport");
  var context = canvas.getContext("2d");

  // Tiempo y frames por segundo
  var lastframe = 0;
  var fpstime = 0;
  var framecount = 0;
  var fps = 0;

  var initialized = false;

  // Imágenes
  var images = [];
  var tileimage;

  // Imágenes cargando global variables
  var loadcount = 0;
  var loadtotal = 0;
  var preloaded = false;

  // Cargar imágenes
  function loadImages(imagefiles) {
    // Iniciar variables
    loadcount = 0;
    loadtotal = imagefiles.length;
    preloaded = false;

    // Cargar las imágenes
    var loadedimages = [];
    for (var i = 0; i < imagefiles.length; i++) {
      var image = new Image();
      image.onload = function () {
        loadcount++;
        if (loadcount == loadtotal) {
          preloaded = true;
        }
      };

      image.src = imagefiles[i];

      loadedimages[i] = image;
    }

    return loadedimages;
  }

  // Level propiedades
  var Level = function (columns, rows, tilewidth, tileheight) {
    this.columns = columns;
    this.rows = rows;
    this.tilewidth = tilewidth;
    this.tileheight = tileheight;

    this.tiles = [];
    for (var i = 0; i < this.columns; i++) {
      this.tiles[i] = [];
      for (var j = 0; j < this.rows; j++) {
        this.tiles[i][j] = 0;
      }
    }
  };

  // Genera un default level with walls
  Level.prototype.generate = function () {
    for (var i = 0; i < this.columns; i++) {
      for (var j = 0; j < this.rows; j++) {
        if (i == 0 || i == this.columns - 1 || j == 0 || j == this.rows - 1) {
          this.tiles[i][j] = 1;
        } else {
          this.tiles[i][j] = 0;
        }
      }
    }
  };

  // Snake
  var Snake = function () {
    this.init(0, 0, 1, 10, 1);
  };

  // Direcciones: Up, Right, Down, Left
  Snake.prototype.directions = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];

  // Inicializa la snake en una ubicación
  Snake.prototype.init = function (x, y, direction, speed, numsegments) {
    this.x = x;
    this.y = y;
    this.direction = direction; // Up, Right, Down, Left
    this.speed = speed; // velocidad
    this.movedelay = 0;

    // Restablece los segmentos y agrega nuevos
    this.segments = [];
    this.growsegments = 0;
    for (var i = 0; i < numsegments; i++) {
      this.segments.push({
        x: this.x - i * this.directions[direction][0],
        y: this.y - i * this.directions[direction][1],
      });
    }
  };

  Snake.prototype.grow = function () {
    this.growsegments++;
  };

  Snake.prototype.tryMove = function (dt) {
    this.movedelay += dt;
    var maxmovedelay = 1 / this.speed;
    if (this.movedelay > maxmovedelay) {
      return true;
    }
    return false;
  };

  // Obtiene la posición del siguiente movimiento
  Snake.prototype.nextMove = function () {
    var nextx = this.x + this.directions[this.direction][0];
    var nexty = this.y + this.directions[this.direction][1];
    return { x: nextx, y: nexty };
  };

  // Mueve snake en la dirección
  Snake.prototype.move = function () {
    // Obtiene el siguiente movimiento y modifica la posición
    var nextmove = this.nextMove();
    this.x = nextmove.x;
    this.y = nextmove.y;

    // Obtiene la posición del último segmento
    var lastseg = this.segments[this.segments.length - 1];
    var growx = lastseg.x;
    var growy = lastseg.y;

    // Mueve el segmento a la posición del anterior
    for (var i = this.segments.length - 1; i >= 1; i--) {
      this.segments[i].x = this.segments[i - 1].x;
      this.segments[i].y = this.segments[i - 1].y;
    }

    // Crece un segmento si lo necesita
    if (this.growsegments > 0) {
      this.segments.push({ x: growx, y: growy });
      this.growsegments--;
    }

    // Mueve el primer segmento
    this.segments[0].x = this.x;
    this.segments[0].y = this.y;

    this.movedelay = 0;
  };

  // Crea objetos
  var snake = new Snake();
  var level = new Level(20, 15, 32, 32);

  // Variables
  var score = 0; // Score
  var gameover = true; // Game is over
  var gameovertime = 1; // How long we have been game over
  var gameoverdelay = 0.5; // Waiting time after game over

  // Inicia el juego
  function init() {
    // Cargar imágenes
    images = loadImages(["snake-graphics.png"]);
    tileimage = images[0];

    // Añade mouse events
    canvas.addEventListener("mousedown", onMouseDown);

    // Añade keyboard events
    document.addEventListener("keydown", onKeyDown);

    // New game
    newGame();
    gameover = true;

    // Enter main loop
    main(0);
  }

  // Revisa si se puede intentar de nuevo
  function tryNewGame() {
    if (gameovertime > gameoverdelay) {
      newGame();
      gameover = false;
    }
  }

  function newGame() {
    // Inicia snake
    snake.init(10, 10, 1, 10, 4);

    // Genera el default level
    level.generate();

    // Añade una manzana
    addApple();

    // Inicia el puntaje
    score = 0;

    // Inicia las variables
    gameover = false;
  }

  // Agrega una manzana al nivel en una posición vacía
  function addApple() {
    var valid = false;
    while (!valid) {
      // Obtiene una posición random
      var ax = randRange(0, level.columns - 1);
      var ay = randRange(0, level.rows - 1);

      // Se asegura de que snake no se superponga a la nueva manzana
      var overlap = false;
      for (var i = 0; i < snake.segments.length; i++) {
        var sx = snake.segments[i].x;
        var sy = snake.segments[i].y;

        if (ax == sx && ay == sy) {
          overlap = true;
          break;
        }
      }

      if (!overlap && level.tiles[ax][ay] == 0) {
        level.tiles[ax][ay] = 2;
        valid = true;
      }
    }
  }

  // Main loop
  function main(tframe) {
    // Request animation frames
    window.requestAnimationFrame(main);

    if (!initialized) {
      // Preloader

      context.clearRect(0, 0, canvas.width, canvas.height);

      var loadpercentage = loadcount / loadtotal;
      context.strokeStyle = "#ff8080";
      context.lineWidth = 3;
      context.strokeRect(18.5, 0.5 + canvas.height - 51, canvas.width - 37, 32);
      context.fillStyle = "#ff8080";
      context.fillRect(
        18.5,
        0.5 + canvas.height - 51,
        loadpercentage * (canvas.width - 37),
        32
      );

      var loadtext = "Loaded " + loadcount + "/" + loadtotal + " images";
      context.fillStyle = "#000000";
      context.font = "16px Verdana";
      context.fillText(loadtext, 18, 0.5 + canvas.height - 63);

      if (preloaded) {
        initialized = true;
      }
    } else {
      // Actualiza el juego
      update(tframe);
      render();
    }
  }

  // Actualiza el estado del juego
  function update(tframe) {
    var dt = (tframe - lastframe) / 1000;
    lastframe = tframe;

    updateFps(dt);

    if (!gameover) {
      updateGame(dt);
    } else {
      gameovertime += dt;
    }
  }

  function updateGame(dt) {
    // Mueve snake
    if (snake.tryMove(dt)) {
      // Verifica snake collisions

      // Obtiene las cordenadas del siguiente movimiento
      var nextmove = snake.nextMove();
      var nx = nextmove.x;
      var ny = nextmove.y;

      if (nx >= 0 && nx < level.columns && ny >= 0 && ny < level.rows) {
        if (level.tiles[nx][ny] == 1) {
          gameover = true;
        }

        for (var i = 0; i < snake.segments.length; i++) {
          var sx = snake.segments[i].x;
          var sy = snake.segments[i].y;

          if (nx == sx && ny == sy) {
            gameover = true;
            break;
          }
        }

        if (!gameover) {
          snake.move();

          if (level.tiles[nx][ny] == 2) {
            // Remueve la manzana
            level.tiles[nx][ny] = 0;

            // Añade una nueva manzana
            addApple();

            // Snake crece
            snake.grow();

            score++;
          }
        }
      } else {
        gameover = true;
      }

      if (gameover) {
        gameovertime = 0;
      }
    }
  }

  function updateFps(dt) {
    if (fpstime > 0.25) {
      // Calculate fps
      fps = Math.round(framecount / fpstime);

      // Reset time and framecount
      fpstime = 0;
      framecount = 0;
    }

    // Increase time and framecount
    fpstime += dt;
    framecount++;
  }

  // Render the game
  function render() {
    // Draw background
    context.fillStyle = "#577ddb";
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawLevel();
    drawSnake();

    // Game over
    if (gameover) {
      context.fillStyle = "rgba(0, 0, 0, 0.5)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = "#ffffff";
      context.font = "24px Verdana";
      drawCenterText(
        "Press any key to start!",
        0,
        canvas.height / 2,
        canvas.width
      );
    }
  }

  // Draw the level tiles
  function drawLevel() {
    for (var i = 0; i < level.columns; i++) {
      for (var j = 0; j < level.rows; j++) {
        // Get the current tile and location
        var tile = level.tiles[i][j];
        var tilex = i * level.tilewidth;
        var tiley = j * level.tileheight;

        // Draw tiles based on their type
        if (tile == 0) {
          // Empty space
          context.fillStyle = "#f7e697";
          context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
        } else if (tile == 1) {
          // Wall
          context.fillStyle = "#bcae76";
          context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
        } else if (tile == 2) {
          // Apple

          // Draw apple background
          context.fillStyle = "#f7e697";
          context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);

          // Draw the apple image
          var tx = 0;
          var ty = 3;
          var tilew = 64;
          var tileh = 64;
          context.drawImage(
            tileimage,
            tx * tilew,
            ty * tileh,
            tilew,
            tileh,
            tilex,
            tiley,
            level.tilewidth,
            level.tileheight
          );
        }
      }
    }
  }

  // Draw the snake
  function drawSnake() {
    // Loop over every snake segment
    for (var i = 0; i < snake.segments.length; i++) {
      var segment = snake.segments[i];
      var segx = segment.x;
      var segy = segment.y;
      var tilex = segx * level.tilewidth;
      var tiley = segy * level.tileheight;

      // Sprite column and row that gets calculated
      var tx = 0;
      var ty = 0;

      if (i == 0) {
        // Head; Determine the correct image
        var nseg = snake.segments[i + 1]; // Next segment
        if (segy < nseg.y) {
          // Up
          tx = 3;
          ty = 0;
        } else if (segx > nseg.x) {
          // Right
          tx = 4;
          ty = 0;
        } else if (segy > nseg.y) {
          // Down
          tx = 4;
          ty = 1;
        } else if (segx < nseg.x) {
          // Left
          tx = 3;
          ty = 1;
        }
      } else if (i == snake.segments.length - 1) {
        // Tail; Determine the correct image
        var pseg = snake.segments[i - 1]; // Prev segment
        if (pseg.y < segy) {
          // Up
          tx = 3;
          ty = 2;
        } else if (pseg.x > segx) {
          // Right
          tx = 4;
          ty = 2;
        } else if (pseg.y > segy) {
          // Down
          tx = 4;
          ty = 3;
        } else if (pseg.x < segx) {
          // Left
          tx = 3;
          ty = 3;
        }
      } else {
        // Body; Determine the correct image
        var pseg = snake.segments[i - 1]; // Previous segment
        var nseg = snake.segments[i + 1]; // Next segment
        if (
          (pseg.x < segx && nseg.x > segx) ||
          (nseg.x < segx && pseg.x > segx)
        ) {
          // Horizontal Left-Right
          tx = 1;
          ty = 0;
        } else if (
          (pseg.x < segx && nseg.y > segy) ||
          (nseg.x < segx && pseg.y > segy)
        ) {
          // Angle Left-Down
          tx = 2;
          ty = 0;
        } else if (
          (pseg.y < segy && nseg.y > segy) ||
          (nseg.y < segy && pseg.y > segy)
        ) {
          // Vertical Up-Down
          tx = 2;
          ty = 1;
        } else if (
          (pseg.y < segy && nseg.x < segx) ||
          (nseg.y < segy && pseg.x < segx)
        ) {
          // Angle Top-Left
          tx = 2;
          ty = 2;
        } else if (
          (pseg.x > segx && nseg.y < segy) ||
          (nseg.x > segx && pseg.y < segy)
        ) {
          // Angle Right-Up
          tx = 0;
          ty = 1;
        } else if (
          (pseg.y > segy && nseg.x > segx) ||
          (nseg.y > segy && pseg.x > segx)
        ) {
          // Angle Down-Right
          tx = 0;
          ty = 0;
        }
      }

      // Draw the image of the snake part
      context.drawImage(
        tileimage,
        tx * 64,
        ty * 64,
        64,
        64,
        tilex,
        tiley,
        level.tilewidth,
        level.tileheight
      );
    }
  }

  // Draw text that is centered
  function drawCenterText(text, x, y, width) {
    var textdim = context.measureText(text);
    context.fillText(text, x + (width - textdim.width) / 2, y);
  }

  // Get a random int between low and high, inclusive
  function randRange(low, high) {
    return Math.floor(low + Math.random() * (high - low + 1));
  }

  // Mouse event handlers
  function onMouseDown(e) {
    // Get the mouse position
    var pos = getMousePos(canvas, e);

    if (gameover) {
      // Start a new game
      tryNewGame();
    } else {
      // Change the direction of the snake
      snake.direction = (snake.direction + 1) % snake.directions.length;
    }
  }

  // Keyboard event handler
  function onKeyDown(e) {
    if (gameover) {
      tryNewGame();
    } else {
      if (e.keyCode == 37 || e.keyCode == 65) {
        // Left or A
        if (snake.direction != 1) {
          snake.direction = 3;
        }
      } else if (e.keyCode == 38 || e.keyCode == 87) {
        // Up or W
        if (snake.direction != 2) {
          snake.direction = 0;
        }
      } else if (e.keyCode == 39 || e.keyCode == 68) {
        // Right or D
        if (snake.direction != 3) {
          snake.direction = 1;
        }
      } else if (e.keyCode == 40 || e.keyCode == 83) {
        // Down or S
        if (snake.direction != 0) {
          snake.direction = 2;
        }
      }

      // Grow for demonstration purposes
      if (e.keyCode == 32) {
        snake.grow();
      }
    }
  }

  // Get the mouse position
  function getMousePos(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(
        ((e.clientX - rect.left) / (rect.right - rect.left)) * canvas.width
      ),
      y: Math.round(
        ((e.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height
      ),
    };
  }

  // Call init to start the game
  init();
};
