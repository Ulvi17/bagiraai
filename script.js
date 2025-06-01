// Set current year in footer
document.addEventListener('DOMContentLoaded', function() {
  const currentYearElement = document.getElementById('currentYear');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
});

// VAPI Configuration with working CDN
var vapiSDKLoaded = false; // Single flag for SDK script loading
var vapiVoiceInstance = null;
var vapiChatInstance = null;
const apiKey = "58f89212-0e94-4123-8f9e-3bc0dde56fe0";
const vapiSquadId = "f468f8d5-b6bd-44fd-b39e-358278e86404";

// Load VAPI SDK script
(function (d, t) {
  var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
  g.src = "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
  g.defer = g.async = true;
  s.parentNode.insertBefore(g, s);

  g.onload = function () {
    console.log('VAPI SDK script has loaded.');
    vapiSDKLoaded = true;
    initializeVapiInstances();
  };
  g.onerror = function() {
    console.error('CRITICAL: Failed to load VAPI SDK script from CDN');
  };
})(document, "script");

function initializeVapiInstances() {
  if (!vapiSDKLoaded || !window.vapiSDK) {
    console.error('VAPI SDK not available on window. Vapi instances cannot be initialized.');
    return;
  }

  try {
    console.log('Initializing VAPI Voice Instance...');
    vapiVoiceInstance = window.vapiSDK.run({
      apiKey: apiKey,
      squad: vapiSquadId,
      config: {
        position: "bottom-right",
        idle: {
          color: "#7A3FFD", type: "pill",
          title: "Поговорить с Bagira AI", subtitle: "Голосовой юр. помощник",
          icon: "https://unpkg.com/lucide-static@0.321.0/icons/mic.svg"
        },
        chat: { enabled: false } // Explicitly disable chat for this one
      }
    });
    console.log('VAPI Voice Instance initialized:', vapiVoiceInstance);

    if (vapiVoiceInstance && vapiVoiceInstance.on) {
      vapiVoiceInstance.on('message', (message) => handleVapiMessage(message, 'voice'));
      vapiVoiceInstance.on('call-started', () => updateVapiButton('Идет звонок...', 'Нажмите для завершения', false));
      vapiVoiceInstance.on('call-ended', () => updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник', false));
      vapiVoiceInstance.on('error', (e) => console.error('VAPI Voice Error:', e));
    } else {
      console.warn('Voice instance or .on method not available immediately.');
    }

  } catch (error) {
    console.error('Failed to initialize VAPI Voice SDK:', error);
  }

  try {
    console.log('Initializing VAPI Chat Instance...');
    vapiChatInstance = window.vapiSDK.run({
      apiKey: apiKey,
      squad: vapiSquadId,
      config: {
        position: "bottom-left",
        idle: {
          color: "#10b981", type: "pill",
          title: "Написать Bagira AI", subtitle: "Текстовый чат",
          icon: "https://unpkg.com/lucide-static@0.321.0/icons/message-circle.svg"
        },
        chat: {
          enabled: true,
          inputPlaceholder: "Введите ваш юридический вопрос...",
          assistantName: "Bagira AI",
          avatarUrl: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐾</text></svg>"
        }
      }
    });
    console.log('VAPI Chat Instance initialized:', vapiChatInstance);

    if (vapiChatInstance && vapiChatInstance.on) {
      vapiChatInstance.on('message', (message) => handleVapiMessage(message, 'chat'));
      // Chat doesn't have 'call-started' or 'call-ended' but rather UI states reflected on its own button.
      // We might need to observe the SDK's chat button if we want to sync perfectly.
      vapiChatInstance.on('error', (e) => console.error('VAPI Chat Error:', e));
    } else {
      console.warn('Chat instance or .on method not available immediately.');
    }
  } catch (error) {
    console.error('Failed to initialize VAPI Chat SDK:', error);
  }
  
  // It's crucial to hide the SDK's buttons AFTER they have been created by the SDK.
  // A slight delay can help ensure they are in the DOM.
  setTimeout(hideOriginalVapiButtons, 500); // Increased delay
  setTimeout(hideOriginalVapiButtons, 1500); // And another try
}

function handleVapiMessage(message, type) {
  console.log(`VAPI ${type} Message received:`, message);
  if (message.type === 'transcript' && message.transcript) {
    const transcript = message.transcript.toLowerCase();
    if (transcript.includes('phone') || transcript.includes('телефон') || 
        transcript.includes('номер') || transcript.includes('контакт') ||
        transcript.includes('email') || transcript.includes('почт')) {
      console.log(`Triggering booking modal from VAPI ${type} message: ${transcript}`);
      setTimeout(() => showVapiBookingModal(), 1000);
    }
  }
  if (message.type === 'function-call' || 
      (message.payload && message.payload.name && (message.payload.name.includes('запись') || message.payload.name.includes('booking')))) {
    console.log(`Triggering booking modal from ${type} function call:`, message.payload);
    setTimeout(() => showVapiBookingModal(), 500);
  }
}

const updateVapiButton = (title, subtitle, isChat = false) => {
  const buttonId = isChat ? 'customChatButton' : 'customVapiButton';
  const button = document.getElementById(buttonId);
  if (!button) {
    console.warn(`Custom button ${buttonId} not found for updating text.`);
    return;
  }
  const titleEl = button.querySelector(isChat ? '.vapi-chat-button__title' : '.vapi-button__title');
  const subtitleEl = button.querySelector(isChat ? '.vapi-chat-button__subtitle' : '.vapi-button__subtitle');

  if (titleEl) {
    titleEl.textContent = title;
    titleEl.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
  } else { console.warn(`Title element not found in ${buttonId}`); }
  if (subtitleEl) {
    subtitleEl.textContent = subtitle;
    subtitleEl.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
  } else { console.warn(`Subtitle element not found in ${buttonId}`); }
  console.log(`Updated ${buttonId} text to: T:"${title}", S:"${subtitle}"`);
};

const handleVapiCustomButtonClick = async (isChat = false) => {
  const type = isChat ? 'Chat' : 'Voice';
  console.log(`Custom VAPI ${type} button clicked.`);

  if (!vapiSDKLoaded) {
    console.warn('VAPI SDK script not loaded yet. Cannot trigger action.');
    updateVapiButton('SDK Загрузка...', 'Подождите', isChat);
    return;
  }

  const instance = isChat ? vapiChatInstance : vapiVoiceInstance;
  if (!instance) {
    console.error(`VAPI ${type} instance is not available. Attempting to re-initialize.`);
    // Potentially try to re-initialize the specific instance or both.
    // initializeVapiInstances(); // This might be too broad, or create duplicates if not careful.
    updateVapiButton('Ошибка инст.', 'Обновите стр.', isChat);
    return;
  }

  // The Vapi SDK's .run() method creates its own button. We need to find and click THAT button.
  // The SDK buttons are usually <div class="vapi-btn" ... data-position="bottom-left"> or similar.
  const sdkButtonSelector = `.vapi-btn[data-position="${isChat ? 'bottom-left' : 'bottom-right'}"]`;
  const sdkButton = document.querySelector(sdkButtonSelector);

  if (sdkButton) {
    console.log(`Found SDK's own ${type} button, attempting to click it:`, sdkButton);
    sdkButton.click(); 
    // Text update for custom button should ideally reflect SDK's button state changes via event listeners.
    updateVapiButton(isChat ? 'Открытие чата...' : 'Соединение...', 
                     isChat ? 'Загрузка интерфейса' : 'Подготовка звонка', 
                     isChat);
  } else {
    console.error(`Could not find the SDK's own ${type} button using selector: ${sdkButtonSelector}. The SDK might not have created its button for this instance, or it's not in the DOM yet.`);
    updateVapiButton('Ошибка SDK Кнопки', 'Попробуйте позже', isChat);
    // As a fallback, sometimes the instance itself can be directly manipulated, though less common with script tag version.
    // if (isChat && typeof instance.show === 'function') instance.show(); 
    // else if (!isChat && typeof instance.start === 'function') instance.start();
  }
};

// Function to hide original VAPI buttons created by the SDK
const hideOriginalVapiButtons = () => {
  console.log("Attempting to hide original VAPI SDK buttons...");
  const sdkButtons = document.querySelectorAll('.vapi-btn, .vapi-widget'); // Target specific classes VAPI uses
  sdkButtons.forEach((btn, index) => {
    // Avoid hiding our custom buttons if they somehow match these general selectors
    if (btn.id === 'customVapiButton' || btn.id === 'customChatButton' || btn.closest('#customVapiButton') || btn.closest('#customChatButton')) {
      return;
    }
    console.log(`Hiding SDK button ${index}:`, btn);
    btn.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; position: absolute !important; left: -9999px !important; pointer-events: none !important; z-index: -1 !important;';
  });
  console.log(`Found and processed ${sdkButtons.length} SDK buttons for hiding.`);
};

// DOMContentLoaded - Main setup
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Bagira AI UI interactions...');
  
  // Set current year
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Custom Voice Button Event
  const customVoiceBtn = document.getElementById('customVapiButton');
  if (customVoiceBtn) {
    customVoiceBtn.addEventListener('click', () => handleVapiCustomButtonClick(false));
    console.log('Custom Voice button event listener attached');
    setTimeout(() => updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник', false), 200); // Initial text
  } else { console.error('Custom Voice Button (customVapiButton) not found!');}
  
  // Custom Chat Button Event
  const customChatBtn = document.getElementById('customChatButton');
  if (customChatBtn) {
    customChatBtn.addEventListener('click', () => handleVapiCustomButtonClick(true));
    console.log('Custom Chat button event listener attached');
    setTimeout(() => updateVapiButton('Написать Bagira AI', 'Текстовый чат', true), 200); // Initial text
  } else { console.error('Custom Chat Button (customChatButton) not found!'); }
  
  // Modal Event Listeners, Form Handlers, etc. (should be unchanged from previous working version)
  setupModalEvents(); // Assuming this function is defined elsewhere from previous steps
  const demoForm = document.getElementById('demoForm');
  if (demoForm) demoForm.addEventListener('submit', handleDemoForm);
  const vapiBookingForm = document.getElementById('vapiBookingForm');
  if (vapiBookingForm) vapiBookingForm.addEventListener('submit', handleVapiBookingForm);

  // Smooth scrolling (unchanged)
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
  
  console.log('Bagira AI UI initialization complete.');
});

// These functions setupModalEvents, handleDemoForm, handleVapiBookingForm, showVapiBookingModal, openModal, closeModal
// are assumed to be defined as they were in previous versions.
// For brevity, I am not redefining them here but they must exist in the final script.js

// Placeholder for setupModalEvents and other utility functions if not fully shown:
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
};
const openModal = (modalId) => { const modal = document.getElementById(modalId); if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; } }; 
const closeModal = (modalId) => { const modal = document.getElementById(modalId); if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } };
const showVapiBookingModal = () => { openModal('vapiBookingModal'); };
const handleDemoForm = (event) => { /* ... existing logic ... */ event.preventDefault(); console.log("Demo form submitted"); };
const handleVapiBookingForm = (event) => { /* ... existing logic ... */ event.preventDefault(); console.log("VAPI booking form submitted"); };


// No longer using setInterval for monitorVapiButtonStates or MutationObserver for now to simplify and rely on SDK events.
// If SDK events are insufficient, these can be re-added.
// setInterval(monitorVapiButtonStates, 1000);
// observer.observe(document.body, { childList: true, subtree: true, characterData: true }); 