import Renderer from "./renderer.js";
import Keyboard from "./keyboard.js";
import Speaker from "./speaker.js";
import CPU from "./cpu.js";

const renderer = new Renderer(10);
const keyboard = new Keyboard();
const speaker = new Speaker();

const cpu = new CPU(renderer, keyboard, speaker);

let loop;
let fps = 60;
let fpsInterval, startTime, now, then, elapsed;

const speedText = document.querySelector(".speed");

const saveBtn = document.querySelector(".save");
const loadBtn = document.querySelector(".load");
const selectChoice = document.querySelector("select");
let romName = "TETRIS";

function init() {
  fpsInterval = 1000 / fps;
  then = Date.now();
  startTime = then;
  cpu.loadRom(romName);
  setInstructions()
  speedText.innerHTML = cpu.pause ? "paused" : `speed: ${cpu.speed}`;

  window.addEventListener("keydown", (event) => {
    if (event.key === "p") cpu.pause = !cpu.pause;
    if (event.key === "+") cpu.speed = cpu.speed === 40 ? 40 : cpu.speed + 5;
    if (event.key === "-") cpu.speed = cpu.speed === 0 ? 0 : cpu.speed - 5;
    speedText.innerHTML = cpu.pause ? "paused" : `speed: ${cpu.speed}`;
  });

  saveBtn.addEventListener("click", () => {
    window.localStorage.setItem(`${romName}_state`, JSON.stringify(cpu));
  });
  loadBtn.addEventListener("click", () => {
    let c = window.localStorage.getItem(`${romName}_state`);
    if (c) {
      c = JSON.parse(c);
      cpu.loadState(c);
      speedText.innerHTML = cpu.pause ? "paused" : `speed: ${cpu.speed}`;
    }
  });


  selectChoice.addEventListener("change", (e) => {
    romName = e.target.value;
    cpu.loadRom(romName);
    setInstructions();
  });
  loop = requestAnimationFrame(step);
}

function step() {
  now = Date.now();
  elapsed = now - then;

  if (elapsed > fpsInterval) cpu.cycle();
  loop = requestAnimationFrame(step);
}

function setInstructions() {
  const list = document.querySelector("ul");
  list.innerHTML=''
  switch (romName) {
    case "tetris":
      list.innerHTML+=`<li>q - rotate block</li><li>w - move left</li><li>e - move right</li>`
      break
    case "invaders":  
      list.innerHTML+=`<li>q - move left</li><li>w - start/shoot</li><li>e - move right</li>`
      break
    case "pong":
      list.innerHTML+=`<li>1 - move up (left)</li><li>q - move down(left)</li><li>4 - move up (right)</li><li>q - move down(right)</li>`
      break 
  }
  list.innerHTML+=`<li>p - pause</li><li>+ - increase speed</li><li>- - decrease speed</li>`
}

init();
