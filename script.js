var bpm = 180;

const context = new (window.AudioContext || window.webkitAudioContext)();
var o = context.createOscillator();
var vol = context.createGain()
vol.gain.value = 0.01
vol.connect(context.destination)

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function parseAndPlay() {
    parser = new Parser(input.value.replace(/ [pP]\d /, ''));
    parser.parse();
    parser.play();
}

function registerEvents()
{
    var parser;
    var input = document.getElementById("input")
    var play = document.getElementById("play")
    if(input.value == "") {
        input.value = "e''8 d''8 f#'4 g#'4 c#''8 h'8 d'4 e'4 h'8 a'8 c#'4 e'4 a'2."
    }
    play.addEventListener("click", function(){
        parseAndPlay();
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
        o.frequency.setValueAtTime(this.freq, context.currentTime);
        o.connect(vol);
        setTimeout(
            function() {
                o.disconnect(vol);
                parser.play();
            }, this.length);
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

            let name = el.match(/([cdefgahCDEFGAH])/)[1]
            let modifier = el.match(/.([#b]?)/)[1]
            let height = 0;
            if(el.match(/''{0,3}/) != null) {
                height = el.match(/''{0,3}/)[0]
            }
            let len = el.match(/(?:.*((1|2|4|8|16)\.?))?/)[1]
            let note = this.getNote(name, modifier, height);
            let freq = this.calculateFrequency(note);
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
        }
    }

    calculateFrequency(n) {
        return (Math.pow(2, 1/12) ** (n - 49) * 440)
    }

    getNote(name, modifier, height)
    {
        let start;
        let direction;
        if(name.match(/[CDEFGAH]/)) {
            direction = -1;
            start = 40;
        } else {
            direction = +1;
            start = 52;
        }
        if(modifier === "#") {
            start++;
        } else if (modifier === "b") {
            start--;
        }

        let note = "c d ef g a h".indexOf(name.toLowerCase())
        start += note;
        start += 12 * height.length * direction;
        return start;
    }
}
// C''' D''' E''' F''' G''' A''' H''' C'' D'' E'' F'' G'' A'' H'' C' D' E' F' G' A' H' C D E F G A H c d e f g a h c' d' e' f' g' a' h' c'' d'' e'' f'' g'' a'' h'' c''' d''' e''' f''' g''' a''' h'''