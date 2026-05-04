// --- SES MOTORU (AUDIO ENGINE) ---
let audioCtx, dest, musicNode, musicGain, micNode, micGain, recorder;

/**
 * 1. Mikseri Başlat: Tüm kanalları hazırlar.
 */
async function initMixerEngine() {
    // AudioContext'i oluştur (Tarayıcı kısıtlaması nedeniyle bir tıklama ile çalışmalı)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Ana Çıkış Kanalı (Buraya ne bağlanırsa yayına o gider)
    dest = audioCtx.createMediaStreamDestination();

    // Müzik Kanalı ve Ses Ayarı
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.5; // Başlangıç sesi %50
    musicGain.connect(dest);
    musicGain.connect(audioCtx.destination); // DJ'in kendisinin duyması için

    console.log("Mikser Motoru Hazır.");
}

/**
 * 2. Dosyadan Müzik Yükle
 */
function loadMusicToMixer(fileElement, audioTag) {
    const file = fileElement.files[0];
    if (!file) return;

    audioTag.src = URL.createObjectURL(file);
    
    // Eğer müzik node'u henüz bağlanmadıysa bağla
    if (!musicNode) {
        musicNode = audioCtx.createMediaElementSource(audioTag);
        musicNode.connect(musicGain);
    }
    audioTag.play();
}

/**
 * 3. Mikrofonu Miksere Ekle (Anons Sistemi)
 */
async function enableMic() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micNode = audioCtx.createMediaStreamSource(stream);
        micGain = audioCtx.createGain();
        
        micNode.connect(micGain);
        micGain.connect(dest); // Mikrofonu ana çıkışa bağla
        console.log("Mikrofon Miksere Bağlandı.");
    } catch (err) {
        console.error("Mikrofon açılırken hata:", err);
    }
}

/**
 * 4. Yayını Başlat (Sunucuya Gönderim)
 */
function startBroadcasting(socket) {
    // Recorder, ana çıkış kanalını (dest) dinler
    recorder = new MediaRecorder(dest.stream);
    
    recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            // Sunucuya 'voice-data' adıyla gönderir
            socket.emit('voice-data', event.data);
        }
    };

    recorder.start(200); // 200ms'lik paketler halinde gönder
    console.log("Yayın sunucuya iletiliyor...");
}
