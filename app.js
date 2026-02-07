// Reading Hero - Educational Reading Game
// Main Application Logic

class ReadingGame {
    constructor() {
        // Game state
        this.words = [];
        this.currentIndex = 0;
        this.score = 0;
        this.skipped = 0;
        this.timerDuration = 10;
        this.timeRemaining = 10;
        this.timerInterval = null;
        this.isGameActive = false;
        this.isProcessingAnswer = false;

        // Streak tracking
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.wrongInARow = 0;

        // Difficulty settings
        this.difficulty = 'medium';
        this.difficultySettings = {
            easy: { time: 20, matchThreshold: 0.5 },
            medium: { time: 10, matchThreshold: 0.4 },
            hard: { time: 5, matchThreshold: 0.25 }
        };

        // Sound settings
        this.soundEnabled = true;

        // Speech recognition
        this.recognition = null;
        this.isListening = false;
        this.recognitionRestarting = false;
        this.resultStartIndex = 0;
        this.currentResultLength = 0;

        // Puzzle state
        this.puzzleImage = null;
        this.puzzlePieces = [];
        this.revealedPieces = 0;

        // Track missed words for review
        this.missedWords = [];

        // Pre-made word lists
        this.premadeLists = {
            'sight-words-k': {
                name: 'Kindergarten Sight Words',
                words: ['the', 'and', 'a', 'to', 'said', 'it', 'he', 'she', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'I', 'at', 'be', 'this']
            },
            'sight-words-1': {
                name: '1st Grade Sight Words',
                words: ['have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can', 'an', 'each', 'which', 'their']
            },
            'cvc-words': {
                name: 'CVC Words',
                words: ['cat', 'dog', 'run', 'sit', 'hop', 'map', 'pen', 'bed', 'pig', 'fox', 'sun', 'cup', 'bat', 'hat', 'red', 'leg', 'bus', 'rug', 'pot', 'log']
            },
            'simple-sentences': {
                name: 'Simple Sentences',
                words: ['I see a cat', 'The dog is big', 'I can run fast', 'She is happy', 'We like to play', 'The sun is hot', 'I love my mom', 'He has a hat', 'We go to school', 'I can read']
            }
        };

        // Character buddy messages
        this.buddyMessages = {
            start: ['Let\'s go!', 'You can do it!', 'I believe in you!'],
            correct: ['Great job!', 'Awesome!', 'You\'re amazing!', 'Perfect!', 'Way to go!'],
            streak3: ['🔥 On fire!', '3 in a row!', 'Keep it up!'],
            streak5: ['⚡ Incredible!', '5 streak!', 'Unstoppable!'],
            streak10: ['🌟 SUPERSTAR!', '10 streak!', 'LEGENDARY!'],
            struggling: ['You got this!', 'Take your time!', 'Keep trying!', 'Almost there!'],
            timeout: ['No worries!', 'Try the next one!', 'You\'ll get it!']
        };

        // Audio context for sounds
        this.audioContext = null;

        // DOM Elements
        this.elements = {
            // Screens
            setupScreen: document.getElementById('setup-screen'),
            gameScreen: document.getElementById('game-screen'),
            resultsScreen: document.getElementById('results-screen'),
            dashboardScreen: document.getElementById('dashboard-screen'),

            // Setup screen elements
            wordInput: document.getElementById('word-input'),
            timerSetting: document.getElementById('timer-setting'),
            savedLists: document.getElementById('saved-lists'),
            startBtn: document.getElementById('start-btn'),
            puzzleImageInput: document.getElementById('puzzle-image-input'),
            uploadPuzzleBtn: document.getElementById('upload-puzzle-btn'),
            puzzleFilename: document.getElementById('puzzle-filename'),
            puzzlePreview: document.getElementById('puzzle-preview'),
            soundToggle: document.getElementById('sound-toggle'),
            dashboardBtn: document.getElementById('dashboard-btn'),

            // Game screen elements
            homeBtn: document.getElementById('home-btn'),
            gameSoundToggle: document.getElementById('game-sound-toggle'),
            score: document.getElementById('score'),
            scorePopup: document.getElementById('score-popup'),
            total: document.getElementById('total'),
            currentNum: document.getElementById('current-num'),
            totalWords: document.getElementById('total-words'),
            timerRingProgress: document.getElementById('timer-ring-progress'),
            timerText: document.getElementById('timer-text'),
            wordDisplay: document.getElementById('word-display'),
            currentWord: document.getElementById('current-word'),
            wordProgress: document.getElementById('word-progress'),
            micIndicator: document.getElementById('mic-indicator'),
            micStatus: document.getElementById('mic-status'),
            heardText: document.getElementById('heard-text'),
            feedback: document.getElementById('feedback'),
            skipBtn: document.getElementById('skip-btn'),
            puzzleContainer: document.getElementById('puzzle-container'),
            puzzleGrid: document.getElementById('puzzle-grid'),
            streakContainer: document.getElementById('streak-container'),
            streakCount: document.getElementById('streak-count'),
            characterBuddy: document.getElementById('character-buddy'),
            buddySpeech: document.getElementById('buddy-speech'),

            // Results screen elements
            finalScore: document.getElementById('final-score'),
            finalTotal: document.getElementById('final-total'),
            scoreMessage: document.getElementById('score-message'),
            correctCount: document.getElementById('correct-count'),
            skippedCount: document.getElementById('skipped-count'),
            bestStreakStat: document.getElementById('best-streak-stat'),
            bestStreak: document.getElementById('best-streak'),
            playAgainBtn: document.getElementById('play-again-btn'),
            newWordsBtn: document.getElementById('new-words-btn'),
            practiceMissedBtn: document.getElementById('practice-missed-btn'),

            // Review section on results
            missedWordsList: document.getElementById('missed-words-list'),
            missedWordsSection: document.getElementById('missed-words-section'),

            // Dashboard elements
            dashboardBackBtn: document.getElementById('dashboard-back-btn'),
            totalSessions: document.getElementById('total-sessions'),
            totalWordsRead: document.getElementById('total-words-read'),
            avgAccuracy: document.getElementById('avg-accuracy'),
            allTimeStreak: document.getElementById('all-time-streak'),
            mostMissedWords: document.getElementById('most-missed-words'),
            sessionHistory: document.getElementById('session-history'),
            clearHistoryBtn: document.getElementById('clear-history-btn'),

            // Milestone overlay
            milestoneOverlay: document.getElementById('milestone-overlay'),
            milestoneEmoji: document.getElementById('milestone-emoji'),
            milestoneText: document.getElementById('milestone-text'),

            // Other
            confettiContainer: document.getElementById('confetti-container')
        };

        this.init();
    }

