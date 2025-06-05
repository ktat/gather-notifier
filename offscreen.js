let audioPlayer = null;

// バックグラウンドスクリプトからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'playSound') {
    playNotificationSound();
    sendResponse({ success: true });
  } else if (message.action === 'stopSound') {
    stopNotificationSound();
    sendResponse({ success: true });
  }
});

function playNotificationSound() {
  try {
    // 既存の音声を停止
    stopNotificationSound();
    
    // 通知音を生成（ベル音のような音）
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // 音の設定
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // ループ音声を作成
    audioPlayer = setInterval(() => {
      try {
        const newAudioContext = new AudioContext();
        const newOscillator = newAudioContext.createOscillator();
        const newGainNode = newAudioContext.createGain();
        
        newOscillator.frequency.setValueAtTime(800, newAudioContext.currentTime);
        newOscillator.frequency.exponentialRampToValueAtTime(400, newAudioContext.currentTime + 0.1);
        
        newGainNode.gain.setValueAtTime(0.3, newAudioContext.currentTime);
        newGainNode.gain.exponentialRampToValueAtTime(0.01, newAudioContext.currentTime + 0.5);
        
        newOscillator.connect(newGainNode);
        newGainNode.connect(newAudioContext.destination);
        
        newOscillator.start();
        newOscillator.stop(newAudioContext.currentTime + 0.5);
      } catch (error) {
        console.error('Error in audio loop:', error);
      }
    }, 2000); // 2秒ごとにベル音を鳴らす
    
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

function stopNotificationSound() {
  if (audioPlayer) {
    clearInterval(audioPlayer);
    audioPlayer = null;
  }
}