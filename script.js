var bpm = 120;


// var vol = context.createGain();
// vol.gain.value = 0.1;
// o.connect(vol);
// var context = new AudioContext();
// var o = context.createOscillator();
// o.start(0);
// o.connect(context.destination);
// o.frequency = 440
// o.stop(0.1);
// o.disconnect(context.destination);

const context = new (window.AudioContext || window.webkitAudioContext)();
var o = context.createOscillator();

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function parseAndPlay() {
    parser = new Parser(input.value);
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
        this.length = length;
    }
    play()
    {
        o.frequency.setValueAtTime(this.freq, context.currentTime);
        o.connect(context.destination);
        setTimeout(
            function() {
                o.disconnect(context.destination);
                parser.play();
            }, 100);
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
            // console.log(el);

            let note = this.getNote(el[1], el[2], el[3]);
            this.tones.push(new Tone(note, el[4]));
        }
        this.tones.reverse()
    }

    play() {
        if(this.tones.length > 0) {
            console.log(this.tones)
            this.tones.pop().play();
        }
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