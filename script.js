// Set current year in footer
document.addEventListener('DOMContentLoaded', function() {
  const currentYearElement = document.getElementById('currentYear');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
});

// VAPI Configuration with working CDN
var vapiInstance = null;
var vapiChatInstance = null;
const apiKey = "58f89212-0e94-4123-8f9e-3bc0dde56fe0";
const vapiSquadId = "f468f8d5-b6bd-44fd-b39e-358278e86404";
let isVapiLoaded = false;
let isVapiChatLoaded = false;
let vapiStarted = false;

// Load VAPI SDK with working CDN
(function (d, t) {
  var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
  g.src = "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
  g.defer = g.async = true;
  s.parentNode.insertBefore(g, s);

  g.onload = function () {
    try {
      // Voice VAPI instance
      vapiInstance = window.vapiSDK.run({
        apiKey: apiKey,
        squad: vapiSquadId,
        config: {
          position: "bottom-right",
          idle: {
            color: "#7A3FFD",
            type: "pill",
            title: "Поговорить с Bagira AI",
            subtitle: "Голосовой юр. помощник",
            icon: "https://unpkg.com/lucide-static@0.321.0/icons/mic.svg"
          }
        }
      });
      
      // Chat VAPI instance
      vapiChatInstance = window.vapiSDK.run({
        apiKey: apiKey,
        squad: vapiSquadId,
        config: {
          position: "bottom-left",
          idle: {
            color: "#10b981",
            type: "pill",
            title: "Написать Bagira AI",
            subtitle: "Текстовый чат",
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
      
      isVapiLoaded = true;
      isVapiChatLoaded = true;
      console.log('VAPI SDK loaded successfully with voice and chat');
      
      // Listen for VAPI messages to trigger booking modal
      const setupMessageListener = (instance, type) => {
        if (instance && instance.on) {
          instance.on('message', (message) => {
            console.log(`VAPI ${type} Message received:`, message);
            
            // Check if assistant is asking for contact details
            if (message.type === 'transcript' && message.transcript) {
              const transcript = message.transcript.toLowerCase();
              if (transcript.includes('phone') || transcript.includes('телефон') || 
                  transcript.includes('номер') || transcript.includes('контакт') ||
                  transcript.includes('email') || transcript.includes('почт')) {
                console.log(`Triggering booking modal from VAPI ${type} message`);
                setTimeout(() => showVapiBookingModal(), 1000);
              }
            }
            
            // Check for function calls
            if (message.type === 'function-call' || 
                (message.content && (message.content.includes('запись') || message.content.includes('booking')))) {
              console.log(`Triggering booking modal from ${type} function call`);
              setTimeout(() => showVapiBookingModal(), 500);
            }
          });
        }
      };
      
      setupMessageListener(vapiInstance, 'voice');
      setupMessageListener(vapiChatInstance, 'chat');
      
      // Hide the original VAPI buttons immediately
      hideOriginalVapiButtons();
      
    } catch (error) {
      console.error('Failed to initialize VAPI SDK:', error);
    }
  };

  g.onerror = function() {
    console.error('Failed to load VAPI SDK from CDN');
  };
})(document, "script");

// Update VAPI button text
const updateVapiButton = (title, subtitle, isChat = false) => {
  const buttonId = isChat ? 'customChatButton' : 'customVapiButton';
  const button = document.getElementById(buttonId);
  if (button) {
    const titleEl = button.querySelector(isChat ? '.vapi-chat-button__title' : '.vapi-button__title');
    const subtitleEl = button.querySelector(isChat ? '.vapi-chat-button__subtitle' : '.vapi-button__subtitle');
    if (titleEl) {
      titleEl.textContent = title;
      titleEl.style.display = 'block';
      titleEl.style.visibility = 'visible';
      titleEl.style.opacity = '1';
    }
    if (subtitleEl) {
      subtitleEl.textContent = subtitle;
      subtitleEl.style.display = 'block';
      subtitleEl.style.visibility = 'visible';
      subtitleEl.style.opacity = '1';
    }
  }
};

// Handle VAPI button click with working implementation
const handleVapiClick = async (isChat = false) => {
  const type = isChat ? 'chat' : 'voice';
  console.log(`Custom VAPI ${type} button clicked`);
  
  const instance = isChat ? vapiChatInstance : vapiInstance;
  const isLoaded = isChat ? isVapiChatLoaded : isVapiLoaded;
  
  if (!isLoaded || !instance) {
    console.log(`VAPI ${type} not loaded yet`);
    updateVapiButton('Загрузка...', 'Подождите', isChat);
    setTimeout(() => {
      updateVapiButton(
        isChat ? 'Написать Bagira AI' : 'Поговорить с Bagira AI', 
        isChat ? 'Текстовый чат' : 'Голосовой помощник', 
        isChat
      );
    }, 3000);
    return;
  }

  try {
    // Use the original VAPI button functionality by simulating click
    const selector = isChat ? '.vapi-btn[data-position="bottom-left"]' : '.vapi-btn[data-position="bottom-right"]';
    const originalVapiButton = document.querySelector(selector) || document.querySelector('.vapi-btn');
    
    if (originalVapiButton) {
      console.log(`Triggering original VAPI ${type} button`);
      originalVapiButton.click();
      updateVapiButton(
        isChat ? 'Открытие чата...' : 'Соединение...', 
        isChat ? 'Подготовка чата' : 'Подготовка звонка', 
        isChat
      );
    } else {
      console.log(`Original VAPI ${type} button not found`);
      updateVapiButton('Ошибка', 'Попробуйте позже', isChat);
      setTimeout(() => {
        updateVapiButton(
          isChat ? 'Написать Bagira AI' : 'Поговорить с Bagira AI', 
          isChat ? 'Текстовый чат' : 'Голосовой помощник', 
          isChat
        );
      }, 3000);
    }
  } catch (error) {
    console.error(`Error with VAPI ${type} call:`, error);
    updateVapiButton('Ошибка', 'Попробуйте позже', isChat);
    setTimeout(() => {
      updateVapiButton(
        isChat ? 'Написать Bagira AI' : 'Поговорить с Bagira AI', 
        isChat ? 'Текстовый чат' : 'Голосовой помощник', 
        isChat
      );
    }, 3000);
  }
};

// Modal Management
const openModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

const closeModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

const showVapiBookingModal = () => {
  openModal('vapiBookingModal');
};

// Form Handlers
const handleDemoForm = (event) => {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const messageEl = document.getElementById('demoMessage');
  
  // Simulate form submission
  messageEl.textContent = 'Отправляем заявку...';
  messageEl.className = 'form__message';
  messageEl.style.display = 'block';
  
  setTimeout(() => {
    messageEl.textContent = 'Спасибо! Мы свяжемся с вами в течение часа для демонстрации.';
    messageEl.className = 'form__message success';
    
    // Reset form after delay
    setTimeout(() => {
      form.reset();
      closeModal('demoModal');
      messageEl.style.display = 'none';
    }, 3000);
  }, 1500);
};

const handleVapiBookingForm = (event) => {
  event.preventDefault();
  
  const form = event.target;
  const phone = document.getElementById('vapiPhone').value;
  const email = document.getElementById('vapiEmail').value;
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  
  // Simple validation
  if (!phone || !email) {
    alert('Пожалуйста, заполните все поля');
    return;
  }
  
  // Disable button and show loading
  submitButton.disabled = true;
  submitButton.textContent = 'Отправляем...';
  
  // Send to webhook
  fetch("https://primary-production-3672.up.railway.app/webhook/bagira-submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, email })
  })
  .then(response => {
    if (response.ok) {
      alert("Спасибо! Мы скоро направим информацию по указанному номеру телефона или почте");
    } else {
      alert("Ошибка отправки. ❌ Пожалуйста, попробуйте еще раз или свяжитесь с поддержкой.");
    }
    closeModal('vapiBookingModal');
    form.reset();
  })
  .catch(error => {
    console.error("Ошибка отправки формы Bagira AI:", error);
    alert("Что-то пошло не так. ❌\n" + (error.message || error));
    closeModal('vapiBookingModal');
  })
  .finally(() => {
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  });
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Bagira AI...');
  
  // Set current year
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
  
  // Custom VAPI Button Event
  const customVapiButton = document.getElementById('customVapiButton');
  if (customVapiButton) {
    customVapiButton.addEventListener('click', () => handleVapiClick());
    console.log('Custom VAPI button event listener attached');
    
    // Ensure text is visible initially
    setTimeout(() => {
      updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник', false);
    }, 100);
  }
  
  // Custom Chat Button Event
  const customChatButton = document.getElementById('customChatButton');
  if (customChatButton) {
    customChatButton.addEventListener('click', () => handleVapiClick(true));
    console.log('Custom Chat button event listener attached');
    
    // Ensure text is visible initially
    setTimeout(() => {
      updateVapiButton('Написать Bagira AI', 'Текстовый чат', true);
    }, 100);
  }
  
  // Modal Event Listeners
  const setupModalEvents = () => {
    // Demo modal triggers
    const demoButtons = ['navDemoBtn', 'heroMainCTA', 'finalCTA'];
    demoButtons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => openModal('demoModal'));
      }
    });
    
    // Video button - scroll to video
    const videoBtn = document.getElementById('heroVideoCTA');
    if (videoBtn) {
      videoBtn.addEventListener('click', () => {
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
          videoContainer.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
    
    // Close modal events
    const closeDemoBtn = document.getElementById('closeDemoModal');
    if (closeDemoBtn) {
      closeDemoBtn.addEventListener('click', () => closeModal('demoModal'));
    }
    
    const closeVapiBtn = document.getElementById('closeVapiModal');
    if (closeVapiBtn) {
      closeVapiBtn.addEventListener('click', () => closeModal('vapiBookingModal'));
    }
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
      }
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal('demoModal');
        closeModal('vapiBookingModal');
      }
    });
  };
  
  setupModalEvents();
  
  // Form Event Listeners
  const demoForm = document.getElementById('demoForm');
  if (demoForm) {
    demoForm.addEventListener('submit', handleDemoForm);
  }
  
  const vapiBookingForm = document.getElementById('vapiBookingForm');
  if (vapiBookingForm) {
    vapiBookingForm.addEventListener('submit', handleVapiBookingForm);
  }
  
  // Hide any existing VAPI buttons
  const hideOriginalVapiButtons = () => {
    const selectors = [
      '.vapi-btn',
      '.vapi-widget',
      '[data-vapi]',
      'div[class*="vapi"]:not(#customVapiButton)',
      'button[class*="vapi"]:not(#customVapiButton)'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.id !== 'customVapiButton' && !el.closest('#customVapiButton')) {
          el.style.display = 'none !important';
          el.style.visibility = 'hidden !important';
          el.style.opacity = '0 !important';
          el.style.pointerEvents = 'none !important';
          el.style.position = 'absolute !important';
          el.style.left = '-9999px !important';
        }
      });
    });
  };
  
  // Store the function globally so VAPI SDK can access it
  window.hideOriginalVapiButtons = hideOriginalVapiButtons;
  
  // Hide original buttons initially and continuously
  hideOriginalVapiButtons();
  setInterval(hideOriginalVapiButtons, 500);
  
  // Smooth scrolling for anchor links
  const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
  smoothScrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  
  console.log('Bagira AI website initialized successfully');
});

