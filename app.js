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
        this.isProcessingAnswer = false; // Prevent double-triggering

        // Speech recognition
        this.recognition = null;
        this.isListening = false;
        this.recognitionRestarting = false;
        this.resultStartIndex = 0; // Track where to start reading results for current word
        this.currentResultLength = 0; // Track total results received

        // Puzzle state
        this.puzzleImage = null;
        this.puzzlePieces = [];
        this.revealedPieces = 0;

        // Track missed words for review
        this.missedWords = [];

        // Audio context for sounds
        this.audioContext = null;

        // DOM Elements
        this.elements = {
            // Screens
            setupScreen: document.getElementById('setup-screen'),
            gameScreen: document.getElementById('game-screen'),
            resultsScreen: document.getElementById('results-screen'),

            // Setup screen elements
            wordInput: document.getElementById('word-input'),
            timerSetting: document.getElementById('timer-setting'),
            savedLists: document.getElementById('saved-lists'),
            startBtn: document.getElementById('start-btn'),
            puzzleImageInput: document.getElementById('puzzle-image-input'),
            uploadPuzzleBtn: document.getElementById('upload-puzzle-btn'),
            puzzleFilename: document.getElementById('puzzle-filename'),
            puzzlePreview: document.getElementById('puzzle-preview'),

            // Game screen elements
            homeBtn: document.getElementById('home-btn'),
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

            // Results screen elements
            finalScore: document.getElementById('final-score'),
            finalTotal: document.getElementById('final-total'),
            scoreMessage: document.getElementById('score-message'),
            correctCount: document.getElementById('correct-count'),
            skippedCount: document.getElementById('skipped-count'),
            playAgainBtn: document.getElementById('play-again-btn'),
            newWordsBtn: document.getElementById('new-words-btn'),

            // Review section on results
            missedWordsList: document.getElementById('missed-words-list'),
            missedWordsSection: document.getElementById('missed-words-section'),

            // Other
            confettiContainer: document.getElementById('confetti-container')
        };

        this.init();
    }

    init() {
        this.initSpeechRecognition();
        this.initAudio();
        this.loadSavedLists();
        this.bindEvents();
        this.requestMicrophonePermission();
    }

    async requestMicrophonePermission() {
        // Request microphone permission with settings optimized for child's voice
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true, // Helps with quieter voices
                    channelCount: 1,
                    sampleRate: 48000, // Higher sample rate for better clarity
                }
            });
            // Permission granted - stop the stream since we don't need it yet
            stream.getTracks().forEach(track => track.stop());
            console.log('Microphone permission granted');
        } catch (err) {
            console.log('Microphone permission denied or error:', err);
        }
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
            // Track current result length for next word
            this.currentResultLength = event.results.length;

            if (!this.isGameActive) return;

            // Only look at NEW results since we started listening for this word
            // Use resultStartIndex to ignore old results from previous words
            let currentTranscript = '';

            for (let i = this.resultStartIndex; i < event.results.length; i++) {
                const result = event.results[i];
                currentTranscript += result[0].transcript + ' ';
            }

            currentTranscript = currentTranscript.trim();

            // Update display and check answer with ONLY current word's transcript
            if (currentTranscript) {
                this.elements.heardText.textContent = `I heard: "${currentTranscript}"`;
                this.checkAnswer(currentTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.log('Speech recognition error:', event.error);

            // Don't restart on abort - that's intentional
            if (event.error === 'aborted') {
                return;
            }

            // For no-speech or audio-capture errors, schedule a restart
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                this.elements.micStatus.textContent = 'No speech detected, still listening...';
                // The onend handler will restart it
            }

            // For not-allowed error, show helpful message
            if (event.error === 'not-allowed') {
                this.elements.micStatus.textContent = 'Microphone blocked - check browser permissions';
                this.elements.heardText.textContent = 'Please allow microphone access and refresh the page';
            }
        };

        this.recognition.onend = () => {
            console.log('Speech recognition ended, isGameActive:', this.isGameActive, 'isListening:', this.isListening);
            this.isListening = false;

            // Only restart if game is active and we're not already restarting
            if (this.isGameActive && !this.recognitionRestarting) {
                this.recognitionRestarting = true;
                // Small delay to prevent rapid restart loops
                setTimeout(() => {
                    if (this.isGameActive) {
                        this.startListening();
                    }
                }, 100);
            }
        };
    }

    startListening() {
        if (!this.recognition) {
            console.log('No recognition available');
            return;
        }

        // Don't start if already listening
        if (this.isListening) {
            console.log('Already listening, skipping start');
            return;
        }

        try {
            console.log('Starting speech recognition...');
            this.recognition.start();
            // isListening will be set in onstart handler
        } catch (e) {
            console.log('Start error:', e.message);
            // If already started, that's fine
            if (e.message.includes('already started')) {
                this.isListening = true;
            }
        }
    }

    stopListening() {
        if (!this.recognition) return;

        console.log('Stopping speech recognition...');
        this.recognitionRestarting = false; // Prevent auto-restart

        try {
            this.recognition.abort(); // Use abort instead of stop for cleaner shutdown
        } catch (e) {
            console.log('Stop error:', e.message);
        }

        this.isListening = false;
        this.elements.micIndicator.classList.add('inactive');
        this.elements.micStatus.textContent = 'Microphone off';
    }

    // Reset tracking for a new word WITHOUT restarting recognition
    resetForNewWord() {
        // Set the start index to current length, so we ignore all previous results
        this.resultStartIndex = this.currentResultLength;
        console.log('Reset for new word, starting from index:', this.resultStartIndex);
    }

    // ==================== Audio (Sound Effects) ====================

    initAudio() {
        // Create audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }

    playSound(type) {
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
        }
    }

    playSuccessSound(ctx, now) {
        // Cheerful ascending arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
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

    playTryAgainSound(ctx, now) {
        // Gentle low tone
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
        // Quick beep for countdown
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
        // Celebration fanfare
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

    startGame() {
        const input = this.elements.wordInput.value.trim();
        if (!input) {
            alert('Please enter some words or sentences to practice!');
            return;
        }

        // Parse words (split by newlines, filter empty)
        this.words = input.split('\n')
            .map(w => w.trim())
            .filter(w => w.length > 0);

        if (this.words.length === 0) {
            alert('Please enter some words or sentences to practice!');
            return;
        }

        // Randomize the word order
        this.shuffleArray(this.words);

        // Save the word list
        this.saveCurrentList();

        // Get timer setting
        this.timerDuration = parseInt(this.elements.timerSetting.value);

        // Reset game state
        this.currentIndex = 0;
        this.score = 0;
        this.skipped = 0;
        this.missedWords = [];
        this.isGameActive = true;

        // Update UI
        this.elements.total.textContent = this.words.length;
        this.elements.totalWords.textContent = this.words.length;
        this.updateScore();

        // Initialize puzzle if image is uploaded
        this.initPuzzle();

        // Switch to game screen
        this.showScreen('game');

        // Start the game
        this.showCurrentWord();
        this.startListening();
    }

    showCurrentWord() {
        if (this.currentIndex >= this.words.length) {
            this.endGame();
            return;
        }

        // Reset the processing lock for the new word
        this.isProcessingAnswer = false;

        // Reset tracking to ignore previous word's transcript (without restarting recognition)
        this.resetForNewWord();

        // Update word display
        const word = this.words[this.currentIndex];
        this.elements.currentWord.textContent = word;
        this.elements.currentNum.textContent = this.currentIndex + 1;

        // Clear feedback, heard text, and word progress
        this.elements.feedback.textContent = '';
        this.elements.feedback.className = 'feedback';
        this.elements.heardText.textContent = '';
        this.elements.wordProgress.innerHTML = '';
        this.elements.wordDisplay.classList.remove('success', 'error');

        // Start timer
        this.startTimer();
    }

    startTimer() {
        this.timeRemaining = this.timerDuration;
        this.updateTimerDisplay();

        // Clear any existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            // Play tick sound in last 3 seconds
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

        // Update ring progress
        const circumference = 283; // 2 * PI * 45
        const progress = (this.timeRemaining / this.timerDuration) * circumference;
        this.elements.timerRingProgress.style.strokeDashoffset = circumference - progress;

        // Update color based on time remaining
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

        // Track missed word
        this.missedWords.push(this.words[this.currentIndex]);

        // Show timeout feedback
        this.elements.feedback.textContent = "Time's up! Let's try the next one.";
        this.elements.feedback.className = 'feedback try-again';
        this.playSound('tryAgain');

        this.skipped++;

        // Move to next word after a short delay
        setTimeout(() => {
            this.currentIndex++;
            this.showCurrentWord();
        }, 1500);
    }

    checkAnswer(spokenText) {
        // Prevent double-triggering while processing an answer
        if (this.isProcessingAnswer) {
            return;
        }

        const target = this.words[this.currentIndex].toLowerCase().trim();
        const spoken = spokenText.toLowerCase().trim();

        // Update word progress display for sentences
        this.updateWordProgress(spoken, target);

        // Fuzzy matching - check if the target phrase is contained in what was spoken
        // Also check for similar words (allowing for minor pronunciation differences)
        if (this.isMatch(spoken, target)) {
            this.isProcessingAnswer = true; // Lock to prevent double-trigger
            this.handleCorrectAnswer();
        }
    }

    // Show which words have been matched so far (for sentences)
    updateWordProgress(spoken, target) {
        const targetWords = this.normalizeText(target).split(' ');
        const spokenWords = this.normalizeText(spoken).split(' ');

        // Only show progress for sentences (multiple words)
        if (targetWords.length <= 1) {
            this.elements.wordProgress.innerHTML = '';
            return;
        }

        // Find how many words have been matched
        let matchedCount = 0;
        for (const spokenWord of spokenWords) {
            if (matchedCount < targetWords.length && this.wordsSimilar(spokenWord, targetWords[matchedCount])) {
                matchedCount++;
            }
        }

        // Build progress display
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

    // Fisher-Yates shuffle algorithm
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    isMatch(spoken, target) {
        // Normalize both strings
        const normalizedSpoken = this.normalizeText(spoken);
        const normalizedTarget = this.normalizeText(target);

        const targetWords = normalizedTarget.split(' ');
        const spokenWords = normalizedSpoken.split(' ');
        const isSentence = targetWords.length > 1;

        // For sentences: require ALL words to be spoken (with fuzzy matching per word)
        if (isSentence) {
            // Must have spoken at least as many words as the target
            if (spokenWords.length < targetWords.length) {
                return false;
            }

            // Check if all target words appear in spoken words (in order)
            let targetIndex = 0;
            for (const spokenWord of spokenWords) {
                if (targetIndex < targetWords.length && this.wordsSimilar(spokenWord, targetWords[targetIndex])) {
                    targetIndex++;
                }
            }

            // All words must match for sentences
            return targetIndex === targetWords.length;
        }

        // For single words: be lenient with pronunciation
        // Direct match
        if (normalizedSpoken.includes(normalizedTarget)) {
            return true;
        }

        // Check each spoken word for a match
        for (const spokenWord of spokenWords) {
            // Relaxed Levenshtein - allow up to 40% of characters to be different
            const maxDistance = Math.max(1, Math.ceil(normalizedTarget.length * 0.4));
            if (this.levenshteinDistance(spokenWord, normalizedTarget) <= maxDistance) {
                return true;
            }

            // Check phonetic similarity - common kid pronunciation variations
            if (this.phoneticallyClose(spokenWord, normalizedTarget)) {
                return true;
            }
        }

        return false;
    }

    // Check for common phonetic variations kids make
    phoneticallyClose(spoken, target) {
        // Common substitutions kids make
        const substitutions = [
            ['th', 'd'],   // "the" -> "de"
            ['th', 'f'],   // "three" -> "free"
            ['r', 'w'],    // "red" -> "wed"
            ['l', 'w'],    // "little" -> "wittle"
            ['s', 'th'],   // lisp
            ['ch', 'sh'],
            ['j', 'ch'],
            ['v', 'b'],
            ['ing', 'in'], // "running" -> "runnin"
        ];

        let modifiedTarget = target;
        let modifiedSpoken = spoken;

        // Try each substitution both ways
        for (const [a, b] of substitutions) {
            const targetWithSub = target.replace(new RegExp(a, 'g'), b);
            const spokenWithSub = spoken.replace(new RegExp(b, 'g'), a);

            if (spoken === targetWithSub || spokenWithSub === target) {
                return true;
            }

            // Also check with Levenshtein after substitution
            if (this.levenshteinDistance(spoken, targetWithSub) <= 1) {
                return true;
            }
        }

        // Check if spoken word sounds similar (same consonant structure)
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
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\s+/g, ' ')    // Normalize spaces
            .trim();
    }

    wordsSimilar(word1, word2) {
        if (word1 === word2) return true;

        // Very relaxed for young children - allow up to 40% difference
        const maxDistance = Math.max(2, Math.ceil(Math.min(word1.length, word2.length) * 0.4));
        if (this.levenshteinDistance(word1, word2) <= maxDistance) {
            return true;
        }

        // Also check phonetic similarity
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
        // Stop timer
        clearInterval(this.timerInterval);

        // Highlight the word
        this.elements.currentWord.classList.add('highlighted');

        // Update score with animation
        this.score++;
        this.updateScoreWithAnimation();

        // Show success feedback
        this.elements.feedback.textContent = '🎉 Awesome! Great job!';
        this.elements.feedback.className = 'feedback success';
        this.elements.wordDisplay.classList.add('success');

        // Play success sound
        this.playSound('success');

        // Create star burst animation
        this.createStarBurst();

        // Reveal a puzzle piece
        this.revealPuzzlePiece();

        // Move to next word after animation
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
        // Update the score
        this.elements.score.textContent = this.score;

        // Add bump animation to score
        this.elements.score.classList.add('bump');
        setTimeout(() => {
            this.elements.score.classList.remove('bump');
        }, 400);

        // Show +1 popup
        this.elements.scorePopup.classList.remove('show');
        // Force reflow to restart animation
        void this.elements.scorePopup.offsetWidth;
        this.elements.scorePopup.classList.add('show');
    }

    skipWord() {
        clearInterval(this.timerInterval);
        this.missedWords.push(this.words[this.currentIndex]);
        this.skipped++;

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

        // Update results
        this.elements.finalScore.textContent = this.score;
        this.elements.finalTotal.textContent = this.words.length;
        this.elements.correctCount.textContent = this.score;
        this.elements.skippedCount.textContent = this.skipped;

        // Set score message based on performance
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

        // Show missed words for review
        if (this.missedWords.length > 0) {
            this.elements.missedWordsSection.style.display = 'block';
            this.elements.missedWordsList.innerHTML = this.missedWords
                .map(word => `<li>${word}</li>`)
                .join('');
        } else {
            this.elements.missedWordsSection.style.display = 'none';
        }

        // Play completion sound
        this.playSound('gameComplete');

        // Show results screen
        this.showScreen('results');

        // Create confetti for good scores
        if (percentage >= 60) {
            this.createConfetti();
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

            // Random shapes
            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            }

            container.appendChild(confetti);
        }

        // Clean up after animation
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

    // ==================== Screen Management ====================

    showScreen(screenName) {
        // Hide all screens
        this.elements.setupScreen.classList.remove('active');
        this.elements.gameScreen.classList.remove('active');
        this.elements.resultsScreen.classList.remove('active');

        // Show requested screen
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
        }
    }

    // ==================== Storage ====================

    saveCurrentList() {
        const input = this.elements.wordInput.value.trim();
        if (!input) return;

        // Create a simple name based on first word and count
        const words = input.split('\n').filter(w => w.trim());
        const listName = words[0].substring(0, 15) + (words.length > 1 ? ` (+${words.length - 1})` : '');

        // Get existing lists
        const savedLists = JSON.parse(localStorage.getItem('readingGameLists') || '{}');

        // Save with timestamp as key
        const key = Date.now().toString();
        savedLists[key] = {
            name: listName,
            content: input,
            date: new Date().toLocaleDateString()
        };

        // Keep only last 10 lists
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

            // Load on click
            item.querySelector('.list-name').addEventListener('click', () => {
                this.elements.wordInput.value = list.content;
            });

            // Delete on button click
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

        // Puzzle image upload
        this.elements.uploadPuzzleBtn.addEventListener('click', () => {
            this.elements.puzzleImageInput.click();
        });

        this.elements.puzzleImageInput.addEventListener('change', (e) => {
            this.handlePuzzleImageUpload(e);
        });

        // Play again
        this.elements.playAgainBtn.addEventListener('click', () => {
            this.showScreen('game');
            this.currentIndex = 0;
            this.score = 0;
            this.skipped = 0;
            this.missedWords = [];
            this.revealedPieces = 0;
            this.isGameActive = true;
            this.updateScore();
            this.elements.total.textContent = this.words.length;
            this.resetPuzzle();
            this.showCurrentWord();
            this.startListening();
        });

        // New words
        this.elements.newWordsBtn.addEventListener('click', () => {
            this.showScreen('setup');
        });

        // Enter key in textarea starts game
        this.elements.wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.startGame();
            }
        });
    }

    // ==================== Home Button ====================

    goHome() {
        // Stop the game
        this.isGameActive = false;
        this.stopListening();
        clearInterval(this.timerInterval);

        // Go back to setup screen
        this.showScreen('setup');
    }

    // ==================== Puzzle System ====================

    handlePuzzleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Update filename display
        this.elements.puzzleFilename.textContent = file.name;

        // Read and preview the image
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

        // Calculate grid size based on number of words
        const totalPieces = this.words.length;
        const gridSize = Math.ceil(Math.sqrt(totalPieces));

        this.elements.puzzleGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        this.elements.puzzleGrid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

        // Create puzzle pieces
        for (let i = 0; i < gridSize * gridSize; i++) {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';

            // Calculate background position for this piece
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

        // Find the next unrevealed piece
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
