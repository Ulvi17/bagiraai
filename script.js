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
  console.log('DOM loaded, initializing Bagira AI UI interactions (Voice & Text Chat)...');
  
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
  
  // Initialize chat modal
  setTimeout(() => {
    initializeChatModal();
    console.log('Chat modal initialized');
  }, 100);
  
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
  
  console.log('Bagira AI UI initialization complete (Voice & Text Chat).');
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
    const closeChatBtn = document.getElementById('closeChatModal');
    if (closeChatBtn) closeChatBtn.addEventListener('click', () => closeModal('textChatModal'));
    document.addEventListener('click', (e) => { 
      if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        closeModal(modalId); 
      }
    });
    document.addEventListener('keydown', (e) => { 
      if (e.key === 'Escape') { 
        closeModal('demoModal'); 
        closeModal('vapiBookingModal'); 
        closeModal('textChatModal');
      } 
    });
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

// VAPI Text Chat Functionality using Chat API
const CHAT_API_KEY = "58f89212-0e94-4123-8f9e-3bc0dde56fe0";
const CHAT_ASSISTANT_ID = "f60d3d06-8dd2-4e0e-b0e5-ed28384203a2";
let previousChatId = null;

// Chat modal elements
let chatMessagesDiv = null;
let chatInputField = null;
let sendChatButton = null;

// Initialize chat modal elements
function initializeChatModal() {
  chatMessagesDiv = document.getElementById('chatMessages');
  chatInputField = document.getElementById('chatMessageInput');
  sendChatButton = document.getElementById('sendChatMessage');
  
  if (chatInputField) {
    // Add Enter key support
    chatInputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }
  
  if (sendChatButton) {
    sendChatButton.addEventListener('click', sendChatMessage);
  }
}

// Append message to chat
function appendChatMessage(role, content) {
  if (!chatMessagesDiv) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${role}`;
  
  const roleSpan = document.createElement('div');
  roleSpan.className = 'message-role';
  roleSpan.textContent = role === 'user' ? '👤 Вы' : '🤖 Bagira AI';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;
  
  messageDiv.appendChild(roleSpan);
  messageDiv.appendChild(contentDiv);
  chatMessagesDiv.appendChild(messageDiv);
  
  // Scroll to bottom
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
  if (!chatMessagesDiv) return;
  
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typingIndicator';
  typingDiv.className = 'chat-typing';
  typingDiv.innerHTML = '<span class="chat-loading"></span>Bagira AI печатает...';
  
  chatMessagesDiv.appendChild(typingDiv);
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Send chat message using VAPI Chat API
async function sendChatMessage() {
  if (!chatInputField || !sendChatButton) return;
  
  const message = chatInputField.value.trim();
  if (!message) return;
  
  // Disable input and button while sending
  chatInputField.disabled = true;
  sendChatButton.disabled = true;
  const originalButtonText = sendChatButton.innerHTML;
  sendChatButton.innerHTML = '<span class="chat-loading"></span>';
  
  // Add user message to chat
  appendChatMessage('user', message);
  chatInputField.value = '';
  
  // Show typing indicator
  showTypingIndicator();
  
  const payload = {
    assistantId: CHAT_ASSISTANT_ID,
    input: message,
    ...(previousChatId && { previousChatId })
  };
  
  try {
    console.log('Sending message to VAPI Chat API:', message);
    
    const response = await fetch("https://api.vapi.ai/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CHAT_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('VAPI Chat API response:', data);
    
    // Store chat ID for continuity
    if (data.id) {
      previousChatId = data.id;
    }
    
    // Remove typing indicator
    removeTypingIndicator();
    
    // Get assistant response
    const reply = data.output?.[0]?.content || data.message || "Извините, я не смог обработать ваш запрос.";
    appendChatMessage('assistant', reply);
    
    // Check if response indicates booking/contact request
    const lowerReply = reply.toLowerCase();
    const bookingTriggers = ['телефон', 'номер', 'контакт', 'email', 'почт', 'phone', 'запись', 'консультация'];
    
    if (bookingTriggers.some(trigger => lowerReply.includes(trigger))) {
      console.log('Detected booking request in chat, showing booking modal');
      setTimeout(() => {
        showVapiBookingModal();
        closeModal('textChatModal');
      }, 1000);
    }
    
  } catch (error) {
    console.error('Error sending chat message:', error);
    removeTypingIndicator();
    appendChatMessage('assistant', `⚠️ Ошибка: ${error.message}. Попробуйте еще раз или используйте голосовой помощник.`);
  } finally {
    // Re-enable input and button
    chatInputField.disabled = false;
    sendChatButton.disabled = false;
    sendChatButton.innerHTML = originalButtonText;
    chatInputField.focus();
  }
}

// Handle custom chat button click to open chat modal
const handleVapiChatButtonClick = () => {
  console.log('Opening text chat modal...');
  openModal('textChatModal');
  
  // Initialize chat if needed
  if (!chatMessagesDiv) {
    setTimeout(initializeChatModal, 100);
  }
  
  // Focus input field
  setTimeout(() => {
    if (chatInputField) {
      chatInputField.focus();
    }
  }, 200);
  
  // Add welcome message if chat is empty
  if (chatMessagesDiv && chatMessagesDiv.children.length === 0) {
    setTimeout(() => {
      appendChatMessage('assistant', 'Здравствуйте! Я Bagira AI. Чем могу помочь вам сегодня?');
    }, 300);
  }
}; 