// Additional VAPI button state monitoring
const monitorVapiButtonStates = () => {
  // Monitor voice button
  const originalVoiceButton = document.querySelector('.vapi-btn[data-position="bottom-right"]') || 
                             document.querySelectorAll('.vapi-btn')[0];
  if (originalVoiceButton) {
    // Check if call is active by looking at button classes
    if (originalVoiceButton.classList.contains('vapi-btn-is-active')) {
      updateVapiButton('Идет звонок...', 'Нажмите для завершения', false);
    } else if (originalVoiceButton.classList.contains('vapi-btn-is-loading')) {
      updateVapiButton('Соединение...', 'Подготовка звонка', false);
    } else {
      updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник', false);
    }
    
    // Monitor for text changes that might indicate booking request
    const buttonText = originalVoiceButton.textContent || originalVoiceButton.innerText || '';
    if (buttonText.toLowerCase().includes('phone') || 
        buttonText.toLowerCase().includes('contact') ||
        buttonText.toLowerCase().includes('телефон') ||
        buttonText.toLowerCase().includes('номер')) {
      console.log('Detected booking request from voice button text');
      setTimeout(() => showVapiBookingModal(), 1000);
    }
  }
  
  // Monitor chat button
  const originalChatButton = document.querySelector('.vapi-btn[data-position="bottom-left"]') || 
                            document.querySelectorAll('.vapi-btn')[1];
  if (originalChatButton) {
    // Check if chat is active
    if (originalChatButton.classList.contains('vapi-btn-is-active')) {
      updateVapiButton('Чат активен...', 'Нажмите для закрытия', true);
    } else if (originalChatButton.classList.contains('vapi-btn-is-loading')) {
      updateVapiButton('Открытие чата...', 'Подготовка чата', true);
    } else {
      updateVapiButton('Написать Bagira AI', 'Текстовый чат', true);
    }
    
    // Monitor for text changes that might indicate booking request
    const chatText = originalChatButton.textContent || originalChatButton.innerText || '';
    if (chatText.toLowerCase().includes('phone') || 
        chatText.toLowerCase().includes('contact') ||
        chatText.toLowerCase().includes('телефон') ||
        chatText.toLowerCase().includes('номер')) {
      console.log('Detected booking request from chat button text');
      setTimeout(() => showVapiBookingModal(), 1000);
    }
  }
};

// Monitor VAPI button states
setInterval(monitorVapiButtonStates, 1000);

// Additional monitoring for DOM changes that might indicate VAPI interaction
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.toLowerCase();
          if (text.includes('phone') || text.includes('телефон') || 
              text.includes('номер') || text.includes('contact')) {
            console.log('Detected contact request from DOM mutation');
            setTimeout(() => showVapiBookingModal(), 1500);
          }
        }
      });
    }
  });
});

// Start observing
setTimeout(() => {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}, 2000); 