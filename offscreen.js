let audioPlayer = null;

console.log('[OFFSCREEN] Offscreen document loaded');

// バックグラウンドスクリプトからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[OFFSCREEN] Message received:', message);

  if (message.action === 'playSound') {
    console.log('[OFFSCREEN] Playing sound, type:', message.notificationType);
    playNotificationSound(message.notificationType || 'wave');
    sendResponse({ success: true });
  } else if (message.action === 'stopSound') {
    console.log('[OFFSCREEN] Stopping sound');
    stopNotificationSound();
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});

function playNotificationSound(notificationType = 'wave') {
  try {
    console.log('[OFFSCREEN] playNotificationSound started, type:', notificationType);

    // 既存の音声を停止
    stopNotificationSound();

    // 通知タイプに応じた音声設定
    let soundConfig = getSoundConfig(notificationType);
    console.log('[OFFSCREEN] Sound config:', soundConfig);

    // 初回の音声を再生
    playSingleSound(soundConfig);
    console.log('[OFFSCREEN] Initial sound played');

    // ループ音声を作成
    audioPlayer = setInterval(() => {
      try {
        console.log('[OFFSCREEN] Playing loop sound');
        playSingleSound(soundConfig);
      } catch (error) {
        console.error('[OFFSCREEN] Error in audio loop:', error);
      }
    }, soundConfig.interval);

    console.log('[OFFSCREEN] Audio player interval set:', soundConfig.interval, 'ms');

  } catch (error) {
    console.error('[OFFSCREEN] Error playing notification sound:', error);
  }
}

function getSoundConfig(notificationType) {
  switch(notificationType) {
    case 'chat':
      // Chat: high tone bell-like sound, clear and crisp
      return {
        startFreq: 1200,   // higher frequency for bell-like sound
        endFreq: 800,      // still high for clarity
        volume: 0.2,       // slightly louder for clarity
        duration: 0.2,     // shorter for crispness
        interval: 4000     // longer interval (4 seconds)
      };
    case 'call':
      // Call: use current sound (same as wave)
      return {
        startFreq: 800,
        endFreq: 400,
        volume: 0.3,
        duration: 0.5,
        interval: 2000
      };
    case 'wave':
    default:
      // Wave: longer interval sound
      return {
        startFreq: 800,
        endFreq: 400,
        volume: 0.3,
        duration: 0.5,
        interval: 5000     // much longer interval (5 seconds)
      };
  }
}

function playSingleSound(config) {
  try {
    console.log('[OFFSCREEN] playSingleSound called with config:', config);

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // 音の設定
    oscillator.frequency.setValueAtTime(config.startFreq, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(config.endFreq, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + config.duration);

    console.log('[OFFSCREEN] Sound oscillator started and scheduled to stop');
  } catch (error) {
    console.error('[OFFSCREEN] Error in playSingleSound:', error);
  }
}

function stopNotificationSound() {
  if (audioPlayer) {
    console.log('[OFFSCREEN] Clearing audio player interval');
    clearInterval(audioPlayer);
    audioPlayer = null;
  } else {
    console.log('[OFFSCREEN] No audio player to stop');
  }
}