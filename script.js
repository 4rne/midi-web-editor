var bpm = 240;
var playBtn;
var volumeSlider;
var parser;
var instrument;

var samples = [["Nokia tune", "82 e''8 d''8 f'#4 g'#4 c''#8 h'8 d'4 e'4 h'8 a'8 c'#4 e'4 a'2."],
["Kein Anschluss unter dieser Nummer", "81 a'#2 f''2 a''#2"],
["Alle meine Entchen", "c d e f g2 g2 a a a a g1 a a a a g1 f f f f e2 e2 g g g g c"],
["Brahms Wiegenlied", "bpm100 f#8 f#8 a4. f#8 f# a p f#8 a8 d' c'#4. h8 h a e8 f#8 g e e8 f#8 g p e8 g8 c'#8 h8 a c'# d' p d8 d8 d'2 h8 g8 a2 f#8 d8 g a h a2 d8 d8 d'2 h8 g8 a2 f#8 d8 g8 a16 g16 f# e d2"],
["Big Ben", "bpm100 12 C E D G'2. C D E C2. E C D G'2. G' D E C2."],
["Pippi Langstrumpf", "C4 F4 A4 F4 G2 Hb8 A8 G8 F8 E4 G4 C4 E4 F2 A2 C4 F4 A4 F4 G2 Hb8 A8 G8 F8 E4 G4 C4 E4 F p2 A2 A4 A4 Hb2 Hb4 Hb8 A8 G2 G4 G8 G4 F8 F8 E4 F4 G2 A2 A4 A4 Hb2 Hb4 A4 G4 G4 F4 E4 F1"],
["Nyan Cat (loop)", "f# g# d#8 d# H8 d8 c#8 H H c# d d8 c#8 H8 c#8 d#8 f#8 g#8 d#8 f#8 c#8 d#8 H8 c#8 H8 d# f# g#8 d#8 f#8 c#8 d#8 H8 d8 d#8 d8 c#8 H8 c#8 d H8 c#8 d#8 f#8 c#8 d#8 c#8 H8 c# H d#"],
];

const predefinedInstruments = { "piano": 1, "vibes": 11, "organ": 19, "guitar": 30, "brass": 62 };

const context = new (window.AudioContext || window.webkitAudioContext)();
var player = new WebAudioFontPlayer();
var master = player.createChannel(context);
var reverberator = player.createReverberator(context);
reverberator.output.connect(master.input);
reverberator.wet.gain.setTargetAtTime(0.05, 0, 0.0001);
master.output.connect(context.destination);
player.loader.decodeAfterLoading(context, '_tone_0010_FluidR3_GM_sf2_file');
instrument = _tone_0010_FluidR3_GM_sf2_file;

function parseAndPlay() {
    context.resume().then(() => {
        console.log('Playback resumed successfully');
    });

    playBtn.disabled = true;
    playBtn.value = "playing...";
    parser = new Parser(input.value);
    parser.parseAndPlay();
}

function setInstrumentAndPlay(id) {
    id = parseInt(id);
    number = ("00" + (id - 1)).slice(-3) + "0"
    instrumenName = '_tone_' + number + '_FluidR3_GM_sf2_file'
    player.loader.startLoad(context, 'https://surikov.github.io/webaudiofontdata/sound/' + number + '_FluidR3_GM_sf2_file.js', instrumenName);
    player.loader.waitLoad(function () {
        instrument = eval(instrumenName);
        parser.play();
    });
}

function registerEvents() {
    var input = document.getElementById("input")
    playBtn = document.getElementById("play")
    stopBtn = document.getElementById("stop")
    volumeSlider = document.getElementById("volume")
    if (input.value == "") {
        input.value = samples[0][1];
    }
    playBtn.addEventListener("click", function () {
        parseAndPlay();
    });
    volumeSlider.addEventListener("change", function () {
        master.output.gain.setTargetAtTime(volumeSlider.value, 0, 0.0001);
    });
    stopBtn.addEventListener("click", function () {
        playBtn.disabled = false;
        playBtn.value = "play";
        parser.tones = [];
    });

    loadSamples();
}

function loadSamples() {
    sampleContainer = document.getElementById("samples");
    samples.forEach(sample => {
        sampleContainer.innerHTML += '<input type="button" value="load" onclick="loadSample(&quot;' + sample[1] + '&quot;)">'
        sampleContainer.innerHTML += ' '
        sampleContainer.innerHTML += sample[0]
        sampleContainer.innerHTML += ': '
        sampleContainer.innerHTML += '<span style="font-family: Monospace">' + sample[1] + '</span>'
        sampleContainer.innerHTML += "<br>"
    });
}

