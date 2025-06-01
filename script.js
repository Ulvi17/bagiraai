// Set current year in footer
document.addEventListener('DOMContentLoaded', function() {
  const currentYearElement = document.getElementById('currentYear');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
});

// VAPI Configuration
var vapiSDKLoaded = false;
var vapiVoiceInstance = null;
const apiKey = "58f89212-0e94-4123-8f9e-3bc0dde56fe0";
const vapiSquadId = "f468f8d5-b6bd-44fd-b39e-358278e86404";
var sdkVoiceButtonElement = null; // Reference to the SDK's voice button

// Load VAPI SDK script
(function (d, t) {
  var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
  g.src = "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
  g.defer = g.async = true;
  s.parentNode.insertBefore(g, s);

  g.onload = function () {
    console.log('VAPI SDK script has loaded.');
    vapiSDKLoaded = true;
    initializeVoiceVapiInstance();
  };
  g.onerror = function() {
    console.error('CRITICAL: Failed to load VAPI SDK script from CDN. Check internet connection.');
    updateVapiButton('Ошибка SDK', 'Нет связи', 'idle');
  };
})(document, "script");

function initializeVoiceVapiInstance() {
  if (!vapiSDKLoaded || !window.vapiSDK) {
    console.error('VAPI SDK not available on window. Voice instance cannot be initialized.');
    updateVapiButton('Ошибка SDK', 'Не загружен', 'idle');
    return;
  }

  try {
    console.log('Attempting to run VAPI Voice Instance...');
    vapiVoiceInstance = window.vapiSDK.run({
      apiKey: apiKey,
      squad: vapiSquadId,
      config: {
        position: "bottom-right", 
        idle: {
          color: "#7A3FFD", type: "pill",
          title: "Поговорить с Bagira AI", subtitle: "Голосовой юр. помощник",
          icon: "https://unpkg.com/lucide-static@0.321.0/icons/mic.svg"
        }
      }
    });
    console.log('VAPI Voice Instance run command issued. Waiting for instance to be fully ready for event listeners...');

    // The vapiVoiceInstance object might be returned before it's fully interactive for attaching .on listeners
    // or before it has internally processed the config to be ready for a call.
    // We will attempt to attach listeners with a small delay if direct attachment fails or seems problematic.

    const setupEventListeners = (instance) => {
        if (instance && typeof instance.on === 'function') {
            console.log('Attaching VAPI Voice Instance event listeners...');
            instance.on("message", handleVoiceInstanceMessage);
            instance.on('call-started', () => {
                console.log('>>> VAPI Event: call-started received! (Attempting to set active state)');
                // Check current button state to avoid overriding if already set by message handler
                const button = document.getElementById('customVapiButton');
                if (button && !button.classList.contains('vapi-button--active')) {
                    updateVapiButton('Завершить звонок', 'Нажмите чтобы повесить трубку', 'active');
                }
            });
            instance.on('call-ended', () => {
                console.log('>>> VAPI Event: call-ended received!');
                updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник', 'idle');
            });
            instance.on('error', (e) => {
                console.error('>>> VAPI Voice Instance Error Event:', e);
                updateVapiButton('Ошибка звонка', 'Попробуйте снова', 'idle');
            });
            console.log('VAPI Voice Instance event listeners successfully attached.');
            // Attempt to find and hide the SDK's button now that listeners are hopefully attached to a ready instance
            console.log("Scheduling search for SDK voice button in 1 second (after listener setup)...");
            setTimeout(findAndStoreVoiceSdkButton, 1000); 
        } else {
            console.warn('Voice instance is not available or .on method is not a function AT THE TIME OF LISTENER SETUP. Retrying listener setup shortly...');
            // Fallback: Retry attaching listeners after a short delay if instance wasn't ready.
            setTimeout(() => setupEventListeners(vapiVoiceInstance), 500); 
        }
    };

    // Initial attempt to set up listeners
    setupEventListeners(vapiVoiceInstance);

  } catch (error) {
    console.error('Failed to initialize VAPI Voice SDK (error during .run() or initial setup):', error);
    updateVapiButton('Ошибка Init', 'См. консоль', 'idle');
  }
}