    init() {
        this.initSpeechRecognition();
        this.initAudio();
        this.loadSavedLists();
        this.loadSettings();
        this.bindEvents();
        this.requestMicrophonePermission();
    }

    loadSettings() {
        // Load sound preference
        const soundPref = localStorage.getItem('soundEnabled');
        if (soundPref !== null) {
            this.soundEnabled = soundPref === 'true';
            this.elements.soundToggle.checked = this.soundEnabled;
        }

        // Load difficulty
        const diffPref = localStorage.getItem('difficulty');
        if (diffPref && this.difficultySettings[diffPref]) {
            this.setDifficulty(diffPref);
        }
    }

    setDifficulty(level) {
        this.difficulty = level;
        const settings = this.difficultySettings[level];
        this.timerDuration = settings.time;
        this.elements.timerSetting.value = settings.time.toString();

        // Update UI
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === level);
        });

        localStorage.setItem('difficulty', level);
    }

    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: 48000,
                }
            });
            stream.getTracks().forEach(track => track.stop());
            console.log('Microphone permission granted');
        } catch (err) {
            console.log('Microphone permission denied or error:', err);
        }
    }

    // ==================== Character Buddy ====================

    showBuddyMessage(type, customMessage = null) {
        const messages = this.buddyMessages[type];
        const message = customMessage || messages[Math.floor(Math.random() * messages.length)];

        this.elements.buddySpeech.textContent = message;
        this.elements.buddySpeech.classList.add('show');
        this.elements.characterBuddy.classList.add('bounce');

        setTimeout(() => {
            this.elements.buddySpeech.classList.remove('show');
            this.elements.characterBuddy.classList.remove('bounce');
        }, 2000);
    }

    // ==================== Milestone Celebrations ====================

    showMilestone(count) {
        let emoji, text;

        if (count === 5) {
            emoji = '⭐';
            text = '5 Correct!';
        } else if (count === 10) {
            emoji = '🌟';
            text = '10 Correct!';
        } else if (count === 15) {
            emoji = '🏆';
            text = '15 Correct!';
        } else if (count === 20) {
            emoji = '👑';
            text = '20 Correct!';
        } else {
            return;
        }

        this.elements.milestoneEmoji.textContent = emoji;
        this.elements.milestoneText.textContent = text;
        this.elements.milestoneOverlay.style.display = 'flex';

        if (this.soundEnabled) {
            this.playMilestoneSound();
        }

        setTimeout(() => {
            this.elements.milestoneOverlay.style.display = 'none';
        }, 1500);
    }

    playMilestoneSound() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Celebratory chord
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
            gain.gain.linearRampToValueAtTime(0, now + 0.8);
            osc.start(now);
            osc.stop(now + 1);
        });
    }

    // ==================== Speech Recognition ====================

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Sorry, your browser does not support speech recognition. Please use Chrome or Edge.');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;

        this.recognition.onstart = () => {
            console.log('Speech recognition started');
            this.isListening = true;
            this.recognitionRestarting = false;
            this.elements.micIndicator.classList.remove('inactive');
            this.elements.micStatus.textContent = 'Listening...';
        };

        this.recognition.onresult = (event) => {
            this.currentResultLength = event.results.length;

            if (!this.isGameActive) return;

            let currentTranscript = '';

            for (let i = this.resultStartIndex; i < event.results.length; i++) {
                const result = event.results[i];
                currentTranscript += result[0].transcript + ' ';
            }

            currentTranscript = currentTranscript.trim();

            if (currentTranscript) {
                this.elements.heardText.textContent = `I heard: "${currentTranscript}"`;
                this.checkAnswer(currentTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.log('Speech recognition error:', event.error);

            if (event.error === 'aborted') return;

            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                this.elements.micStatus.textContent = 'No speech detected, still listening...';
            }

            if (event.error === 'not-allowed') {
                this.elements.micStatus.textContent = 'Microphone blocked - check browser permissions';
                this.elements.heardText.textContent = 'Please allow microphone access and refresh the page';
            }
        };

        this.recognition.onend = () => {
            console.log('Speech recognition ended, isGameActive:', this.isGameActive);
            this.isListening = false;

            if (this.isGameActive && !this.recognitionRestarting) {
                this.recognitionRestarting = true;
                setTimeout(() => {
                    if (this.isGameActive) {
                        this.startListening();
                    }
                }, 100);
            }
        };
    }

    startListening() {
        if (!this.recognition) return;
        if (this.isListening) return;

        try {
            this.recognition.start();
        } catch (e) {
            if (e.message.includes('already started')) {
                this.isListening = true;
            }
        }
    }

    stopListening() {
        if (!this.recognition) return;

        this.recognitionRestarting = false;

        try {
            this.recognition.abort();
        } catch (e) {
            console.log('Stop error:', e.message);
        }

        this.isListening = false;
        this.elements.micIndicator.classList.add('inactive');
        this.elements.micStatus.textContent = 'Microphone off';
    }

    resetForNewWord() {
        this.resultStartIndex = this.currentResultLength;
    }

    // ==================== Audio (Sound Effects) ====================

    initAudio() {
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        switch (type) {
            case 'success':
                this.playSuccessSound(ctx, now);
                break;
            case 'tryAgain':
                this.playTryAgainSound(ctx, now);
                break;
            case 'tick':
                this.playTickSound(ctx, now);
                break;
            case 'gameComplete':
                this.playGameCompleteSound(ctx, now);
                break;
            case 'streak':
                this.playStreakSound(ctx, now);
                break;
        }
    }

    playSuccessSound(ctx, now) {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.3);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.4);
        });
    }

    playStreakSound(ctx, now) {
        // Higher pitched, more exciting sound
        const notes = [659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.25, now + i * 0.08 + 0.03);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.2);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.3);
        });
    }

    playTryAgainSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 220;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    playTickSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playGameCompleteSound(ctx, now) {
        const melody = [
            { freq: 523.25, time: 0 },
            { freq: 659.25, time: 0.15 },
            { freq: 783.99, time: 0.3 },
            { freq: 1046.50, time: 0.45 },
            { freq: 783.99, time: 0.6 },
            { freq: 1046.50, time: 0.75 }
        ];

        melody.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.value = note.freq;
            gain.gain.setValueAtTime(0, now + note.time);
            gain.gain.linearRampToValueAtTime(0.25, now + note.time + 0.05);
            gain.gain.linearRampToValueAtTime(0, now + note.time + 0.25);
            osc.start(now + note.time);
            osc.stop(now + note.time + 0.3);
        });
    }

    // ==================== Game Logic ====================

    startGame(wordsOverride = null) {
        let input;
        if (wordsOverride) {
            input = wordsOverride.join('\n');
        } else {
            input = this.elements.wordInput.value.trim();
        }

        if (!input) {
            alert('Please enter some words or sentences to practice!');
            return;
        }

        this.words = input.split('\n')
            .map(w => w.trim())
            .filter(w => w.length > 0);

        if (this.words.length === 0) {
            alert('Please enter some words or sentences to practice!');
            return;
        }

        this.shuffleArray(this.words);

        if (!wordsOverride) {
            this.saveCurrentList();
        }

        this.timerDuration = parseInt(this.elements.timerSetting.value);

        // Reset game state
        this.currentIndex = 0;
        this.score = 0;
        this.skipped = 0;
        this.missedWords = [];
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.wrongInARow = 0;
        this.isGameActive = true;

        // Update UI
        this.elements.total.textContent = this.words.length;
        this.elements.totalWords.textContent = this.words.length;
        this.updateScore();
        this.updateStreakDisplay();

        // Initialize puzzle if image is uploaded
        this.initPuzzle();

        // Switch to game screen
        this.showScreen('game');

        // Show start message from buddy
        this.showBuddyMessage('start');

        // Start the game
        this.showCurrentWord();
        this.startListening();
    }

    showCurrentWord() {
        if (this.currentIndex >= this.words.length) {
            this.endGame();
            return;
        }

        this.isProcessingAnswer = false;
        this.resetForNewWord();

        const word = this.words[this.currentIndex];
        this.elements.currentWord.textContent = word;
        this.elements.currentNum.textContent = this.currentIndex + 1;

        this.elements.feedback.textContent = '';
        this.elements.feedback.className = 'feedback';
        this.elements.heardText.textContent = '';
        this.elements.wordProgress.innerHTML = '';
        this.elements.wordDisplay.classList.remove('success', 'error');

        this.startTimer();
    }

    startTimer() {
        this.timeRemaining = this.timerDuration;
        this.updateTimerDisplay();

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 3 && this.timeRemaining > 0) {
                this.playSound('tick');
            }

            if (this.timeRemaining <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        this.elements.timerText.textContent = this.timeRemaining;

        const circumference = 283;
        const progress = (this.timeRemaining / this.timerDuration) * circumference;
        this.elements.timerRingProgress.style.strokeDashoffset = circumference - progress;

        const ring = this.elements.timerRingProgress;
        ring.classList.remove('warning', 'danger');

        if (this.timeRemaining <= 3) {
            ring.classList.add('danger');
        } else if (this.timeRemaining <= 5) {
            ring.classList.add('warning');
        }
    }

    handleTimeout() {
        clearInterval(this.timerInterval);

        this.missedWords.push(this.words[this.currentIndex]);
        this.currentStreak = 0;
        this.wrongInARow++;

        // Check if struggling
        if (this.wrongInARow >= 2) {
            this.showBuddyMessage('struggling');
        } else {
            this.showBuddyMessage('timeout');
        }

        this.updateStreakDisplay();

        this.elements.feedback.textContent = "Time's up! Let's try the next one.";
        this.elements.feedback.className = 'feedback try-again';
        this.playSound('tryAgain');

        this.skipped++;

        setTimeout(() => {
            this.currentIndex++;
            this.showCurrentWord();
        }, 1500);
    }

    checkAnswer(spokenText) {
        if (this.isProcessingAnswer) return;

        const target = this.words[this.currentIndex].toLowerCase().trim();
        const spoken = spokenText.toLowerCase().trim();

        this.updateWordProgress(spoken, target);

        if (this.isMatch(spoken, target)) {
            this.isProcessingAnswer = true;
            this.handleCorrectAnswer();
        }
    }

    updateWordProgress(spoken, target) {
        const targetWords = this.normalizeText(target).split(' ');
        const spokenWords = this.normalizeText(spoken).split(' ');

        if (targetWords.length <= 1) {
            this.elements.wordProgress.innerHTML = '';
            return;
        }

        let matchedCount = 0;
        for (const spokenWord of spokenWords) {
            if (matchedCount < targetWords.length && this.wordsSimilar(spokenWord, targetWords[matchedCount])) {
                matchedCount++;
            }
        }

        const progressHtml = targetWords.map((word, index) => {
            if (index < matchedCount) {
                return `<span class="word-matched">✓ ${word}</span>`;
            } else if (index === matchedCount) {
                return `<span class="word-current">→ ${word}</span>`;
            } else {
                return `<span class="word-pending">${word}</span>`;
            }
        }).join(' ');

        this.elements.wordProgress.innerHTML = progressHtml;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    isMatch(spoken, target) {
        const normalizedSpoken = this.normalizeText(spoken);
        const normalizedTarget = this.normalizeText(target);

        const targetWords = normalizedTarget.split(' ');
        const spokenWords = normalizedSpoken.split(' ');
        const isSentence = targetWords.length > 1;

        // Get match threshold based on difficulty
        const threshold = this.difficultySettings[this.difficulty].matchThreshold;

        if (isSentence) {
            if (spokenWords.length < targetWords.length) {
                return false;
            }

            let targetIndex = 0;
            for (const spokenWord of spokenWords) {
                if (targetIndex < targetWords.length && this.wordsSimilar(spokenWord, targetWords[targetIndex], threshold)) {
                    targetIndex++;
                }
            }

            return targetIndex === targetWords.length;
        }

        if (normalizedSpoken.includes(normalizedTarget)) {
            return true;
        }

        for (const spokenWord of spokenWords) {
            const maxDistance = Math.max(1, Math.ceil(normalizedTarget.length * threshold));
            if (this.levenshteinDistance(spokenWord, normalizedTarget) <= maxDistance) {
                return true;
            }

            if (this.phoneticallyClose(spokenWord, normalizedTarget)) {
                return true;
            }
        }

        return false;
    }

    phoneticallyClose(spoken, target) {
        const substitutions = [
            ['th', 'd'], ['th', 'f'], ['r', 'w'], ['l', 'w'],
            ['s', 'th'], ['ch', 'sh'], ['j', 'ch'], ['v', 'b'], ['ing', 'in']
        ];

        for (const [a, b] of substitutions) {
            const targetWithSub = target.replace(new RegExp(a, 'g'), b);
            const spokenWithSub = spoken.replace(new RegExp(b, 'g'), a);

            if (spoken === targetWithSub || spokenWithSub === target) {
                return true;
            }

            if (this.levenshteinDistance(spoken, targetWithSub) <= 1) {
                return true;
            }
        }

        const spokenConsonants = spoken.replace(/[aeiou]/g, '');
        const targetConsonants = target.replace(/[aeiou]/g, '');
        if (spokenConsonants === targetConsonants && spokenConsonants.length >= 2) {
            return true;
        }

        return false;
    }

    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    wordsSimilar(word1, word2, threshold = null) {
        if (word1 === word2) return true;

        const t = threshold || this.difficultySettings[this.difficulty].matchThreshold;
        const maxDistance = Math.max(2, Math.ceil(Math.min(word1.length, word2.length) * t));
        if (this.levenshteinDistance(word1, word2) <= maxDistance) {
            return true;
        }

        if (this.phoneticallyClose(word1, word2)) {
            return true;
        }

        return false;
    }

    levenshteinDistance(a, b) {
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    handleCorrectAnswer() {
        clearInterval(this.timerInterval);

        this.elements.currentWord.classList.add('highlighted');

        this.score++;
        this.currentStreak++;
        this.wrongInARow = 0;

        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
        }

        this.updateScoreWithAnimation();
        this.updateStreakDisplay();

        // Show buddy message based on streak
        if (this.currentStreak === 10) {
            this.showBuddyMessage('streak10');
            this.playSound('streak');
        } else if (this.currentStreak === 5) {
            this.showBuddyMessage('streak5');
            this.playSound('streak');
        } else if (this.currentStreak === 3) {
            this.showBuddyMessage('streak3');
        } else {
            this.showBuddyMessage('correct');
        }

        // Check for milestones
        if ([5, 10, 15, 20].includes(this.score)) {
            this.showMilestone(this.score);
        }

        this.elements.feedback.textContent = '🎉 Awesome! Great job!';
        this.elements.feedback.className = 'feedback success';
        this.elements.wordDisplay.classList.add('success');

        this.playSound('success');
        this.createStarBurst();
        this.revealPuzzlePiece();

        setTimeout(() => {
            this.elements.currentWord.classList.remove('highlighted');
            this.currentIndex++;
            this.showCurrentWord();
        }, 1200);
    }

    updateScore() {
        this.elements.score.textContent = this.score;
    }

    updateScoreWithAnimation() {
        this.elements.score.textContent = this.score;

        this.elements.score.classList.add('bump');
        setTimeout(() => {
            this.elements.score.classList.remove('bump');
        }, 400);

        this.elements.scorePopup.classList.remove('show');
        void this.elements.scorePopup.offsetWidth;
        this.elements.scorePopup.classList.add('show');
    }

    updateStreakDisplay() {
        if (this.currentStreak >= 2) {
            this.elements.streakContainer.style.display = 'flex';
            this.elements.streakCount.textContent = this.currentStreak;
            this.elements.streakContainer.classList.add('pulse');
            setTimeout(() => {
                this.elements.streakContainer.classList.remove('pulse');
            }, 500);
        } else {
            this.elements.streakContainer.style.display = 'none';
        }
    }

    skipWord() {
        clearInterval(this.timerInterval);
        this.missedWords.push(this.words[this.currentIndex]);
        this.currentStreak = 0;
        this.wrongInARow++;
        this.skipped++;

        this.updateStreakDisplay();

        // Check if struggling
        if (this.wrongInARow >= 2) {
            this.showBuddyMessage('struggling');
        }

        this.elements.feedback.textContent = 'Skipped! Moving on...';
        this.elements.feedback.className = 'feedback try-again';

        setTimeout(() => {
            this.currentIndex++;
            this.showCurrentWord();
        }, 800);
    }

    endGame() {
        this.isGameActive = false;
        this.stopListening();
        clearInterval(this.timerInterval);

        // Save session to history
        this.saveSession();

        // Update results
        this.elements.finalScore.textContent = this.score;
        this.elements.finalTotal.textContent = this.words.length;
        this.elements.correctCount.textContent = this.score;
        this.elements.skippedCount.textContent = this.skipped;

        // Show best streak if > 0
        if (this.bestStreak > 0) {
            this.elements.bestStreakStat.style.display = 'flex';
            this.elements.bestStreak.textContent = this.bestStreak;
        } else {
            this.elements.bestStreakStat.style.display = 'none';
        }

        const percentage = (this.score / this.words.length) * 100;
        let message = '';
        if (percentage === 100) {
            message = "Perfect! You're a Reading Superstar! ⭐";
        } else if (percentage >= 80) {
            message = "Amazing work! You're a Reading Star! 🌟";
        } else if (percentage >= 60) {
            message = "Great job! Keep practicing! 👏";
        } else if (percentage >= 40) {
            message = "Good effort! Practice makes perfect! 💪";
        } else {
            message = "Nice try! Let's practice more! 📚";
        }
        this.elements.scoreMessage.textContent = message;

        if (this.missedWords.length > 0) {
            this.elements.missedWordsSection.style.display = 'block';
            this.elements.missedWordsList.innerHTML = this.missedWords
                .map(word => `<li>${word}</li>`)
                .join('');
        } else {
            this.elements.missedWordsSection.style.display = 'none';
        }

        this.playSound('gameComplete');
        this.showScreen('results');

        if (percentage >= 60) {
            this.createConfetti();
        }
    }

    // ==================== Session History & Dashboard ====================

    saveSession() {
        const session = {
            date: new Date().toISOString(),
            score: this.score,
            total: this.words.length,
            skipped: this.skipped,
            bestStreak: this.bestStreak,
            missedWords: [...this.missedWords],
            accuracy: Math.round((this.score / this.words.length) * 100)
        };

        const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
        history.unshift(session);

        // Keep last 50 sessions
        if (history.length > 50) {
            history.pop();
        }

        localStorage.setItem('sessionHistory', JSON.stringify(history));

        // Update all-time best streak
        const allTimeBest = parseInt(localStorage.getItem('allTimeBestStreak') || '0');
        if (this.bestStreak > allTimeBest) {
            localStorage.setItem('allTimeBestStreak', this.bestStreak.toString());
        }
    }

    loadDashboard() {
        const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');

        if (history.length === 0) {
            this.elements.totalSessions.textContent = '0';
            this.elements.totalWordsRead.textContent = '0';
            this.elements.avgAccuracy.textContent = '0%';
            this.elements.allTimeStreak.textContent = '0';
            this.elements.mostMissedWords.innerHTML = '<p class="no-data">No data yet.</p>';
            this.elements.sessionHistory.innerHTML = '<p class="no-data">No sessions recorded yet.</p>';
            return;
        }

        // Calculate stats
        const totalSessions = history.length;
        const totalWords = history.reduce((sum, s) => sum + s.total, 0);
        const totalCorrect = history.reduce((sum, s) => sum + s.score, 0);
        const avgAccuracy = Math.round((totalCorrect / totalWords) * 100);
        const allTimeBest = localStorage.getItem('allTimeBestStreak') || '0';

        this.elements.totalSessions.textContent = totalSessions;
        this.elements.totalWordsRead.textContent = totalWords;
        this.elements.avgAccuracy.textContent = avgAccuracy + '%';
        this.elements.allTimeStreak.textContent = allTimeBest;

        // Most missed words
        const missedCount = {};
        history.forEach(s => {
            s.missedWords.forEach(word => {
                missedCount[word] = (missedCount[word] || 0) + 1;
            });
        });

        const sortedMissed = Object.entries(missedCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (sortedMissed.length > 0) {
            this.elements.mostMissedWords.innerHTML = sortedMissed
                .map(([word, count]) => `<div class="missed-word-item"><span class="word">${word}</span><span class="count">${count}x</span></div>`)
                .join('');
        } else {
            this.elements.mostMissedWords.innerHTML = '<p class="no-data">No missed words yet. Great job!</p>';
        }

        // Session history
        this.elements.sessionHistory.innerHTML = history.slice(0, 10)
            .map(s => {
                const date = new Date(s.date).toLocaleDateString();
                return `<div class="session-item">
                    <span class="session-date">${date}</span>
                    <span class="session-score">${s.score}/${s.total}</span>
                    <span class="session-accuracy">${s.accuracy}%</span>
                </div>`;
            })
            .join('');
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all progress data? This cannot be undone.')) {
            localStorage.removeItem('sessionHistory');
            localStorage.removeItem('allTimeBestStreak');
            this.loadDashboard();
        }
    }

    // ==================== Visual Effects ====================

    createStarBurst() {
        const container = document.createElement('div');
        container.className = 'star-burst';

        const rect = this.elements.wordDisplay.getBoundingClientRect();
        container.style.left = rect.left + rect.width / 2 + 'px';
        container.style.top = rect.top + rect.height / 2 + 'px';

        const stars = ['⭐', '✨', '🌟', '💫'];
        const angles = [0, 45, 90, 135, 180, 225, 270, 315];

        angles.forEach(angle => {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = stars[Math.floor(Math.random() * stars.length)];

            const distance = 80 + Math.random() * 40;
            const tx = Math.cos(angle * Math.PI / 180) * distance;
            const ty = Math.sin(angle * Math.PI / 180) * distance;

            star.style.setProperty('--tx', tx + 'px');
            star.style.setProperty('--ty', ty + 'px');

            container.appendChild(star);
        });

        document.body.appendChild(container);

        setTimeout(() => container.remove(), 1000);
    }

    createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#6c5ce7'];
        const container = this.elements.confettiContainer;

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (2 + Math.random() * 2) + 's';

            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            }

            container.appendChild(confetti);
        }

        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

    // ==================== Screen Management ====================

    showScreen(screenName) {
        this.elements.setupScreen.classList.remove('active');
        this.elements.gameScreen.classList.remove('active');
        this.elements.resultsScreen.classList.remove('active');
        this.elements.dashboardScreen.classList.remove('active');

        switch (screenName) {
            case 'setup':
                this.elements.setupScreen.classList.add('active');
                break;
            case 'game':
                this.elements.gameScreen.classList.add('active');
                break;
            case 'results':
                this.elements.resultsScreen.classList.add('active');
                break;
            case 'dashboard':
                this.elements.dashboardScreen.classList.add('active');
                this.loadDashboard();
                break;
        }
    }

    // ==================== Storage ====================

    saveCurrentList() {
        const input = this.elements.wordInput.value.trim();
        if (!input) return;

        const words = input.split('\n').filter(w => w.trim());
        const listName = words[0].substring(0, 15) + (words.length > 1 ? ` (+${words.length - 1})` : '');

        const savedLists = JSON.parse(localStorage.getItem('readingGameLists') || '{}');

        const key = Date.now().toString();
        savedLists[key] = {
            name: listName,
            content: input,
            date: new Date().toLocaleDateString()
        };

        const keys = Object.keys(savedLists).sort().reverse();
        if (keys.length > 10) {
            keys.slice(10).forEach(k => delete savedLists[k]);
        }

        localStorage.setItem('readingGameLists', JSON.stringify(savedLists));
        this.loadSavedLists();
    }

    loadSavedLists() {
        const savedLists = JSON.parse(localStorage.getItem('readingGameLists') || '{}');
        const container = this.elements.savedLists;
        container.innerHTML = '';

        const keys = Object.keys(savedLists).sort().reverse();

        if (keys.length === 0) {
            container.innerHTML = '<p class="no-saved-lists">No saved lists yet</p>';
            return;
        }

        keys.forEach(key => {
            const list = savedLists[key];
            const item = document.createElement('div');
            item.className = 'saved-list-item';
            item.innerHTML = `
                <span class="list-name">${list.name}</span>
                <button class="delete-list" data-key="${key}">×</button>
            `;

            item.querySelector('.list-name').addEventListener('click', () => {
                this.elements.wordInput.value = list.content;
            });

            item.querySelector('.delete-list').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteList(key);
            });

            container.appendChild(item);
        });
    }

    deleteList(key) {
        const savedLists = JSON.parse(localStorage.getItem('readingGameLists') || '{}');
        delete savedLists[key];
        localStorage.setItem('readingGameLists', JSON.stringify(savedLists));
        this.loadSavedLists();
    }

    // ==================== Event Binding ====================

    bindEvents() {
        // Start game
        this.elements.startBtn.addEventListener('click', () => this.startGame());

        // Skip word
        this.elements.skipBtn.addEventListener('click', () => this.skipWord());

        // Home button
        this.elements.homeBtn.addEventListener('click', () => this.goHome());

        // Sound toggle
        this.elements.soundToggle.addEventListener('change', () => {
            this.soundEnabled = this.elements.soundToggle.checked;
            localStorage.setItem('soundEnabled', this.soundEnabled.toString());
            this.updateGameSoundToggle();
        });

        this.elements.gameSoundToggle.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            this.elements.soundToggle.checked = this.soundEnabled;
            localStorage.setItem('soundEnabled', this.soundEnabled.toString());
            this.updateGameSoundToggle();
        });

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setDifficulty(btn.dataset.difficulty);
            });
        });

        // Pre-made lists
        document.querySelectorAll('.premade-list-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const listId = btn.dataset.list;
                const list = this.premadeLists[listId];
                if (list) {
                    this.elements.wordInput.value = list.words.join('\n');
                }
            });
        });

        // Puzzle image upload
        this.elements.uploadPuzzleBtn.addEventListener('click', () => {
            this.elements.puzzleImageInput.click();
        });

        this.elements.puzzleImageInput.addEventListener('change', (e) => {
            this.handlePuzzleImageUpload(e);
        });

        // Play again
        this.elements.playAgainBtn.addEventListener('click', () => {
            this.shuffleArray(this.words);
            this.currentIndex = 0;
            this.score = 0;
            this.skipped = 0;
            this.missedWords = [];
            this.currentStreak = 0;
            this.bestStreak = 0;
            this.wrongInARow = 0;
            this.revealedPieces = 0;
            this.isGameActive = true;
            this.updateScore();
            this.updateStreakDisplay();
            this.elements.total.textContent = this.words.length;
            this.resetPuzzle();
            this.showScreen('game');
            this.showBuddyMessage('start');
            this.showCurrentWord();
            this.startListening();
        });

        // Practice missed words
        this.elements.practiceMissedBtn.addEventListener('click', () => {
            if (this.missedWords.length > 0) {
                this.startGame(this.missedWords);
            }
        });

        // New words
        this.elements.newWordsBtn.addEventListener('click', () => {
            this.showScreen('setup');
        });

        // Dashboard
        this.elements.dashboardBtn.addEventListener('click', () => {
            this.showScreen('dashboard');
        });

        this.elements.dashboardBackBtn.addEventListener('click', () => {
            this.showScreen('setup');
        });

        this.elements.clearHistoryBtn.addEventListener('click', () => {
            this.clearHistory();
        });

        // Enter key in textarea starts game
        this.elements.wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.startGame();
            }
        });
    }

    updateGameSoundToggle() {
        this.elements.gameSoundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    // ==================== Home Button ====================

    goHome() {
        this.isGameActive = false;
        this.stopListening();
        clearInterval(this.timerInterval);
        this.showScreen('setup');
    }

    // ==================== Puzzle System ====================

    handlePuzzleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.elements.puzzleFilename.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.puzzleImage = e.target.result;
            this.elements.puzzlePreview.innerHTML = `<img src="${this.puzzleImage}" alt="Puzzle preview">`;
        };
        reader.readAsDataURL(file);
    }

    initPuzzle() {
        if (!this.puzzleImage) {
            this.elements.puzzleContainer.classList.remove('active');
            return;
        }

        this.elements.puzzleContainer.classList.add('active');
        this.elements.puzzleGrid.innerHTML = '';
        this.puzzlePieces = [];
        this.revealedPieces = 0;

        const totalPieces = this.words.length;
        const gridSize = Math.ceil(Math.sqrt(totalPieces));

        this.elements.puzzleGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        this.elements.puzzleGrid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

        for (let i = 0; i < gridSize * gridSize; i++) {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';

            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const bgPosX = (col / (gridSize - 1)) * 100;
            const bgPosY = (row / (gridSize - 1)) * 100;

            piece.style.backgroundImage = `url(${this.puzzleImage})`;
            piece.style.backgroundSize = `${gridSize * 100}%`;
            piece.style.backgroundPosition = `${bgPosX}% ${bgPosY}%`;

            this.elements.puzzleGrid.appendChild(piece);
            this.puzzlePieces.push(piece);
        }
    }

    revealPuzzlePiece() {
        if (!this.puzzleImage || this.revealedPieces >= this.puzzlePieces.length) return;

        const piece = this.puzzlePieces[this.revealedPieces];
        if (piece) {
            piece.classList.add('revealed');
            this.revealedPieces++;
        }
    }

    resetPuzzle() {
        this.puzzlePieces.forEach(piece => {
            piece.classList.remove('revealed');
        });
        this.revealedPieces = 0;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ReadingGame();
});
