const tiles = document.querySelectorAll('.tile');
const scoreContainer = document.querySelector('#score');
const LEFT = 0;
const RIGHT = 1;
const UP = 2;
const DOWN = 3;
let seed;
const backgroundColors = [
  '#eee4da',  // 0
  '#eee4da',  // 2
  '#ede0c8',  // 4
  '#f2b179',  // 8
  '#f59563',  // 16
  '#f67c5f',  // 32
  '#f65e3b',  // 64
  '#edcf72',  // 128
  '#edcc61',  // 256
  '#edc850',  // 512
  '#edc53f',  // 1024
  '#edc22e',  // 2048
];
let score = 0;

const board = new Array(16).fill(0);
const cached = new Map();

// update the content of the tile in the board
function drawBoard(board) {
  tiles.forEach((tile, index) => {
    const content = board[index];
    tile.textContent = content || '';
    const key = content || 1;
    if (!cached.get(key)) {
      const value = Math.log2(key);
      cached.set(key, value);
    }
    tile.style.backgroundColor = backgroundColors[cached.get(key)];
    if (index === seed) {
      tile.animate([
        {
          opacity: 0.4,
          easing: 'ease-in',
        },
        {
          opacity: 1,
        },
      ],
      600,
      )
    }
  })
}

function isValidPoint(point) {
  return point.x !== null && point.y !== null;
}

// get the direction of the directed segment which starts at startPoint and ends at endPoint
function getDirection(startPoint, endPoint) {
  if (!isValidPoint(startPoint)) return null;
  if (!isValidPoint(endPoint)) return null;

  // special cases
  if (startPoint.x === endPoint.x && startPoint.y === endPoint.y) return null;
  if (startPoint.x === endPoint.x) return startPoint.y > endPoint.y ? UP : DOWN;
  if (startPoint.y === endPoint.y) return startPoint.x > endPoint.x ? LEFT : RIGHT;

  const rad = Math.atan((endPoint.y - startPoint.y) / (endPoint.x - startPoint.x));
  const deg = rad / Math.PI * 180;

  if (startPoint.x > endPoint.x) return deg > 45 ? UP : deg > -45 ? LEFT : DOWN;
  if (startPoint.x < endPoint.x) return deg > 45 ? DOWN : deg > -45 ? RIGHT : UP;
  throw new Error('invalid points');
}

function* getBlocks(direction) {
  let base = null;
  if (direction === LEFT || direction === UP) base = [0, 1, 2, 3];
  if (direction === RIGHT || direction === DOWN) base = [3, 2, 1, 0];
  if (base === null) throw new Error('invalid direction');
  for (const i of base.slice()) {
    yield base.slice().map(j => (direction === LEFT || direction === RIGHT) ? (4 * i + j) : (i + 4 * j));
  }
}

function canMove(currentTile, previousTile) {
  if (currentTile !== 0) return (previousTile === 0 || currentTile === previousTile) ? true : false;
  return false;
}

function moveBlock(block, board) {
  // merging tiles at most once
  let hasMerged = false;
  let hasMoved = false;
  
  // start from second tile
  for (let i = 1; i < 4; i++) {
    let j = i;
    let currentTile = board[block[j]];
    while (j >= 1 && canMove(currentTile, board[block[j - 1]])) {
      const previousTile = board[block[j - 1]];
      if (currentTile === previousTile && hasMerged) break;
      if (previousTile === 0) {
        board[block[j - 1]] = currentTile;
        board[block[j]] = 0;
        hasMoved = true;
      }
      if (currentTile === previousTile) {
        score += currentTile;
        board[block[j - 1]] = currentTile * 2;
        board[block[j]] = 0;
        hasMerged = true;
        hasMoved = true;
      }
      j--;
      currentTile = board[block[j]];
    }
  }

  return hasMoved;
}

// start is included, end is excluded
function randint(start, end) {
  return Math.floor(Math.random() * (end - start) + start)
}

function seedTile(board) {
  while (board[seed = randint(0, 16)] !== 0) {}
  board[seed] = 2;
}

function updateScore() {
  scoreContainer.textContent = score;
}

seedTile(board);
drawBoard(board);
seed = null;

const startPoint = {
  x: null,
  y: null,
};
const endPoint = {
  x: null,
  y: null,
};


document.body.addEventListener('pointerdown', (e) => {
  startPoint.x = e.clientX;
  startPoint.y = e.clientY;
});

document.body.addEventListener('pointerup', (e) => {
  endPoint.x = e.clientX;
  endPoint.y = e.clientY;
  const direction = getDirection(startPoint, endPoint);
  if (direction === null) return;
  let hasMoved = false
  for (const block of getBlocks(direction)) {
    if (moveBlock(block, board)) hasMoved = true;
  }
  if (hasMoved) seedTile(board);
  drawBoard(board);
  updateScore();
  startPoint.x = null;
  startPoint.y = null;
  endPoint.x = null;
  endPoint.y = null;
  seed = null;
});