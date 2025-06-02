const TIMER_LIMIT = 2 * 60 * 1000; // 2 minutes
const blocks = document.querySelectorAll('.point-block');
const totalDisplay = document.getElementById('total');
const timerDisplay = document.getElementById('timer');

const timeoutSound = new Audio('beepwarning.mp3');
timeoutSound.preload = 'auto';

let timerInterval = null;
let startTime = 0;
let elapsedTime = 0;
let timerExpired = false;

// Unlock audio once on first user interaction (silent unlock)
document.body.addEventListener('click', function unlockOnce() {
  if (timeoutSound.paused) {
    timeoutSound.play().then(() => {
      timeoutSound.pause();
      timeoutSound.currentTime = 0;
    }).catch(() => {});
  }
  document.body.removeEventListener('click', unlockOnce);
});

// enableInteractions and disableInteractions kept for future but disableInteractions NOT called
function disableInteractions() {
  blocks.forEach(block => {
    block.style.pointerEvents = 'none';
    block.classList.add('disabled');

    block.querySelectorAll('.info-button').forEach(infoBtn => {
      infoBtn.style.pointerEvents = 'auto';
    });

    block.querySelectorAll('button').forEach(btn => {
      btn.disabled = true;
    });
  });
}

function enableInteractions() {
  blocks.forEach(block => {
    block.style.pointerEvents = 'auto';
    block.classList.remove('disabled');

    block.querySelectorAll('.info-button').forEach(infoBtn => {
      infoBtn.style.pointerEvents = 'auto';
    });

    block.querySelectorAll('button').forEach(btn => {
      btn.disabled = false;
    });
  });
}

// Prevent info button clicks from triggering block/timer behavior
document.querySelectorAll('.info-button').forEach(infoBtn => {
  infoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
  });
});

// Toggle style blocks – only one active per mission
document.querySelectorAll('.mission').forEach(mission => {
  const toggleBlocks = mission.querySelectorAll('.point-block.toggle');
  toggleBlocks.forEach(block => {
    block.addEventListener('click', () => {
      // Removed timerExpired check so toggles always clickable

      const isActive = block.classList.contains('active');
      toggleBlocks.forEach(b => b.classList.remove('active'));

      if (!isActive) {
        block.classList.add('active');
      }

      updateTotal();
    });
  });
});

// Counter style blocks
document.querySelectorAll('.point-block.counter').forEach(block => {
  const plus = block.querySelector('.plus');
  const minus = block.querySelector('.minus');
  const countElem = block.querySelector('.count');
  const max = parseInt(block.dataset.max) || 0;

  plus.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let count = parseInt(countElem.textContent) || 0;

    if (block.classList.contains('m04')) {
      let totalM04 = 0;
      document.querySelectorAll('.point-block.counter.m04 .count').forEach(elem => {
        totalM04 += parseInt(elem.textContent) || 0;
      });
      if (totalM04 >= 5) return;
    }

    if (count < max) {
      countElem.textContent = ++count;
      block.classList.add('active');
      updateTotal();
    }
  });

  minus.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let count = parseInt(countElem.textContent) || 0;
    if (count > 0) {
      countElem.textContent = --count;
      if (count === 0) block.classList.remove('active');
      updateTotal();
    }
  });
});

// Update total points
function updateTotal() {
  let total = 0;
  blocks.forEach(block => {
    const pointValue = parseInt(block.dataset.points) || 0;
    if (block.classList.contains('toggle') && block.classList.contains('active')) {
      total += pointValue;
    }
    if (block.classList.contains('counter')) {
      const count = parseInt(block.querySelector('.count')?.textContent) || 0;
      total += pointValue * count;
    }
  });
  totalDisplay.textContent = total;
}

// Reset all scores and timer
function resetScore() {
  blocks.forEach(block => {
    block.classList.remove('active');
    if (block.classList.contains('counter')) {
      const countElem = block.querySelector('.count');
      if (countElem) countElem.textContent = '0';
    }
  });

  totalDisplay.textContent = '0';
  enableInteractions();
  resetTimer();
}

// Timer display logic
function updateTimerDisplay() {
  const total = elapsedTime + (Date.now() - startTime);

  if (total >= TIMER_LIMIT) {
    stopTimer();
    timerExpired = true;
    timerDisplay.textContent = "TIME'S UP";
    timerDisplay.classList.add('timer-expired');

    // No disabling interactions here
    // disableInteractions(); 

    timeoutSound.play().catch(err => console.warn("Audio failed:", err));
    return;
  }

  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  timerDisplay.textContent = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
}

// Countdown popup element
const countdownPopup = document.createElement('div');
countdownPopup.style.position = 'fixed';
countdownPopup.style.top = '0';
countdownPopup.style.left = '0';
countdownPopup.style.width = '100vw';
countdownPopup.style.height = '100vh';
countdownPopup.style.backgroundColor = 'purple';
countdownPopup.style.display = 'none';
countdownPopup.style.justifyContent = 'center';
countdownPopup.style.alignItems = 'center';
countdownPopup.style.zIndex = '10000';
countdownPopup.style.color = 'white';
countdownPopup.style.fontSize = '10rem';
countdownPopup.style.fontWeight = 'bold';
countdownPopup.style.userSelect = 'none';
countdownPopup.style.cursor = 'default';

document.body.appendChild(countdownPopup);

// Show countdown 3-2-1 then callback
function showCountdown(callback) {
  let count = 3;
  countdownPopup.textContent = count;
  countdownPopup.style.display = 'flex';

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownPopup.textContent = count;
    } else {
      clearInterval(interval);
      countdownPopup.style.display = 'none';
      callback();
    }
  }, 1000);
}

// Start timer with countdown
function startTimer() {
  if (timerInterval || timerExpired) return;

  showCountdown(() => {
    startTime = Date.now();
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
  });
}

function stopTimer() {
  if (timerInterval) {
    elapsedTime += Date.now() - startTime;
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimer();
  elapsedTime = 0;
  timerExpired = false;
  timerDisplay.textContent = '00:00';
  timerDisplay.classList.remove('timer-expired');
}

// Play button logic
const playButton = document.getElementById('play-button');

playButton.addEventListener('click', () => {
  if (timerInterval || timerExpired) return;
  // unlockAudio();  <-- removed to avoid beep on button click
  startTimer();
});
