import { Component, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Question {
  id: number;
  text: string;
  emoji: string;
  options: string[];
  correctIndex: number;
  correctResponse: string;
  wrongResponse: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  @ViewChild('correctSound') correctSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('wrongSound') wrongSound!: ElementRef<HTMLAudioElement>;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  
  currentStep = signal(0); // 0 = intro, 1-10 = questions, 11 = valentine question, 12 = celebration, 13 = love letter, 14 = certificate, 15 = ring
  selectedAnswers = signal<string[]>([]);
  isTransitioning = signal(false);
  
  // Music
  isMusicPlaying = signal(false);
  volume = signal(50);
  
  // Presents
  openedPresent = signal<number | null>(null);
  
  // Feedback states
  showFeedback = signal(false);
  isCorrect = signal(false);
  feedbackMessage = signal('');
  shakeScreen = signal(false);
  
  // No button dodge mechanics
  noButtonScale = signal(1);
  noButtonPosition = signal({ x: 0, y: 0 });
  yesButtonScale = signal(1);
  noAttempts = signal(0);
  noButtonText = signal('No ❌');
  
  noButtonTexts = [
    'No ❌',
    'Are you sure? 🥺',
    'Really?? 😢',
    'Think again! 💭',
    'Last chance... 😿',
    'Please? 🥹',
    'Don\'t do this! 💔',
    'I\'ll be sad... 😭',
    'Nooo! 😫',
    'Fine, try... 🙈',
    '...',
    '💀',
    'No ❌',
    'Are you sure? 🥺',
    'Really?? 😢',
    'Think again! 💭',
    'Last chance... 😿',
    'Please? 🥹',
    'Don\'t do this! 💔',
    'I\'ll be sad... 😭',
    'Nooo! 😫',
    'Fine, try... 🙈',
    '...',
    '💀'
  ];
  
  // Celebration
  showCelebration = signal(false);
  hearts = signal<{ id: number; left: number; delay: number; duration: number }[]>([]);
  
  // Certificate
  hasSigned = signal(false);
  showStamp = signal(false);

  // Preloaded sound effects for instant playback
  private correctAudio: HTMLAudioElement | null = null;
  private wrongAudio: HTMLAudioElement | null = null;

  ngAfterViewInit() {
    // Preload sound effects for instant playback
    this.preloadSounds();
  }

  preloadSounds() {
    // Create and preload correct sound
    this.correctAudio = new Audio('/correct.mp3');
    this.correctAudio.volume = 0.3;
    this.correctAudio.load();
    
    // Create and preload wrong sound
    this.wrongAudio = new Audio('/wrong.mp3');
    this.wrongAudio.volume = 0.3;
    this.wrongAudio.load();
  }

  initCanvas() {
    setTimeout(() => {
      if (this.signatureCanvas) {
        const canvas = this.signatureCanvas.nativeElement;
        this.ctx = canvas.getContext('2d')!;
        this.ctx.strokeStyle = '#1a237e';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
      }
    }, 100);
  }

  toggleMusic() {
    if (this.audioPlayer) {
      const audio = this.audioPlayer.nativeElement;
      if (this.isMusicPlaying()) {
        audio.pause();
        this.isMusicPlaying.set(false);
      } else {
        audio.loop = true; // Ensure looping is enabled
        audio.volume = this.volume() / 100;
        audio.play().catch(e => console.log('Audio play failed:', e));
        this.isMusicPlaying.set(true);
      }
    }
  }

  setVolume(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value);
    this.volume.set(value);
    if (this.audioPlayer) {
      this.audioPlayer.nativeElement.volume = value / 100;
    }
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    this.isDrawing = true;
    const pos = this.getPosition(event);
    this.lastX = pos.x;
    this.lastY = pos.y;
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing) return;
    event.preventDefault();
    
    const pos = this.getPosition(event);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    
    this.lastX = pos.x;
    this.lastY = pos.y;
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  getPosition(event: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = this.signatureCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    if (event instanceof MouseEvent) {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    } else {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    }
  }

  clearSignature() {
    const canvas = this.signatureCanvas.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSigned.set(false);
    this.showStamp.set(false);
  }

  submitSignature() {
    const canvas = this.signatureCanvas.nativeElement;
    const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some((value, index) => index % 4 === 3 && value > 0);
    
    if (hasContent) {
      this.hasSigned.set(true);
      setTimeout(() => {
        this.showStamp.set(true);
      }, 300);
    }
  }

  goToRingPage() {
    this.currentStep.set(15);
  }

  questions: Question[] = [
    {
      id: 1,
      text: "Chkoun 3mal the first move ?",
      emoji: "💕",
      options: ["Kenza", "Zouz", "Makrem" , "7ad"],
      correctIndex: 0,
      correctResponse: "Shyh ama kont bako waqtha 💕",
      wrongResponse: "Ghalet nty aamlt first move 🤔"
    },
    {
      id: 2,
      text: "Chnya esmha el ghneya eli kona nhotouha zouz f note taa insta ?",
      emoji: "🎵",
      options: ["Yrouli - Hichem Sallem", "Ghneyet kawkeb zomoroda", "TNEKET SOUSA", "Maes - Guardia"],
      correctIndex: 3,
      correctResponse: "Wlhy jebetha shyha asmaa asidek",
      wrongResponse: "Chbik kizebi nsit"
    },
    {
      id: 3,
      text: "Chkoun 9al nhbk awel wehed ?",
      emoji: "💗",
      options: ["Kenza", "Makrem", "Qolneha fard waqt", "Had ma 9alha"],
      correctIndex: 0,
      correctResponse: "Yehrez kont khayef m zal3a",
      wrongResponse: "Nsyt aasba mak qoltha nty"
    },
    {
      id: 4,
      text: "Chnya lo3ba eli nelaabouha f lil ?",
      emoji: "🌙",
      options: ["lo3bet tatyib", "gta sahby", "fifa", "sims"],
      correctIndex: 0,
      correctResponse: "sahyt ena nebda ntyb wenty tsarbi f clienet",
      wrongResponse: "aasba nelaabou lo3bet tabkh naik"
    },
    {
      id: 5,
      text: "Chnya our dream destination ?",
      emoji: "✈️",
      options: ["La France a khouya", "zok 3babech", "palestine n7arbo", "Japon"],
      correctIndex: 3,
      correctResponse: "Sahyt ama mademni maak mayhmnich f blasa",
      wrongResponse: "Zebi naik Japon asba ala rassek"
    },
    {
      id: 6,
      text: "Chnya esm our secret spot ?",
      emoji: "😍",
      options: ["Dhaabout el gerda", "Hay Mile7aa", "Jendouba", "Momo"],
      correctIndex: 3,
      correctResponse: "OUI OUI MOMO W UNO",
      wrongResponse: "Le aad aasba lenaa nodkhlo f tab3a"
    },
    {
      id: 7,
      text: "Eneho awel vlog gadineh maa baadhna ?",
      emoji: "🍕",
      options: ["klina chips", "mchyna l yoyo", "pizzaaaa", "lablebi date"],
      correctIndex: 0,
      correctResponse: "Sahyt waqtha khdhineh mn monoprix",
      wrongResponse: "Asba aarftk bch tensa"
    },
    {
      id: 8,
      text: "Eneho our anniversary date ?",
      emoji: "💝",
      options: ["1 Mars", "19 Janvier", "21 Octobre", "2 Mars"],
      correctIndex: 3,
      correctResponse: "Sahyyt par contre souel piege",
      wrongResponse: "Ryt aasba ki njarabkom w toht fel fakh"
    },
    {
      id: 9,
      text: "Chnya el haja eli nqolk dima sendiha?",
      emoji: "😂",
      options: ["Boobs", "Ass", "Dick", "Face"],
      correctIndex: 3,
      correctResponse: "Sahyyt khalik halal mode",
      wrongResponse: "Ryt ki aamtlk khotet el 9et wal fa2r"
    },
    {
      id: 10,
      text: "Whats the first gift i gave u ki walina together ?",
      emoji: "💑",
      options: ["Charka", "Khatem", "Boucles", "Bracelet"],
      correctIndex: 0,
      correctResponse: "Sahyt deja waqtha f lac 0",
      wrongResponse: "Fisaa mansyt aasba"
    }
  ];

  currentQuestion = computed(() => {
    const step = this.currentStep();
    if (step >= 1 && step <= 10) {
      return this.questions[step - 1];
    }
    return null;
  });

  progress = computed(() => {
    const step = this.currentStep();
    if (step >= 1 && step <= 10) {
      return (step / 10) * 100;
    }
    return 100;
  });

  startQuiz() {
    this.isTransitioning.set(true);
    setTimeout(() => {
      this.currentStep.set(1);
      this.isTransitioning.set(false);
    }, 500);
  }

  playCorrectSound() {
    if (this.correctAudio) {
      this.correctAudio.currentTime = 0;
      this.correctAudio.play().catch(e => console.log('Sound play failed:', e));
    }
  }

  playWrongSound() {
    if (this.wrongAudio) {
      this.wrongAudio.currentTime = 0;
      this.wrongAudio.play().catch(e => console.log('Sound play failed:', e));
    }
  }

  selectAnswer(answer: string, index: number) {
    const question = this.currentQuestion();
    if (!question || this.showFeedback()) return;
    
    const answers = [...this.selectedAnswers()];
    answers[this.currentStep() - 1] = answer;
    this.selectedAnswers.set(answers);
    
    const correct = index === question.correctIndex;
    this.isCorrect.set(correct);
    this.feedbackMessage.set(correct ? question.correctResponse : question.wrongResponse);
    this.showFeedback.set(true);
    
    // Play sound effects
    if (correct) {
      this.playCorrectSound();
    } else {
      this.playWrongSound();
      this.shakeScreen.set(true);
      setTimeout(() => this.shakeScreen.set(false), 500);
    }
  }

  retryQuestion() {
    this.showFeedback.set(false);
    this.isCorrect.set(false);
    this.feedbackMessage.set('');
  }

  goToNextQuestion() {
    this.showFeedback.set(false);
    const nextStep = this.currentStep() + 1;
    this.currentStep.set(nextStep);
  }

  onNoHover() {
    const attempts = this.noAttempts() + 1;
    this.noAttempts.set(attempts);
    
    // Change button text
    const textIndex = Math.min(attempts, this.noButtonTexts.length - 1);
    this.noButtonText.set(this.noButtonTexts[textIndex]);
    
    // Move no button to random position across the whole screen
    const maxX = window.innerWidth * 0.35;
    const maxY = window.innerHeight * 0.35;
    const randomX = (Math.random() - 0.5) * maxX * 2;
    const randomY = (Math.random() - 0.5) * maxY * 2;
    this.noButtonPosition.set({ x: randomX, y: randomY });
    
    // Grow yes button
    const yesScale = Math.min(2, 1 + (attempts * 0.2));
    this.yesButtonScale.set(yesScale);
  }

  onYesClick() {
    this.showCelebration.set(true);
    this.generateHearts();
    
    setTimeout(() => {
      this.currentStep.set(12);
    }, 500);
  }

  generateHearts() {
    const newHearts = [];
    for (let i = 0; i < 50; i++) {
      newHearts.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2
      });
    }
    this.hearts.set(newHearts);
  }

  goToLoveLetter() {
    this.currentStep.set(13);
  }

  goToCertificate() {
    this.currentStep.set(14);
    this.initCanvas();
  }

  private wasMusicPlaying = false;

  openPresent(num: number) {
    this.openedPresent.set(num);
    // Pause background music when video opens
    if (this.isMusicPlaying()) {
      this.wasMusicPlaying = true;
      this.audioPlayer.nativeElement.pause();
      this.isMusicPlaying.set(false);
    } else {
      this.wasMusicPlaying = false;
    }
  }

  closeVideo() {
    this.openedPresent.set(null);
    // Resume background music if it was playing before
    if (this.wasMusicPlaying) {
      this.audioPlayer.nativeElement.play();
      this.isMusicPlaying.set(true);
    }
  }
}



