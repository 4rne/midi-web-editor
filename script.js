var bpm = 240;
var playBtn;
var volumeSlider;
var parser;

const context = new (window.AudioContext || window.webkitAudioContext)();
var o = [];
for (let i = 0; i < 5; i++) {
    let osc = context.createOscillator();
    osc.type = 'sine'
    o.push(osc);
}
var vol = context.createGain()
vol.gain.value = 0.05
vol.connect(context.destination)

function parseAndPlay() {
    playBtn.disabled = true;
    playBtn.value = "playing...";
    parser = new Parser(input.value);
    parser.parse();
    parser.play();
}

function registerEvents()
{
    var input = document.getElementById("input")
    playBtn = document.getElementById("play")
    stopBtn = document.getElementById("stop")
    volumeSlider = document.getElementById("volume")
    if(input.value == "") {
        input.value = "e8' d8' f#4 g#4 c#8' h8 d4 e4 h8 a8 c#4 e4 a2." // nokia tune
    }
    // Kein Anschluss unter dieser Nummer a#2' f''2 a#''2
    playBtn.addEventListener("click", function(){
        parseAndPlay();
    });
    volumeSlider.addEventListener("change", function(){
        vol.gain.value = ((volumeSlider.value ** 2) / 10000.0);
    });
    stopBtn.addEventListener("click", function(){
        o.forEach(oscilator => {
            oscilator.disconnect(vol);
        });
        parser.tones = [];
        playBtn.disabled = false;
        playBtn.value = "play";
    });
    o.forEach(oscilator => {
        oscilator.start();
    });
}

class Tone {
    constructor(freq, length, osc) {
        this.freq = freq;
        this.osc = osc;
        this.length = 1 / length * 4 * 60 / bpm * 1000;
        if(length.indexOf(".") != -1) {
            this.length *= 1.5;
        }
    }
    play()
    {
        if(this.freq != 0) {
            o[this.osc].frequency.setValueAtTime(this.freq, context.currentTime);
            o[this.osc].connect(vol);
            setTimeout(
                function(x) {
                    o[x].disconnect(vol);
                    if(x === 0) {
                        parser.play();
                    }
                }, this.length, this.osc);
        } else {
            setTimeout(
                function(x) {
                if(x === 0) {
                    parser.play();
                }
                }, this.length, this.osc);
        }
    }
}

class Parser {
    constructor(str) {
        this.notes = str.split(" ");
        this.tones = [];
    }

    parse() {
        for(let i = 0; i < this.notes.length; i++)
        {
            let el = this.notes[i]
            
            let currentChord = el.match(/([cdefgahpCDEFGAHP][#b'12486\.]*)/g)
            let playChord = [];
            for (let i = 0; i < currentChord.length; i++) {
                const note = currentChord[i];
                
                let name = note.match(/([cdefgahpCDEFGAHP])/)[1]
                let mod = note.match(/([#b])/)
                let modifier = "";
                if(mod !== null)
                {
                    modifier = mod[1]
                }
                let height = "";
                if(note.match(/''{0,3}/) != null) {
                    height = note.match(/''{0,3}/)[0]
                }
                let len = note.match(/(?:.*((1|2|4|8|16)\.?))?/)[1]
                let freq = this.getFrequency(name, modifier, height);
                let length = "4";
                if(len != "" && typeof len != "undefined" ) {
                    length = len;
                }
                playChord.push(new Tone(freq, length, i));
            }
            this.tones.push(playChord);
        }
        this.tones.reverse()
    }

    play() {
        if(this.tones.length > 0) {
            let chord = this.tones.pop();
            for (let i = 0; i < chord.length; i++) {
                chord[i].play();
            }
        } else {
            playBtn.disabled = false;
            playBtn.value = "play";
        }
    }

    calculateFrequency(n) {
        return (Math.pow(2, 1/12) ** (n - 49) * 440)
    }

    getFrequency(name, modifier, height)
    {
        if(name.toLowerCase() == "p") {
            return 0;
        }
        let noteId;
        let direction;
        if(name.match(/[CDEFGAH]/)) {
            direction = -1;
            noteId = 38;
        } else {
            direction = +1;
            noteId = 40;
        }
        if(modifier === "#") {
            noteId++;
        } else if (modifier === "b") {
            noteId--;
        }

        let note = "c d ef g a h".indexOf(name.toLowerCase())
        noteId += note;
        noteId += 12 * height.length * direction;
        return this.calculateFrequency(noteId);
    }
}
// C' D' E' F' G' A' H' C D E F G A H c d e f g a h c' d' e' f' g' a' h' c'' d'' e'' f'' g'' a'' h'' c'''