function findAndStoreVoiceSdkButton() {
  console.log("Attempting to find and store SDK voice button (revised strategy)...");
  const sdkButtons = document.querySelectorAll('.vapi-btn');

  if (sdkButtons.length === 1) {
    sdkVoiceButtonElement = sdkButtons[0];
    console.log("Found a single .vapi-btn element, assuming it is the SDK Voice Button:", sdkVoiceButtonElement);
    // Hide it immediately after finding
    sdkVoiceButtonElement.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; position: absolute !important; left: -9999px !important; pointer-events: none !important; z-index: -1 !important;';
    console.log("SDK Voice Button has been hidden.");
  } else if (sdkButtons.length > 1) {
    console.warn(`Found ${sdkButtons.length} .vapi-btn elements. This is ambiguous. Attempting to find one with data-position="bottom-right" among them.`);
    const specificButton = Array.from(sdkButtons).find(btn => btn.dataset.position === "bottom-right");
    if (specificButton) {
        sdkVoiceButtonElement = specificButton;
        console.log("Found SDK Voice Button with data-position among multiple .vapi-btn elements:", sdkVoiceButtonElement);
        sdkVoiceButtonElement.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; position: absolute !important; left: -9999px !important; pointer-events: none !important; z-index: -1 !important;';
        console.log("Specific SDK Voice Button has been hidden.");
    } else {
        console.error("Could not identify the correct SDK voice button among multiple .vapi-btn elements. The custom button may not work.");
        updateVapiButton('Ошибка SDK', 'Неизв. кнопка', 'idle');
    }
  } else { // sdkButtons.length === 0
    console.error("SDK Voice Button NOT FOUND. No .vapi-btn elements detected in the DOM. The custom button will not work.");
    updateVapiButton('Ошибка SDK', 'Кнопка не найдена', 'idle');
  }
}

// Revised handleVoiceInstanceMessage
function handleVoiceInstanceMessage(message) {
  console.log('VAPI Voice Message received:', message);
  const button = document.getElementById('customVapiButton');
  const isConnecting = button && button.querySelector('.fa-spinner'); // Check if spinner icon is present

  // Transition to active state based on early call signals if currently "connecting"
  if (isConnecting) {
    if (message.type === 'status-update' && message.status === 'in-progress') {
      console.log('>>> Call In-Progress detected from status-update. Setting button to active.');
      updateVapiButton('Завершить звонок', 'Нажмите чтобы повесить трубку', 'active');
      return; // Return to prevent other logic if we've just set it to active
    }
    if ((message.type === 'speech-update' || message.type === 'transcript') && message.role === 'assistant') {
      // Only act on the *first* sign of assistant speech/transcript if connecting
      console.log('>>> Assistant activity detected while connecting. Setting button to active.');
      updateVapiButton('Завершить звонок', 'Нажмите чтобы повесить трубку', 'active');
      return; 
    }
  }

  // Existing logic for booking modal based on transcripts
  if (
    message.type === "transcript" &&
    message.role === "assistant" &&
    message.transcriptType === "final" &&
    message.transcript
  ) {
    const assistantUtterance = message.transcript.toLowerCase().trim();
    const triggerPhrases = ['phone', 'телефон', 'номер', 'контакт', 'email', 'почт', 'type your phone number'];
    
    if (triggerPhrases.some(phrase => assistantUtterance.includes(phrase))) {
      console.log(`Triggering booking modal from VAPI voice message: "${assistantUtterance}"`);
      showVapiBookingModal();
      const vapiBookingModalTitle = document.querySelector('#vapiBookingModal .modal__title');
      if(vapiBookingModalTitle) vapiBookingModalTitle.textContent = "Подтвердите запись на консультацию";
    }
  }
  // Handle function calls if your assistant uses them for booking
  if (message.type === 'function-call' || 
      (message.payload && message.payload.name && (message.payload.name.includes('запись') || message.payload.name.includes('booking')))) {
    console.log(`Triggering booking modal from voice function call:`, message.payload);
    showVapiBookingModal();
  }
}

