let audioCtx;
let micStream, micSource, musicSource;
let micGain, musicGain, masterGain;
let processor;

// Ses sistemini başlat (Kullanıcı etkileşimiyle başlamalı)
async function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Ses Ayar Düğümleri (Gains)
        micGain = audioCtx.createGain();
        musicGain = audioCtx.createGain();
        masterGain = audioCtx.createGain(); // Toplam yayın sesi

        // Varsayılan ses seviyeleri
        micGain.gain.value = 0; // Başlangıçta mikrofon kapalı
        musicGain.gain.value = 0.8; 
        
        // İşlemci: Sesi paketleyip sunucuya göndermek için
        processor = audioCtx.createScriptProcessor(4096, 1, 1);
        
        // Bağlantılar: Mic/Müzik -> Master -> Hoparlör & Yayın
        micGain.connect(masterGain);
        musicGain.connect(masterGain);
        masterGain.connect(audioCtx.destination); // Kendi hoparlöründen duyman için
        masterGain.connect(processor);
        processor.connect(audioCtx.destination); // İşlemciyi aktif tutmak için

        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            if (myRole === 'Yönetici' && isStreaming) {
                // Sunucuya ses paketini gönder
                socket.emit('audio-data', inputData.buffer);
            }
        };
    }
}

// Müzik Yükleme ve Çalma
document.getElementById('music-file').onchange = async function(e) {
    await initAudioContext();
    const file = e.target.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    if (musicSource) musicSource.stop();
    musicSource = audioCtx.createBufferSource();
    musicSource.buffer = audioBuffer;
    musicSource.connect(musicGain);
    musicSource.loop = true; // Müziği döngüye al
    musicSource.start(0);
};

// Mikrofonu Aç/Kapat
async function setupMic() {
    try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micSource = audioCtx.createMediaStreamSource(micStream);
        micSource.connect(micGain);
    } catch (err) {
        console.error("Mikrofon hatası:", err);
    }
}

// Fader (Kaydırıcı) Kontrolleri
document.getElementById('mic-vol').oninput = function() {
    if (micGain) micGain.gain.value = this.value / 100;
};
document.getElementById('music-vol').oninput = function() {
    if (musicGain) musicGain.gain.value = this.value / 100;
};

let isStreaming = false;
async function toggleStream(start) {
    await initAudioContext();
    if (!micSource) await setupMic(); // Mikrofonu bir kez kur

    const led = document.getElementById('stream-led');
    if (start) {
        isStreaming = true;
        led.classList.add('led-on');
        document.getElementById('startStream').disabled = true;
        document.getElementById('stopStream').disabled = false;
        socket.emit('start-broadcast');
    } else {
        isStreaming = false;
        led.classList.remove('led-on');
        document.getElementById('startStream').disabled = false;
        document.getElementById('stopStream').disabled = true;
        socket.emit('stop-broadcast');
    }
}
