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
    input.value = "e''8 d''8 f#'4 g#'4 c#''8 h'8 d'4 e'4 h'8 a'8 c#'4 e'4 a'2."
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
            let el = this.notes[i].match(/([cdefgahCDEFGAH])([#b]?)('{0,3})((?:1|2|4|8|16)?\.?)/)

            let note = this.getNote(el[1], el[2], el[3]);
            let freq = this.calculateFrequency(note);
            let length = "4";
            if(el[4] != "") {
                length = el[4];
            }
            console.log(length)
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