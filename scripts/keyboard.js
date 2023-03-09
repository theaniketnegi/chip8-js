class Keyboard {
  constructor() {
    this.KEYMAP = {
      49: 0x1, // 1
      50: 0x2, // 2
      51: 0x3, // 3
      52: 0xc, // 4
      81: 0x4, // Q
      87: 0x5, // W
      69: 0x6, // E
      82: 0xd, // R
      65: 0x7, // A
      83: 0x8, // S
      68: 0x9, // D
      70: 0xe, // F
      90: 0xa, // Z
      88: 0x0, // X
      67: 0xb, // C
      86: 0xf, // V
    };
    //Chip 8 layout
    // 1	2	3	C
    // 4	5	6	D
    // 7	8	9	E
    // A	0	B	F

    this.keysPressed = []
    this.onNextKeyPress = null

    window.addEventListener('keydown', this.onKeyDown.bind(this), false)
    window.addEventListener('keyup', this.onKeyUp.bind(this), false)
  }
  reset(){
    this.keysPressed = []
    this.onNextKeyPress = null
  }
  isKeyPressed(keyCode){
    return this.keysPressed[keyCode]
  }

  onKeyDown(event){
    let key = this.KEYMAP[event.which]
    if(key)
        this.keysPressed[key]=true

    if(this.onNextKeyPress!==null && key){
        this.onNextKeyPress(parseInt(key))
        this.onNextKeyPress=null
    }
  }

  onKeyUp(event){
    let key = this.KEYMAP[event.which]
    this.keysPressed[key]=false
  }
}

export default Keyboard