const updateVapiButton = (title, subtitle, state = 'idle') => {
  const button = document.getElementById('customVapiButton');
  if (!button) return;

  const titleEl = button.querySelector('.vapi-button__title');
  const subtitleEl = button.querySelector('.vapi-button__subtitle');
  const iconEl = button.querySelector('.vapi-button__icon'); // Assuming icon is <i class="fas fa-microphone vapi-button__icon"></i>

  if (titleEl) {
    titleEl.textContent = title;
    titleEl.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
  }
  if (subtitleEl) {
    subtitleEl.textContent = subtitle;
    subtitleEl.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
  }

  // Manage states
  button.classList.remove('vapi-button--active', 'vapi-button--connecting'); // Remove all state classes first
  if (iconEl) iconEl.className = 'fas fa-microphone vapi-button__icon'; // Reset icon

  switch (state) {
    case 'connecting':
      // You could add a specific class for connecting if more style changes are needed
      // button.classList.add('vapi-button--connecting');
      if (iconEl) iconEl.className = 'fas fa-spinner fa-spin vapi-button__icon'; // Change to spinner icon
      console.log("Button state: Connecting");
      break;
    case 'active':
      button.classList.add('vapi-button--active');
      if (iconEl) iconEl.className = 'fas fa-phone-slash vapi-button__icon'; // Change to hang-up icon
      console.log("Button state: Active");
      break;
    case 'idle':
    default:
      // Default purple gradient, pulse animation, and mic icon are handled by base .vapi-button class
      console.log("Button state: Idle");
      break;
  }
};

const handleVapiCustomButtonClick = async () => {
  console.log('Custom VAPI Voice button clicked.');
  const button = document.getElementById('customVapiButton');

  if (!vapiSDKLoaded) {
    console.warn('VAPI SDK script not loaded yet.');
    updateVapiButton('SDK Загрузка...', 'Подождите', 'idle');
    return;
  }
  if (!vapiVoiceInstance) {
    console.error('VAPI Voice instance is not available (null). Cannot start/stop call.');
    updateVapiButton('Ошибка Инст.', 'Недоступен', 'idle');
    return;
  }

  // Check current state of the button
  const isActive = button && button.classList.contains('vapi-button--active');

  if (isActive) {
    // If call is active, this click is to hang up.
    // The SDK button click should trigger 'call-ended' which will reset to idle.
    console.log('Button is active, attempting to hang up.');
    if (sdkVoiceButtonElement) {
        sdkVoiceButtonElement.click(); // This should trigger VAPI to end the call
    } else {
        console.error('Stored SDK Voice button reference is MISSING. Cannot hang up programmatically via SDK button.');
        // If no SDK button, try to use instance.stop() if available (less common for script tag)
        if (typeof vapiVoiceInstance.stop === 'function') {
            console.log('Attempting vapiVoiceInstance.stop()');
            vapiVoiceInstance.stop();
        } else {
            updateVapiButton('Ошибка SDK', 'Не удалось завершить', 'active'); // Stay active but show error
        }
    }
  } else {
    // If call is not active (idle or was connecting and failed), this click is to start.
    console.log('Button is not active, attempting to start call.');
    updateVapiButton('Соединение...', 'Подключение к ассистенту', 'connecting');

    if (sdkVoiceButtonElement) {
        console.log('Attempting to click stored SDK Voice button to start call:', sdkVoiceButtonElement);
        sdkVoiceButtonElement.click(); 
    } else {
        console.error('Stored SDK Voice button reference is MISSING. Cannot start call programmatically via SDK button.');
        updateVapiButton('Ошибка SDK Кнопки', 'Не найдена', 'idle'); 
    }
  }
};

