const audio = document.getElementById("audio");
const fileInput = document.getElementById("fileInput");

const delayVal = document.getElementById("delayVal");
const feedbackVal = document.getElementById("feedbackVal");
const wetVal = document.getElementById("wetVal");
const masterVal = document.getElementById("masterVal");

const canvas = document.getElementById("visualizer");
const ctxCanvas = canvas.getContext("2d");

// AUDIO CONTEXT
const ctx = new (window.AudioContext || window.webkitAudioContext)();

let source;

// ANALYSER
const analyser = ctx.createAnalyser();
analyser.fftSize = 256;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

// NODE
const delayNode = ctx.createDelay(1.0);
const feedback = ctx.createGain();
const wetGain = ctx.createGain();
const dryGain = ctx.createGain();
const masterGain = ctx.createGain();

// DEFAULT
delayNode.delayTime.value = 0.06;
feedback.gain.value = 0.25;
wetGain.gain.value = 0.5;
dryGain.gain.value = 1;
masterGain.gain.value = 1; // ubah ke 0 kalau mau default mute

// SETUP AUDIO
function setupAudio(){
    if(source) source.disconnect();

    source = ctx.createMediaElementSource(audio);

    source.connect(analyser);

    // DRY
    analyser.connect(dryGain);
    dryGain.connect(masterGain);

    // DELAY
    analyser.connect(delayNode);
    delayNode.connect(feedback);
    feedback.connect(delayNode);
    delayNode.connect(wetGain);
    wetGain.connect(masterGain);

    // OUTPUT
    masterGain.connect(ctx.destination);
}

// LOAD FILE
fileInput.addEventListener("change", function(){
    const file = this.files[0];
    if(file){
        audio.src = URL.createObjectURL(file);
        setupAudio();
    }
});

// FIX PLAY
audio.onplay = () => ctx.resume();

// ===== KNOB SYSTEM =====
function createKnob(element, min, max, step, initial, onChange){
    let value = initial;

    const update = () => {
        let percent = (value - min) / (max - min);
        let angle = percent * 270 - 135;

        element.style.transform = `rotate(${angle}deg)`;
        onChange(value);
    };

    let startY = 0;

    element.addEventListener("pointerdown", (e)=>{
        startY = e.clientY;

        const move = (eMove)=>{
            let delta = startY - eMove.clientY;

            value += delta * step;
            value = Math.max(min, Math.min(max, value));

            startY = eMove.clientY;
            update();
        };

        const up = ()=>{
            document.removeEventListener("pointermove", move);
            document.removeEventListener("pointerup", up);
        };

        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", up);
    });

    update();
}

// ===== INIT KNOB =====

// MASTER
createKnob(
    document.getElementById("masterKnob"),
    0, 1, 0.01, 1,
    (val)=>{
        if(val === 0){
            masterVal.innerText = "MUTE";
        } else {
            masterVal.innerText = val.toFixed(2);
        }

        masterGain.gain.setTargetAtTime(
            val,
            ctx.currentTime,
            0.02
        );
    }
);

// DELAY
createKnob(
    document.getElementById("delayKnob"),
    10, 150, 0.5, 60,
    (val)=>{
        delayVal.innerText = Math.round(val);

        delayNode.delayTime.setTargetAtTime(
            val / 1000,
            ctx.currentTime,
            0.02
        );
    }
);

// FEEDBACK
createKnob(
    document.getElementById("feedbackKnob"),
    0, 0.9, 0.01, 0.25,
    (val)=>{
        feedbackVal.innerText = val.toFixed(2);

        feedback.gain.setTargetAtTime(
            val,
            ctx.currentTime,
            0.02
        );
    }
);

// MIX
createKnob(
    document.getElementById("wetKnob"),
    0, 1, 0.01, 0.5,
    (val)=>{
        wetVal.innerText = val.toFixed(2);

        wetGain.gain.setTargetAtTime(
            val,
            ctx.currentTime,
            0.02
        );
    }
);

// ===== VISUALIZER =====
function draw(){
    requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    ctxCanvas.fillStyle = "#000";
    ctxCanvas.fillRect(0, 0, canvas.width, canvas.height);

    let barWidth = canvas.width / bufferLength;

    let gradient = ctxCanvas.createLinearGradient(0,0,0,canvas.height);
    gradient.addColorStop(0,"#00c6ff");
    gradient.addColorStop(1,"#ffd700");

    for(let i = 0; i < bufferLength; i++){
        let barHeight = dataArray[i];

        ctxCanvas.fillStyle = gradient;
        ctxCanvas.fillRect(
            i * barWidth,
            canvas.height - barHeight / 2,
            barWidth - 2,
            barHeight / 2
        );
    }
}

draw();

// RESIZE FIX
function resizeCanvas(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// AUTO AKTIF AUDIO
document.body.addEventListener("click", () => {
    ctx.resume();
}, { once: true });