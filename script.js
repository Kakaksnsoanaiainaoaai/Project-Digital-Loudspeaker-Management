const audio = document.getElementById("audio");
const fileInput = document.getElementById("fileInput");

const delaySlider = document.getElementById("delaySlider");
const feedbackSlider = document.getElementById("feedbackSlider");
const wetSlider = document.getElementById("wetSlider");

const delayVal = document.getElementById("delayVal");
const feedbackVal = document.getElementById("feedbackVal");
const wetVal = document.getElementById("wetVal");

const canvas = document.getElementById("visualizer");
const ctxCanvas = canvas.getContext("2d");

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// AUDIO CONTEXT
const ctx = new (window.AudioContext || window.webkitAudioContext)();

let source;

// NODE
const analyser = ctx.createAnalyser();
analyser.fftSize = 256;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

const delayNode = ctx.createDelay(1.0);
const feedback = ctx.createGain();
const wetGain = ctx.createGain();
const dryGain = ctx.createGain();

// DEFAULT SETTING
delayNode.delayTime.value = 0.06;
feedback.gain.value = 0.25;
wetGain.gain.value = 0.5;
dryGain.gain.value = 1;

// SETUP AUDIO
function setupAudio(){
    if(source) source.disconnect();

    source = ctx.createMediaElementSource(audio);

    // MASUK KE ANALYSER
    source.connect(analyser);

    // DRY
    analyser.connect(dryGain);
    dryGain.connect(ctx.destination);

    // DELAY
    analyser.connect(delayNode);
    delayNode.connect(feedback);
    feedback.connect(delayNode);
    delayNode.connect(wetGain);
    wetGain.connect(ctx.destination);
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
audio.onplay = () => {
    ctx.resume();
};

// DELAY CONTROL
delaySlider.oninput = (e) => {
    let val = e.target.value;
    delayVal.innerText = val;

    delayNode.delayTime.setTargetAtTime(
        val / 1000,
        ctx.currentTime,
        0.02
    );
};

// FEEDBACK CONTROL
feedbackSlider.oninput = (e) => {
    let val = e.target.value;
    feedbackVal.innerText = val;

    feedback.gain.setTargetAtTime(
        val,
        ctx.currentTime,
        0.02
    );
};

// MIX CONTROL
wetSlider.oninput = (e) => {
    let val = e.target.value;
    wetVal.innerText = val;

    wetGain.gain.setTargetAtTime(
        val,
        ctx.currentTime,
        0.02
    );
};

// VISUALIZER
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

// FIX CANVAS SIZE
function resizeCanvas(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// PASTIKAN AUDIO CONTEXT AKTIF
document.body.addEventListener("click", () => {
    ctx.resume();
}, { once: true });