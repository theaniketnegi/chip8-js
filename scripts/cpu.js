class CPU {
  constructor(renderer, keyboard, speaker) {
    this.renderer = renderer;
    this.keyboard = keyboard;
    this.speaker = speaker;

    this.memory = new Uint8Array(4096);
    this.v = new Uint8Array(16); //registers
    this.i = 0;

    this.delayTimer = 0;
    this.soundTimer = 0;

    this.pc = 0x200;
    this.sp = new Array();

    this.pause = false;

    this.speed = 10;
  }
  reset(){
    this.memory.fill(0)
    this.v.fill(0)
    this.sp = new Array()
    this.pc = 0x200
    this.delayTimer=0
    this.soundTimer=0
    this.pause=false
    this.i=0
    this.renderer.clear()
    this.keyboard.reset()
    this.loadSprites()
  }
  loadSprites() {
    const sprites = [
        0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
        0x20, 0x60, 0x20, 0x20, 0x70, // 1
        0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
        0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
        0x90, 0x90, 0xF0, 0x10, 0x10, // 4
        0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
        0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
        0xF0, 0x10, 0x20, 0x40, 0x40, // 7
        0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
        0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
        0xF0, 0x90, 0xF0, 0x90, 0x90, // A
        0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
        0xF0, 0x80, 0x80, 0x80, 0xF0, // C
        0xE0, 0x90, 0x90, 0x90, 0xE0, // D
        0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
        0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    ];

    for (let i = 0; i < sprites.length; i++) this.memory[i] = sprites[i];
  }


  loadProgram(program) {
    this.reset()
    for (let i = 0; i < program.length; i++){
      this.memory[i + 0x200] = program[i];
    }
  }
  
  loadRom(rom) {
    var request = new XMLHttpRequest();
    var self = this
    request.onload = function () {
      if (request.response) {
        let program = new Uint8Array(request.response);
        self.loadProgram(program);
      }
    };

    request.open("GET", "roms/" + rom);
    request.responseType = "arraybuffer";
    request.send();
  }

  loadState(loadedChip){
    this.memory = Uint8Array.from(Object.values(loadedChip.memory))
    this.delayTimer = loadedChip.delayTimer
    this.i = loadedChip.i
    this.pause = loadedChip.pause
    this.pc=loadedChip.pc
    this.soundTimer=loadedChip.soundTimer
    this.sp = loadedChip.sp
    this.speed=loadedChip.speed
    this.v = Uint8Array.from(Object.values(loadedChip.v))
    this.keyboard.keysPressed = loadedChip.keyboard.keysPressed
    this.keyboard.onNextKeyPress = loadedChip.keyboard.onNextKeyPress
    this.renderer.display = loadedChip.renderer.display
    this.renderer.scale = loadedChip.renderer.scale
    this.speaker.oscillator = loadedChip.speaker.oscillator
    }

  cycle() {
    for (let i = 0; i < this.speed; i++) {
      if (!this.pause) {
        let opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
        //^ PC = 0x10 PC+1 = 0xF0 => PC << 8 = 0x1000 => 0x10F0
        this.executeInstruction(opcode);
      }
    }

    if (!this.pause) this.updateTimers();

    this.playSound();
    this.renderer.render();
  }


  updateTimers() {
    if (this.delayTimer > 0) this.delayTimer -= 1;
    if (this.soundTimer > 0) this.soundTimer -= 1;
  }

   playSound() {
     if (this.soundTimer > 0) this.speaker.play();
     else this.speaker.stop();
   }

  executeInstruction(opcode) {
    this.pc += 2;
    let x, y;
    x = (opcode & 0x0f00) >> 8;
    y = (opcode & 0x00f0) >> 4;

    switch (opcode & 0xf000) {
      case 0x0000:
        switch (opcode) {
          case 0x00e0: 
            this.renderer.clear()
            break;
          case 0x00ee:
            this.pc = this.sp.pop()
            break;
        }

        break;
      case 0x1000:
        this.pc=(opcode&0x0FFF)
        break;
      case 0x2000:
        this.sp.push(this.pc)
        this.pc=(opcode&0x0FFF)
        break;
      case 0x3000:
        if(this.v[x]===(opcode&0x00FF))
            this.pc+=2
        break;
      case 0x4000:
        if(this.v[x]!==(opcode&0x00FF))
            this.pc+=2
        break;
      case 0x5000:
        if(this.v[x]===this.v[y])
            this.pc+=2
        break;
      case 0x6000:
        this.v[x]=opcode&0x00FF
        break;
      case 0x7000:
        this.v[x]+=opcode&0x00FF
        break;
      case 0x8000:
        switch (opcode & 0xf) {
          case 0x0:
            this.v[x]=this.v[y]
            break;
          case 0x1:
            this.v[x] = this.v[x] | this.v[y]
            break;
          case 0x2:
            this.v[x]=this.v[x] & this.v[y]
            break;
          case 0x3:
            this.v[x] = (this.v[x]^this.v[y])
            break;
          case 0x4:
            this.v[0xF]=0
            let sum=(this.v[x]+=this.v[y])
            
            if(sum>0xFF)
                this.v[0xF]=1
            this.v[x]=sum            
            break;
          case 0x5:
            this.v[0xF]=0
            if(this.v[x]>this.v[y])
                this.v[0xF]=1
            
            this.v[x]=this.v[x]-this.v[y]
            break;
          case 0x6:
            this.v[0xF]=this.v[x]&0x1
            this.v[x] >>= 1 
            break;
          case 0x7:
            this.v[0xF]=0
            if(this.v[x]<this.v[y])
                this.v[0xF]=1
            
            this.v[x]=this.v[y]-this.v[x]
            break;
          case 0xe:
            this.v[0xF]=this.v[x]&0x80
            this.v[x]<<=1
            break;
        }

        break;
      case 0x9000:
        if(this.v[x]!==this.v[y])
            this.pc+=2
        break;
      case 0xa000:
        this.i = opcode&0x0FFF
        break;
      case 0xb000:
        this.pc = (opcode&0x0FFF) + this.v[0] 
        break;
      case 0xc000:
        let rnd = Math.floor(Math.random()*0xFF);
        this.v[x]=rnd&(opcode&0x00FF)
        break;
      case 0xd000:
        let width = 8
        let height = opcode&0x000F

        this.v[0xF]=0

        for(let row = 0; row<height; row++){
            let sprite = this.memory[this.i+row]
            for(let col = 0; col<width; col++){
                if((sprite&0x80) > 0){
                    if(this.renderer.setPixel(this.v[x]+col, this.v[y]+row))
                        this.v[0xF]=1
                }
                sprite <<= 1
            }
        }
        break;
      case 0xe000:
        switch (opcode & 0xff) {
          case 0x9e:
            if(this.keyboard.isKeyPressed(this.v[x]))
                this.pc+=2
            break;
          case 0xa1:
            if(!this.keyboard.isKeyPressed(this.v[x]))
                this.pc+=2
            break;
        }

        break;
      case 0xf000:
        switch (opcode & 0xff) {
          case 0x07:
            this.v[x]=this.delayTimer
            break;
          case 0x0a:
            this.pause=true
            this.keyboard.onNextKeyPress = function(key){
                this.v[x]=key
                this.pause=false
            }.bind(this)
            break;
          case 0x15:
            this.delayTimer=this.v[x]
            break;
          case 0x18:
            this.soundTimer=this.v[x]
            break;
          case 0x1e:
            this.i=this.i+this.v[x]
            break;
          case 0x29:
            this.i = this.v[x]*5
            break;
          case 0x33:
            this.memory[this.i] = parseInt(this.v[x]/100)
            this.memory[this.i+1] = parseInt((this.v[x]%100)/10)
            this.memory[this.i+2] = parseInt(this.v[x]%10)
            break;
          case 0x55:
            for(let mem=0; mem<=x; mem++){
                this.memory[mem+this.i]=this.v[mem]
            }
            break;
          case 0x65:
            for(let mem=0; mem<=x; mem++){
                this.v[mem]=this.memory[mem+this.i]
            }
            break;
        }

        break;

      default:
        throw new Error("Unknown opcode " + opcode);
    }
  }
}

export default CPU;
