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
                console.log('>>> VAPI Event: call-started received!');
                updateVapiButton('Завершить звонок', 'Нажмите чтобы повесить трубку', 'active');
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

  if (!vapiSDKLoaded) {
    console.warn('VAPI SDK script not loaded yet.');
    updateVapiButton('SDK Загрузка...', 'Подождите', 'idle');
    return;
  }
  if (!vapiVoiceInstance) {
    console.error('VAPI Voice instance is not available (null). Cannot start call. Was initialization successful?');
    updateVapiButton('Ошибка Инст.', 'Недоступен', 'idle');
    return;
  }

  // Set to connecting state immediately
  updateVapiButton('Соединение...', 'Подключение к ассистенту', 'connecting');

  if (sdkVoiceButtonElement) {
    console.log('Attempting to click stored SDK Voice button:', sdkVoiceButtonElement);
    sdkVoiceButtonElement.click(); 
    // The 'call-started' event should handle the transition to 'active' state.
    // If it gets stuck on "connecting", it means 'call-started' was not received or handled.
  } else {
    console.error('Stored SDK Voice button reference is MISSING. Cannot trigger call programmatically via SDK button. This usually means findAndStoreVoiceSdkButton failed.');
    // As a last resort, if the SDK button wasn't found, inform the user. 
    // Attempting a direct vapiVoiceInstance.start() is unreliable based on previous errors.
    updateVapiButton('Ошибка SDK Кнопки', 'Не найдена', 'idle'); 
    console.log("Further check: Is vapiVoiceInstance.start a function?", typeof vapiVoiceInstance.start);
    // You could try instance.start() here IF AND ONLY IF VAPI docs confirm it works reliably this way with your specific SDK version/config
    // and if the 'Assistant or Squad must be provided' error is resolved for direct .start() calls.
    // For now, not calling it to avoid known errors.
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