// DOMContentLoaded - Main setup
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Bagira AI UI interactions (Voice & Text)...');
  
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const customVoiceBtn = document.getElementById('customVapiButton');
  if (customVoiceBtn) {
    customVoiceBtn.addEventListener('click', handleVapiCustomButtonClick);
    console.log('Custom Voice button event listener attached');
    setTimeout(() => updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник'), 200);
  } else { console.error('Custom Voice Button (customVapiButton) not found!');}
  
  // Set up chat button listener and show it
  const customChatBtn = document.getElementById('customChatButton');
  if (customChatBtn) {
    // Show the chat button
    customChatBtn.style.display = 'block';
    // Add click event listener for text chat
    customChatBtn.addEventListener('click', handleVapiChatButtonClick);
    console.log('Custom Chat Button shown and event listener attached');
  } else {
    console.error('Custom Chat Button (customChatButton) not found!');
  }
  
  setupModalEvents(); 
  const demoForm = document.getElementById('demoForm');
  if (demoForm) demoForm.addEventListener('submit', handleDemoForm);
  const vapiBookingForm = document.getElementById('vapiBookingForm');
  if (vapiBookingForm) vapiBookingForm.addEventListener('submit', handleVapiBookingForm);

  const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
  smoothScrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  
  console.log('Bagira AI UI initialization complete (Voice & Text).');
});

// Utility functions (ensure these are complete and correct)
const setupModalEvents = () => {
    const demoButtons = ['navDemoBtn', 'heroMainCTA', 'finalCTA'];
    demoButtons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => openModal('demoModal'));
    });
    const closeDemoBtn = document.getElementById('closeDemoModal');
    if (closeDemoBtn) closeDemoBtn.addEventListener('click', () => closeModal('demoModal'));
    const closeVapiBtn = document.getElementById('closeVapiModal');
    if (closeVapiBtn) closeVapiBtn.addEventListener('click', () => closeModal('vapiBookingModal'));
    document.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeModal(e.target.id); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal('demoModal'); closeModal('vapiBookingModal'); } });
    console.log("Modal event listeners set up.");
};
const openModal = (modalId) => { 
    const modal = document.getElementById(modalId); 
    if (modal) { 
        modal.classList.add('active'); 
        document.body.style.overflow = 'hidden'; 
        console.log(`Modal ${modalId} opened.`);
    } else { console.warn(`Modal with ID ${modalId} not found for opening.`); }
}; 
const closeModal = (modalId) => { 
    const modal = document.getElementById(modalId); 
    if (modal) { 
        modal.classList.remove('active'); 
        document.body.style.overflow = ''; 
        console.log(`Modal ${modalId} closed.`);
    } else { console.warn(`Modal with ID ${modalId} not found for closing.`); }
}; 
const showVapiBookingModal = () => { 
    console.log("Showing VAPI Booking Modal...");
    openModal('vapiBookingModal'); 
};
const handleDemoForm = (event) => { event.preventDefault(); console.log("Demo form submitted"); 
  const form = event.target; const messageEl = document.getElementById('demoMessage');
  messageEl.textContent = 'Отправляем заявку...'; messageEl.className = 'form__message'; messageEl.style.display = 'block';
  setTimeout(() => { messageEl.textContent = 'Спасибо! Мы свяжемся с вами в течение часа для демонстрации.'; messageEl.className = 'form__message success';
  setTimeout(() => { form.reset(); closeModal('demoModal'); messageEl.style.display = 'none';}, 3000);}, 1500);};
const handleVapiBookingForm = (event) => { event.preventDefault(); console.log("VAPI booking form submitted");
  const form = event.target; const phone = document.getElementById('vapiPhone').value; const email = document.getElementById('vapiEmail').value;
  const submitButton = form.querySelector('button[type="submit"]'); const originalButtonText = submitButton.textContent;
  if (!phone || !email) { alert('Пожалуйста, заполните все поля'); return; }
  submitButton.disabled = true; submitButton.textContent = 'Отправляем...';
  fetch("https://primary-production-3672.up.railway.app/webhook/bagira-submit", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, email })
  }).then(response => {
    alert(response.ok ? "Спасибо! Мы скоро направим информацию по указанному номеру телефона или почте" : "Ошибка отправки. ❌ Пожалуйста, попробуйте еще раз или свяжитесь с поддержкой.");
    closeModal('vapiBookingModal'); form.reset();
  }).catch(error => {
    console.error("Ошибка отправки формы Bagira AI:", error); alert("Что-то пошло не так. ❌\n" + (error.message || error)); closeModal('vapiBookingModal');
  }).finally(() => { submitButton.disabled = false; submitButton.textContent = originalButtonText; });}; 

