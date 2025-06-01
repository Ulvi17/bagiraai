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
    updateVapiButton('Ошибка SDK', 'Нет связи', false);
  };
})(document, "script");

function initializeVoiceVapiInstance() {
  if (!vapiSDKLoaded || !window.vapiSDK) {
    console.error('VAPI SDK not available on window. Voice instance cannot be initialized.');
    updateVapiButton('Ошибка SDK', 'Не загружен', false);
    return;
  }

  try {
    console.log('Initializing VAPI Voice Instance...');
    vapiVoiceInstance = window.vapiSDK.run({
      apiKey: apiKey,
      squad: vapiSquadId,
      config: {
        position: "bottom-right", // This is important for the SDK to know where to place its button
        idle: {
          color: "#7A3FFD", type: "pill",
          title: "Поговорить с Bagira AI", subtitle: "Голосовой юр. помощник",
          icon: "https://unpkg.com/lucide-static@0.321.0/icons/mic.svg"
        },
        // chat: { enabled: false } // Not strictly needed if chat is not in top-level config
      }
    });
    console.log('VAPI Voice Instance command issued. Instance:', vapiVoiceInstance);

    if (vapiVoiceInstance && vapiVoiceInstance.on) {
      vapiVoiceInstance.on("message", handleVoiceInstanceMessage); // Using your specified structure
      vapiVoiceInstance.on('call-started', () => updateVapiButton('Идет звонок...', 'Нажмите для завершения', false));
      vapiVoiceInstance.on('call-ended', () => updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник', false));
      vapiVoiceInstance.on('error', (e) => {
        console.error('VAPI Voice Instance Error:', e);
        updateVapiButton('Ошибка звонка', 'Попробуйте позже', false);
      });
      console.log('VAPI Voice Instance event listeners attached.');
    } else {
      console.warn('Voice instance or .on method not available immediately post-run. This might be an issue.');
      updateVapiButton('Ошибка инст.', 'Проверьте консоль', false);
    }

    // Attempt to find and hide the SDK's button after a short delay
    console.log("Scheduling search for SDK voice button in 2 seconds...");
    setTimeout(findAndStoreVoiceSdkButton, 2000);

  } catch (error) {
    console.error('Failed to initialize VAPI Voice SDK:', error);
    updateVapiButton('Ошибка Init', 'См. консоль', false);
  }
}

function findAndStoreVoiceSdkButton() {
  console.log("Attempting to find and store SDK voice button...");
  const voiceSelector = '.vapi-btn[data-position="bottom-right"]'; // Selector for the SDK's voice button
  sdkVoiceButtonElement = document.querySelector(voiceSelector);

  if (sdkVoiceButtonElement) {
    console.log("Found SDK Voice Button:", sdkVoiceButtonElement);
    // Hide it immediately after finding
    sdkVoiceButtonElement.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; position: absolute !important; left: -9999px !important; pointer-events: none !important; z-index: -1 !important;';
    console.log("SDK Voice Button has been hidden.");
  } else {
    console.warn(`SDK Voice Button NOT FOUND using selector: ${voiceSelector}. The custom button may not work.`);
    // Attempt to find any .vapi-btn as a last resort if the specific one isn't found
    const genericButtons = document.querySelectorAll('.vapi-btn');
    if (genericButtons.length === 1) { // If there's only one, assume it's our voice button
        sdkVoiceButtonElement = genericButtons[0];
        console.log("Fallback: Found a single generic .vapi-btn, assuming it is the voice button:", sdkVoiceButtonElement);
        sdkVoiceButtonElement.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; position: absolute !important; left: -9999px !important; pointer-events: none !important; z-index: -1 !important;';
        console.log("Fallback SDK Voice Button has been hidden.");
    } else if (genericButtons.length > 1) {
        console.warn("Found multiple generic .vapi-btn elements. Cannot determine which is the correct voice button for fallback.");
    } else {
        console.warn("No .vapi-btn elements found at all for fallback.");
    }
  }
}

// Adapted from your provided message listener structure
function handleVoiceInstanceMessage(message) {
  console.log('VAPI Voice Message received:', message);
  if (
    message.type === "transcript" &&
    message.role === "assistant" &&
    message.transcriptType === "final" &&
    message.transcript
  ) {
    const assistantUtterance = message.transcript.toLowerCase().trim();
    // User mentioned: "please type your phone number below to confirm."
    // Broader check based on previous implementation that worked:
    const triggerPhrases = ['phone', 'телефон', 'номер', 'контакт', 'email', 'почт', 'type your phone number'];
    
    if (triggerPhrases.some(phrase => assistantUtterance.includes(phrase))) {
      console.log(`Triggering booking modal from VAPI voice message: "${assistantUtterance}"`);
      // Assuming showVapiBookingModal() is defined and handles opening your modal
      // If your modal elements were bagiraModal, phoneClientInput, bagiraModalHeader:
      // const bagiraModal = document.getElementById('vapiBookingModal'); // Or your actual modal ID
      // const phoneClientInput = document.getElementById('vapiPhone'); // Or your actual phone input ID
      // const bagiraModalHeader = bagiraModal.querySelector('.modal__title'); // Or your actual header element
      // if (bagiraModal.style.display !== "flex") {
      //   bagiraModal.style.display = "flex"; // This might be better handled by openModal('vapiBookingModal')
      //   if(phoneClientInput) phoneClientInput.focus();
      //   if(bagiraModalHeader) bagiraModalHeader.textContent = "Пожалуйста, введите ваш телефон и email для подтверждения записи.";
      // }
      showVapiBookingModal(); // Prefer using the existing modal functions
      const vapiBookingModalTitle = document.querySelector('#vapiBookingModal .modal__title');
      if(vapiBookingModalTitle) vapiBookingModalTitle.textContent = "Подтвердите запись на консультацию"; // Reset or set title as needed

    }
  }
  // Handle function calls if your assistant uses them for booking
  if (message.type === 'function-call' || 
      (message.payload && message.payload.name && (message.payload.name.includes('запись') || message.payload.name.includes('booking')))) {
    console.log(`Triggering booking modal from voice function call:`, message.payload);
    showVapiBookingModal();
  }
}

const updateVapiButton = (title, subtitle, isChat = false) => { // isChat param is no longer used but kept for signature consistency if called elsewhere
  const buttonId = 'customVapiButton'; // Hardcoded to voice button
  const button = document.getElementById(buttonId);
  if (!button) return;
  const titleEl = button.querySelector('.vapi-button__title');
  const subtitleEl = button.querySelector('.vapi-button__subtitle');
  if (titleEl) {
    titleEl.textContent = title;
    titleEl.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
  }
  if (subtitleEl) {
    subtitleEl.textContent = subtitle;
    subtitleEl.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
  }
};

const handleVapiCustomButtonClick = async () => { // Removed isChat parameter
  console.log('Custom VAPI Voice button clicked.');

  if (!vapiSDKLoaded) {
    console.warn('VAPI SDK script not loaded yet. Cannot trigger voice action.');
    updateVapiButton('SDK Загрузка...', 'Подождите');
    return;
  }
  if (!vapiVoiceInstance) {
    console.error('VAPI Voice instance is not available. Cannot start call.');
    updateVapiButton('Ошибка Инст.', 'Обновите стр.');
    return;
  }

  if (sdkVoiceButtonElement) {
    console.log('Attempting to click stored SDK Voice button:', sdkVoiceButtonElement);
    sdkVoiceButtonElement.click(); 
    // VAPI events ('call-started') should update the button text now
  } else {
    console.error('Stored SDK Voice button reference is MISSING. Cannot trigger call. Was it found after initialization?');
    updateVapiButton('Ошибка SDK Кнопки', 'Не найдена');
     // Fallback: Try to use instance.start() if available and button not found (less common for script tag version)
     if (typeof vapiVoiceInstance.start === 'function') {
        console.log('SDK button not found, attempting vapiVoiceInstance.start()');
        vapiVoiceInstance.start();
     } else {
        console.warn('vapiVoiceInstance.start() is not a function.');
     }
  }
};

// DOMContentLoaded - Main setup
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Bagira AI UI interactions (Voice Only Focus)...');
  
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const customVoiceBtn = document.getElementById('customVapiButton');
  if (customVoiceBtn) {
    customVoiceBtn.addEventListener('click', handleVapiCustomButtonClick);
    console.log('Custom Voice button event listener attached');
    setTimeout(() => updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник'), 200);
  } else { console.error('Custom Voice Button (customVapiButton) not found!');}
  
  // Remove chat button listener if it was added
  const customChatBtn = document.getElementById('customChatButton');
  if (customChatBtn) {
    // customChatBtn.removeEventListener('click', handleVapiCustomButtonClick); // If a named function was used
    // Or simply hide it / don't initialize its listener
    customChatBtn.style.display = 'none'; // Hide the chat button for now
    console.log('Custom Chat Button has been hidden as we focus on voice only.');
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
  
  console.log('Bagira AI UI initialization complete (Voice Only Focus).');
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