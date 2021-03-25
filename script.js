var bpm = 120;
var playBtn;
var volumeSlider;
var parser;

const context = new (window.AudioContext || window.webkitAudioContext)();
var o = context.createOscillator();
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
        input.value = "e'8 d'8 f#4 g#4 c#'8 h8 d4 e4 h8 a8 c#4 e4 a2."
    }
    playBtn.addEventListener("click", function(){
        parseAndPlay();
    });
    volumeSlider.addEventListener("change", function(){
        vol.gain.value = ((volumeSlider.value ** 2) / 10000.0);
    });
    stopBtn.addEventListener("click", function(){
        o.disconnect(vol);
        parser.tones = [];
        playBtn.disabled = false;
        playBtn.value = "play";
    });
    o.start();
}

class Tone {
    constructor(freq, length) {
        this.freq = freq;
        this.length = 1 / length * 4 * 60 / bpm * 1000;
        if(length.indexOf(".") != -1) {
            this.length *= 1.5;
        }
    }
    play()
    {
        if(this.freq != 0) {
            o.frequency.setValueAtTime(this.freq, context.currentTime);
            o.connect(vol);
            setTimeout(
                function() {
                    o.disconnect(vol);
                    parser.play();
                }, this.length);
        } else {
            setTimeout(
                function() {
                    parser.play();
                }, this.length);
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

            let name = el.match(/([cdefgahpCDEFGAHP])/)[1]
            let modifier = el.match(/.([#b]?)/)[1]
            let height = "";
            if(el.match(/''{0,3}/) != null) {
                height = el.match(/''{0,3}/)[0]
            }
            let len = el.match(/(?:.*((1|2|4|8|16)\.?))?/)[1]
            let freq = this.getFrequency(name, modifier, height);
            let length = "4";
            if(len != "" && typeof len != "undefined" ) {
                length = len;
            }
            this.tones.push(new Tone(freq, length));
        }
        this.tones.reverse()
    }

    play() {
        if(this.tones.length > 0) {
            this.tones.pop().play();
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
            noteId = 40;
        } else {
            direction = +1;
            noteId = 52;
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
// C''' D''' E''' F''' G''' A''' H''' C'' D'' E'' F'' G'' A'' H'' C' D' E' F' G' A' H' C D E F G A H c d e f g a h c' d' e' f' g' a' h' c'' d'' e'' f'' g'' a'' h'' c''' d''' e''' f''' g''' a''' h'''