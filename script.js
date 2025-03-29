document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const logo = document.getElementById('logo');
    const piano = document.getElementById('piano');
    const feedback = document.getElementById('feedback');
    const feedbackText = document.getElementById('feedback-text');
    const timerDisplay = document.getElementById('timer');
    const continueBtn = document.getElementById('continue-btn');
    const keys = document.querySelectorAll('.key');
    const correctCountEl = document.getElementById('correct-count');
    const wrongCountEl = document.getElementById('wrong-count');
    const toggleLabelsBtn = document.getElementById('toggle-labels');
    const langButtons = document.querySelectorAll('.language-selector button');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const countdown = document.getElementById('countdown');
    const countdownNumber = document.getElementById('countdown-number');
    const body = document.body;
    
    // State variables
    let audioContext;
    let currentNote = '';
    let randomNote = '';
    let timer = null;
    let timeLeft = 10;
    let correctCount = 0;
    let wrongCount = 0;
    let labelsVisible = true;
    let currentLang = 'en';
    let isDarkMode = false;

    // Note frequency mapping
    const noteFrequencies = {
        'C': 261.63,
        'D': 293.66,
        'E': 329.63,
        'F': 349.23,
        'G': 392.00,
        'A': 440.00,
        'B': 493.88,
        'C2': 523.25
    };

    // Multi-language content
    const translations = {
        'zh': {
            'title': '音准练习',
            'clickToStart': '点击开始',
            'timeLeft': '剩余时间: ',
            'continue': '继续',
            'correct': '正确! 你按下了: ',
            'wrong': '错误! 你按下了: , 正确答案是: ',
            'timeUp': '时间到! 正确答案是: ',
            'hideNoteNames': '隐藏音名',
            'showNoteNames': '显示音名',
            'darkMode': '夜间模式',
            'lightMode': '日间模式'
        },
        'en': {
            'title': 'Pitch Practice',
            'clickToStart': 'Click to Start',
            'timeLeft': 'Time left: ',
            'continue': 'Continue',
            'correct': 'Correct! You pressed: ',
            'wrong': 'Wrong! You pressed: , correct answer is: ',
            'timeUp': 'Time up! Correct answer is: ',
            'hideNoteNames': 'Hide Note Names',
            'showNoteNames': 'Show Note Names',
            'darkMode': 'Dark Mode',
            'lightMode': 'Light Mode'
        },
        'ja': {
            'title': '音感トレーニング',
            'clickToStart': 'クリックして開始',
            'timeLeft': '残り時間: ',
            'continue': '続ける',
            'correct': '正解! あなたが押したのは: ',
            'wrong': '不正解! あなたが押したのは: , 正解は: ',
            'timeUp': '時間切れ! 正解は: ',
            'hideNoteNames': '音名を非表示',
            'showNoteNames': '音名を表示',
            'darkMode': 'ダークモード',
            'lightMode': 'ライトモード'
        }
    };

    // Initialize
    init();

    function init() {
        // Check saved dark mode setting from localStorage
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'true') {
            toggleDarkMode();
        }
        
        // Set language
        setLanguage('en');
        
        // Event listeners
        logo.addEventListener('click', function() {
            if (!audioContext) {
                initAudioContext();
            }
            startExercise();
        });
        
        continueBtn.addEventListener('click', nextRound);
        toggleLabelsBtn.addEventListener('click', toggleKeyLabels);
        darkModeToggle.addEventListener('click', toggleDarkMode);
        
        // Language button events
        langButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const lang = this.getAttribute('data-lang');
                setLanguage(lang);
            });
        });
        
        // Piano key events (fixed version)
        keys.forEach(key => {
            key.addEventListener('mousedown', handleKeyEvent);
            key.addEventListener('touchstart', handleKeyEvent, {passive: true});
        });
    }

    // Fixed key event handler
    function handleKeyEvent(e) {
        e.preventDefault();
        if (!randomNote || piano.classList.contains('disabled')) return;
        
        const note = this.getAttribute('data-note');
        this.classList.add('active'); // Immediate visual feedback
        checkAnswer(note);
    }

    function initAudioContext() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            alert("Your browser doesn't support Web Audio API");
        }
    }

    // Play note (using Web Audio API synthesis)
    function playNote(note, showHighlight = true) {
        if (!audioContext || !noteFrequencies[note]) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = noteFrequencies[note];
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(
            0.00001, 
            audioContext.currentTime + 0.8
        );
        
        // Stop oscillator to prevent memory leaks
        setTimeout(() => {
            oscillator.stop();
        }, 1000);
        
        // Highlight key
        if (showHighlight) highlightKey(note);
    }

    // Highlight piano key
    function highlightKey(note) {
        // Remove all highlights
        keys.forEach(key => {
            key.classList.remove('active');
        });
        
        // Highlight the key corresponding to current note
        const keyToHighlight = Array.from(keys).find(key => 
            key.getAttribute('data-note') === note
        );
        
        if (keyToHighlight) {
            keyToHighlight.classList.add('active');
            
            // Remove highlight after 0.5 seconds
            setTimeout(() => {
                keyToHighlight.classList.remove('active');
            }, 500);
        }
    }

    function startExercise() {
        logo.classList.add('fade-out');
        
        setTimeout(() => {
            logo.classList.add('hidden');
            piano.classList.add('visible');
            startCountdown();
        }, 500);
    }
    
    function startCountdown() {
        let count = 3;
        countdownNumber.textContent = count;
        countdown.classList.remove('hidden');
        
        const countdownInterval = setInterval(() => {
            count--;
            countdownNumber.textContent = count;
            
            if (count <= 0) {
                clearInterval(countdownInterval);
                countdown.classList.add('hidden');
                playScale();
            }
        }, 1000);
    }

    function playScale() {
        const scale = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2'];
        let i = 0;
        
        // Disable keyboard clicks
        piano.classList.add('disabled');
        
        function playNextNote() {
            if (i < scale.length) {
                const note = scale[i];
                currentNote = note;
                highlightKey(note);
                playNote(note);
                i++;
                setTimeout(playNextNote, 800);
            } else {
                // Scale finished, start training
                setTimeout(startTraining, 1000);
            }
        }
        
        playNextNote();
    }
    
    function startTraining() {
        // Enable keyboard clicks
        piano.classList.remove('disabled');
        
        // Play reference note C
        currentNote = 'C';
        playNote(currentNote);
        highlightKey(currentNote);
        
        // After 1 second, play random note (without highlight)
        setTimeout(() => {
            const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2'];
            randomNote = notes[Math.floor(Math.random() * notes.length)];
            playNote(randomNote, false);
            
            // Start timer
            startTimer();
        }, 1000);
    }
    
    function checkAnswer(note) {
        // Stop timer
        clearInterval(timer);
        
        // Disable keyboard clicks
        piano.classList.add('disabled');
        
        // Show feedback
        feedback.classList.remove('hidden');
        
        if (note === randomNote) {
            // Correct answer
            correctCount++;
            correctCountEl.textContent = correctCount;
            feedbackText.innerHTML = `<span class="correct">${translations[currentLang]['correct']}</span>${note}`;
            playSuccessSound();
            
            // Automatically proceed to next round
            setTimeout(nextRound, 1500);
        } else {
            // Wrong answer
            wrongCount++;
            wrongCountEl.textContent = wrongCount;
            feedbackText.innerHTML = `<span class="incorrect">${translations[currentLang]['wrong'].split(',')[0]}</span>${note}${translations[currentLang]['wrong'].split(',')[1]}${randomNote}`;
            playErrorSound();
            
            // Show continue button
            continueBtn.classList.remove('hidden');
            
            // Highlight correct answer
            highlightKey(randomNote);
        }
    }
    
    function nextRound() {
        // Hide feedback and continue button
        feedback.classList.add('hidden');
        continueBtn.classList.add('hidden');
        
        // Reset state
        randomNote = '';
        
        // Start new training round
        startTraining();
    }
    
    function startTimer() {
        timeLeft = 10;
        updateTimerDisplay();
        
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                wrongCount++;
                wrongCountEl.textContent = wrongCount;
                feedbackText.innerHTML = `<span class="incorrect">${translations[currentLang]['timeUp']}</span>${randomNote}`;
                feedback.classList.remove('hidden');
                playErrorSound();
                
                // Show continue button
                continueBtn.classList.remove('hidden');
                
                // Highlight correct answer
                highlightKey(randomNote);
                
                // Disable keyboard clicks
                piano.classList.add('disabled');
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        timerDisplay.textContent = translations[currentLang]['timeLeft'] + timeLeft + (currentLang === 'en' ? 's' : '秒');
    }
    
    function playSuccessSound() {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        oscillator.frequency.setValueAtTime(1318.51, audioContext.currentTime + 0.1); // E6
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.value = 0.3;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    function playErrorSound() {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.value = 220; // A3
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.value = 0.3;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
        oscillator.stop(audioContext.currentTime + 0.8);
    }

    // Toggle key labels visibility
    function toggleKeyLabels() {
        labelsVisible = !labelsVisible;
        keys.forEach(key => {
            const label = key.querySelector('span');
            if (label) {
                label.style.display = labelsVisible ? 'block' : 'none';
            }
        });
        updateToggleLabelsText();
    }

    // Update label toggle button text
    function updateToggleLabelsText() {
        toggleLabelsBtn.textContent = labelsVisible ? 
            translations[currentLang]['hideNoteNames'] : 
            translations[currentLang]['showNoteNames'];
    }

    // Toggle dark mode
    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        body.classList.toggle('dark-mode', isDarkMode);
        darkModeToggle.textContent = isDarkMode ? 
            translations[currentLang]['lightMode'] : 
            translations[currentLang]['darkMode'];
        localStorage.setItem('darkMode', isDarkMode);
    }

    // Set language
    function setLanguage(lang) {
        currentLang = lang;
        
        // Update UI text
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
        
        // Update button states
        langButtons.forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.style.fontWeight = 'bold';
                btn.style.background = isDarkMode ? '#555' : '#eee';
            } else {
                btn.style.fontWeight = 'normal';
                btn.style.background = isDarkMode ? '#333' : '#fff';
            }
        });
        
        // Update label toggle button text
        updateToggleLabelsText();
    }
});