// VAPI Text Button Functionality - Simplified Approach
// We'll use the same voice instance but trigger it differently for "text mode"

// Handle custom chat button click to start a text-like conversation
const handleVapiChatButtonClick = () => {
  console.log('Custom VAPI Chat button clicked - opening text chat interface.');
  openBagiraChat();
};

// VAPI Direct Chat API Implementation
const CHAT_API_KEY = 'cc358c78-cc72-4f79-871b-a6e5085990bc';
const CHAT_ASSISTANT_ID = '183660fe-2888-43c5-91c3-ef29e003035c';

// Generate a unique session ID for conversation context
// Store in localStorage to maintain context across page refreshes
let sessionId = localStorage.getItem('bagira_session_id');
if (!sessionId) {
  sessionId = 'bagira_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('bagira_session_id', sessionId);
}
console.log('Using sessionId for conversation context:', sessionId);

let lastChatId = null;
let isChatOpen = false;

// Create chat interface
function createChatInterface() {
  const chatInterface = document.createElement('div');
  chatInterface.id = 'bagira-chat-interface';
  chatInterface.innerHTML = `
    <div class="chat-container">
      <div class="chat-header">
        <h3>💬 Bagira AI - Текстовый чат</h3>
        <button class="chat-close" onclick="closeBagiraChat()">&times;</button>
      </div>
      <div class="chat-messages" id="chat-messages">
        <div class="chat-message bot-message">
          <div class="message-content">
            🤖 Здравствуйте! Я Bagira AI. Чем могу помочь вам сегодня?
          </div>
        </div>
      </div>
      <div class="chat-input-container">
        <input type="text" id="chat-input" placeholder="Введите ваш вопрос..." onkeypress="handleChatKeyPress(event)">
        <button onclick="sendChatMessage()" id="send-button">Отправить</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(chatInterface);
}

// Add chat styles
function addChatStyles() {
  const styles = `
    #bagira-chat-interface {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      display: none;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .chat-header {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      padding: 1rem;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .chat-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .chat-close {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }
    
    .chat-close:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .chat-message {
      display: flex;
      flex-direction: column;
    }
    
    .bot-message .message-content {
      background: #f1f5f9;
      color: #334155;
      padding: 0.75rem 1rem;
      border-radius: 18px 18px 18px 4px;
      max-width: 85%;
      align-self: flex-start;
    }
    
    .user-message .message-content {
      background: #22c55e;
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 18px 18px 4px 18px;
      max-width: 85%;
      align-self: flex-end;
    }
    
    .chat-input-container {
      display: flex;
      padding: 1rem;
      gap: 0.5rem;
      border-top: 1px solid #e2e8f0;
    }
    
    #chat-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      outline: none;
      font-size: 0.9rem;
    }
    
    #chat-input:focus {
      border-color: #22c55e;
    }
    
    #send-button {
      background: #22c55e;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    #send-button:hover {
      background: #16a34a;
    }
    
    #send-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    
    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #f1f5f9;
      border-radius: 18px 18px 18px 4px;
      max-width: 85%;
      align-self: flex-start;
    }
    
    .typing-dots {
      display: flex;
      gap: 2px;
    }
    
    .typing-dot {
      width: 4px;
      height: 4px;
      background: #64748b;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }
    
    .typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-10px);
      }
    }
    
    @media (max-width: 480px) {
      #bagira-chat-interface {
        bottom: 10px;
        right: 10px;
        left: 10px;
        width: auto;
        height: 70vh;
      }
    }
  `;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Open chat interface
function openBagiraChat() {
  if (!document.getElementById('bagira-chat-interface')) {
    addChatStyles();
    createChatInterface();
  }
  
  const chatInterface = document.getElementById('bagira-chat-interface');
  chatInterface.style.display = 'flex';
  isChatOpen = true;
  
  // Focus on input
  setTimeout(() => {
    const input = document.getElementById('chat-input');
    if (input) input.focus();
  }, 100);
}

// Close chat interface
function closeBagiraChat() {
  const chatInterface = document.getElementById('bagira-chat-interface');
  if (chatInterface) {
    chatInterface.style.display = 'none';
  }
  isChatOpen = false;
}

// Handle chat key press
function handleChatKeyPress(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
}

// Send chat message to VAPI
async function sendChatMessage(customMessage = null) {
  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const messagesContainer = document.getElementById('chat-messages');
  
  const message = customMessage || (input ? input.value.trim() : '');
  
  if (!message) return;
  
  console.log('Sending message with sessionId:', sessionId, 'lastChatId:', lastChatId);
  
  // Clear input and disable button
  if (input) input.value = '';
  if (sendButton) sendButton.disabled = true;
  
  // Add user message to chat
  const userMessage = document.createElement('div');
  userMessage.className = 'chat-message user-message';
  userMessage.innerHTML = `<div class="message-content">${message}</div>`;
  messagesContainer.appendChild(userMessage);
  
  // Add typing indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'chat-message bot-message';
  typingIndicator.innerHTML = `
    <div class="typing-indicator">
      🤖 Печатаю...
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  messagesContainer.appendChild(typingIndicator);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  try {
    const body = {
      assistantId: CHAT_ASSISTANT_ID,
      input: message,
      sessionId: sessionId  // Add sessionId to maintain conversation context
    };
    
    if (lastChatId) {
      body.previousChatId = lastChatId;
    }
    
    const response = await fetch('https://api.vapi.ai/chat', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CHAT_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    lastChatId = data.id;
    
    console.log('Received response with new chatId:', data.id, 'maintaining session:', sessionId);
    
    // Remove typing indicator
    typingIndicator.remove();
    
    // Add bot response
    const reply = data.output && data.output[0] ? data.output[0].content : '[Извините, не удалось получить ответ]';
    const botMessage = document.createElement('div');
    botMessage.className = 'chat-message bot-message';
    botMessage.innerHTML = `<div class="message-content">🤖 ${reply}</div>`;
    messagesContainer.appendChild(botMessage);
    
    // Check if response contains booking keywords
    const responseText = reply.toLowerCase();
    const triggerPhrases = ['phone', 'телефон', 'номер', 'контакт', 'email', 'почт', 'запись', 'консультация'];
    
    if (triggerPhrases.some(phrase => responseText.includes(phrase))) {
      console.log('Triggering booking modal from chat response');
      showVapiBookingModal();
    }
    
  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Remove typing indicator
    typingIndicator.remove();
    
    // Add error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'chat-message bot-message';
    errorMessage.innerHTML = `<div class="message-content">❌ Извините, произошла ошибка. Попробуйте еще раз.</div>`;
    messagesContainer.appendChild(errorMessage);
  }
  
  // Re-enable button and scroll to bottom
  if (sendButton) sendButton.disabled = false;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Reset conversation context (useful for starting fresh)
function resetConversation() {
  lastChatId = null;
  // Generate new session ID
  sessionId = 'bagira_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('bagira_session_id', sessionId);
  console.log('Conversation reset with new sessionId:', sessionId);
  
  // Clear chat messages except welcome message
  const messagesContainer = document.getElementById('chat-messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = `
      <div class="chat-message bot-message">
        <div class="message-content">
          🤖 Здравствуйте! Я Bagira AI. Чем могу помочь вам сегодня?
        </div>
      </div>
    `;
  }
}

// Make functions globally available
window.openBagiraChat = openBagiraChat;
window.closeBagiraChat = closeBagiraChat;
window.handleChatKeyPress = handleChatKeyPress;
window.sendChatMessage = sendChatMessage;
window.resetConversation = resetConversation; 