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

// References to the SDK's own buttons, once found
var sdkVoiceButtonElement = null;
var sdkChatButtonElement = null;

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
        chat: { enabled: false }
      }
    });
    console.log('VAPI Voice Instance command issued.');

    if (vapiVoiceInstance && vapiVoiceInstance.on) {
      vapiVoiceInstance.on('message', (message) => handleVapiMessage(message, 'voice'));
      vapiVoiceInstance.on('call-started', () => updateVapiButton('Идет звонок...', 'Нажмите для завершения', false));
      vapiVoiceInstance.on('call-ended', () => updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник', false));
      vapiVoiceInstance.on('error', (e) => console.error('VAPI Voice Error:', e));
    } else {
      console.warn('Voice instance or .on method not available immediately post-run.');
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
    console.log('VAPI Chat Instance command issued.');

    if (vapiChatInstance && vapiChatInstance.on) {
      vapiChatInstance.on('message', (message) => handleVapiMessage(message, 'chat'));
      vapiChatInstance.on('error', (e) => console.error('VAPI Chat Error:', e));
    } else {
      console.warn('Chat instance or .on method not available immediately post-run.');
    }
  } catch (error) {
    console.error('Failed to initialize VAPI Chat SDK:', error);
  }
  
  // After attempting to run both instances, wait a bit for SDK to render its buttons, then find and hide them.
  console.log("Scheduling search for SDK buttons in 2 seconds...");
  setTimeout(findAndStoreSdkButtons, 2000); // Give SDK 2 seconds to render
}

function findAndStoreSdkButtons() {
  console.log("Attempting to find and store SDK buttons...");

  // Find Voice SDK button
  const voiceSelector = '.vapi-btn[data-position="bottom-right"]';
  sdkVoiceButtonElement = document.querySelector(voiceSelector);
  if (sdkVoiceButtonElement) {
    console.log("Found SDK Voice Button:", sdkVoiceButtonElement);
    hideSpecificSdkButton(sdkVoiceButtonElement, "Voice");
  } else {
    console.warn(`SDK Voice Button NOT FOUND using selector: ${voiceSelector}. It might have a different structure or was not rendered.`);
    // Try a more generic selector as a fallback for voice, assuming it might be the first .vapi-btn
    const genericVoiceAttempt = document.querySelectorAll('.vapi-btn');
    if (genericVoiceAttempt.length > 0 && genericVoiceAttempt[0].dataset.position !== "bottom-left") { // ensure it's not the chat one
        sdkVoiceButtonElement = genericVoiceAttempt[0];
        console.log("Fallback: Found potential SDK Voice Button (first .vapi-btn):", sdkVoiceButtonElement);
        hideSpecificSdkButton(sdkVoiceButtonElement, "Voice (Fallback)");
    } else {
         console.warn("Fallback for SDK Voice Button also failed.");
    }
  }

  // Find Chat SDK button
  const chatSelector = '.vapi-btn[data-position="bottom-left"]';
  sdkChatButtonElement = document.querySelector(chatSelector);
  if (sdkChatButtonElement) {
    console.log("Found SDK Chat Button:", sdkChatButtonElement);
    hideSpecificSdkButton(sdkChatButtonElement, "Chat");
  } else {
    console.warn(`SDK Chat Button NOT FOUND using selector: ${chatSelector}.`);
     // Try a more generic selector as a fallback for chat, assuming it might be the second .vapi-btn or one with chat-like properties
    const genericChatAttempt = Array.from(document.querySelectorAll('.vapi-btn'));
    const potentialChatButton = genericChatAttempt.find(btn => btn !== sdkVoiceButtonElement); // find one that isn't the stored voice button
    if (potentialChatButton) {
        sdkChatButtonElement = potentialChatButton;
        console.log("Fallback: Found potential SDK Chat Button (a .vapi-btn different from voice):", sdkChatButtonElement);
        hideSpecificSdkButton(sdkChatButtonElement, "Chat (Fallback)");
    } else {
        console.warn("Fallback for SDK Chat Button also failed.");
    }
  }
}

function hideSpecificSdkButton(element, type) {
  if (element) {
    console.log(`Hiding SDK ${type} Button:`, element);
    element.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; position: absolute !important; left: -9999px !important; pointer-events: none !important; z-index: -1 !important;';
  }
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
    // console.warn(`Custom button ${buttonId} not found for updating text.`); // This can be noisy
    return;
  }
  const titleEl = button.querySelector(isChat ? '.vapi-chat-button__title' : '.vapi-button__title');
  const subtitleEl = button.querySelector(isChat ? '.vapi-chat-button__subtitle' : '.vapi-button__subtitle');

  if (titleEl) {
    titleEl.textContent = title;
    titleEl.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
  } else { /* console.warn(`Title element not found in ${buttonId}`); */ }
  if (subtitleEl) {
    subtitleEl.textContent = subtitle;
    subtitleEl.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
  } else { /* console.warn(`Subtitle element not found in ${buttonId}`); */ }
  // console.log(`Updated ${buttonId} text to: T:"${title}", S:"${subtitle}"`); // Can be noisy
};

const handleVapiCustomButtonClick = async (isChat = false) => {
  const type = isChat ? 'Chat' : 'Voice';
  console.log(`Custom VAPI ${type} button clicked.`);

  if (!vapiSDKLoaded) {
    console.warn('VAPI SDK script not loaded yet. Cannot trigger action.');
    updateVapiButton('SDK Загрузка...', 'Подождите', isChat);
    return;
  }

  const sdkButtonToClick = isChat ? sdkChatButtonElement : sdkVoiceButtonElement;

  if (sdkButtonToClick) {
    console.log(`Attempting to click stored SDK ${type} button:`, sdkButtonToClick);
    sdkButtonToClick.click(); 
    updateVapiButton(isChat ? 'Открытие чата...' : 'Соединение...', 
                     isChat ? 'Загрузка интерфейса' : 'Подготовка звонка', 
                     isChat);
  } else {
    console.error(`Stored SDK ${type} button reference is MISSING. It was not found after initialization, or an error occurred. Check earlier logs.`);
    updateVapiButton('Ошибка SDK Кнопки', 'Не найдена', isChat);
  }
};

// DOMContentLoaded - Main setup
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Bagira AI UI interactions...');
  
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const customVoiceBtn = document.getElementById('customVapiButton');
  if (customVoiceBtn) {
    customVoiceBtn.addEventListener('click', () => handleVapiCustomButtonClick(false));
    console.log('Custom Voice button event listener attached');
    setTimeout(() => updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник', false), 200);
  } else { console.error('Custom Voice Button (customVapiButton) not found!');}
  
  const customChatBtn = document.getElementById('customChatButton');
  if (customChatBtn) {
    customChatBtn.addEventListener('click', () => handleVapiCustomButtonClick(true));
    console.log('Custom Chat button event listener attached');
    setTimeout(() => updateVapiButton('Написать Bagira AI', 'Текстовый чат', true), 200);
  } else { console.error('Custom Chat Button (customChatButton) not found!'); }
  
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
  
  console.log('Bagira AI UI initialization complete.');
});

// Utility functions (assumed to be defined correctly from previous steps)
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

// No longer using setInterval for monitorVapiButtonStates or MutationObserver for now to simplify and rely on SDK events.
// If SDK events are insufficient, these can be re-added.
// setInterval(monitorVapiButtonStates, 1000);
// observer.observe(document.body, { childList: true, subtree: true, characterData: true }); 