function loadSample(melody) {
    input.value = melody;
}

class Tone {
    constructor(pitch, length, osc) {
        this.pitch = pitch;
        this.osc = osc;
        this.length = 1 / length * 4 * 60 / bpm * 1000;
        if (length.indexOf(".") != -1) {
            this.length *= 1.5;
        }
    }
    play() {
        if (this.pitch != 0) {
            player.queueWaveTable(context, master.input, instrument, 0, this.pitch, this.length / 750);

            setTimeout(
                function (x) {
                    if (x === 0) {
                        parser.play();
                    }
                }, this.length, this.osc);
        } else {
            setTimeout(
                function (x) {
                    if (x === 0) {
                        parser.play();
                    }
                }, this.length, this.osc);
        }
    }
}

class Parser {
    constructor(str) {
        this.selectionStart = input.selectionStart;
        this.selectionEnd = input.selectionEnd;
        this.notes = str.trim().split(/\s+/);
        this.tones = [];
        this.noteBegin = 0;
        this.cursorPosition = 0;
        this.noteEnd = this.notes[this.cursorPosition].length
    }

    parseBpm() {
        if (this.notes[0].match(/bpm([0-9]+)/) !== null) {
            bpm = this.notes[0].match(/bpm([0-9]+)/)[1];
            this.cursorPosition = this.notes[0].length + 1;
            this.notes.shift();
        } else {
            bpm = 240;
        }
    }

    parseMidiInstrument() {
        if (Number.isInteger(predefinedInstruments[this.notes[0]])) {
            console.log(predefinedInstruments[this.notes[0]]);
            let midiInstrumentNumber = predefinedInstruments[this.notes[0]];
            console.log(midiInstrumentNumber);
            this.cursorPosition += this.notes[0].length + 1;
            this.notes.shift();
            return midiInstrumentNumber;
        }
        else if (this.notes[0].match(/^[0-9]+$/) !== null) {
            let number = this.notes[0].match(/^([0-9]+)$/)[1];
            this.cursorPosition += this.notes[0].length + 1;
            this.notes.shift();
            return number;
        } else {
            return 1;
        }
    }

    parseNotes() {
        for (let i = 0; i < this.notes.length; i++) {
            let el = this.notes[i]

            let currentChord = el.match(/([cdefgahpCDEFGAHP][#b'12486\.]*)/g)
            let playChord = [];
            for (let i = 0; i < currentChord.length; i++) {
                const note = currentChord[i];

                let name = note.match(/([cdefgahpCDEFGAHP])/)[1]
                let mod = note.match(/([#b])/)
                let modifier = "";
                if (mod !== null) {
                    modifier = mod[1]
                }
                let height = "";
                if (note.match(/''{0,3}/) != null) {
                    height = note.match(/''{0,3}/)[0]
                }
                let len = note.match(/(?:.*((16|2|4|8|1)\.?))?/)[1]
                let pitch = this.getPitch(name, modifier, height);
                let length = "4";
                if (len != "" && typeof len != "undefined") {
                    length = len;
                }
                playChord.push(new Tone(pitch, length, i));
            }
            this.tones.push(playChord);
        }
        this.tones.reverse()
    }

    parseAndPlay() {
        this.parseBpm();
        let midiInstrumentNumber = this.parseMidiInstrument();
        console.log(midiInstrumentNumber);
        input.focus();
        this.parseNotes();
        setInstrumentAndPlay(midiInstrumentNumber);
    }

    play() {
        if (this.tones.length > 0) {
            input.setSelectionRange(this.cursorPosition, this.cursorPosition + this.notes[0].length);
            this.cursorPosition += this.notes[0].length + 1;
            this.notes = this.notes.reverse()
            this.notes.pop();
            this.notes = this.notes.reverse()
            let chord = this.tones.pop();
            for (let i = 0; i < chord.length; i++) {
                chord[i].play();
            }
        } else {
            playBtn.disabled = false;
            playBtn.value = "play";
            input.setSelectionRange(this.selectionStart, this.selectionEnd);
        }
    }

    getPitch(name, modifier, height) {
        let BASE_NOTE = 48;
        if (name.toLowerCase() == "p") {
            return 0;
        }
        let noteId;
        let direction;
        if (name.match(/[CDEFGAH]/)) {
            direction = -1;
            noteId = BASE_NOTE;
        } else {
            direction = +1;
            noteId = BASE_NOTE + 12;
        }
        if (modifier === "#") {
            noteId++;
        } else if (modifier === "b") {
            noteId--;
        }

        let note = "c d ef g a h".indexOf(name.toLowerCase())
        noteId += note;
        noteId += 12 * height.length * direction;
        return noteId;
    }
}