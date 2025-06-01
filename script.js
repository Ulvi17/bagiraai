// Set current year in footer
document.addEventListener('DOMContentLoaded', function() {
  const currentYearElement = document.getElementById('currentYear');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
});

// VAPI Configuration
let vapi = null;
let isVapiLoaded = false;
let vapiStarted = false;

// VAPI SDK Integration
const initializeVAPI = () => {
  if (typeof Vapi === 'undefined') {
    console.log('VAPI SDK not loaded yet, retrying...');
    setTimeout(initializeVAPI, 1000);
    return;
  }

  try {
    vapi = new Vapi("4a37ea94-8f84-4459-b3fa-31c40e0f8031");
    isVapiLoaded = true;
    console.log('VAPI initialized successfully');

    // VAPI Event Listeners
    vapi.on('call-start', () => {
      console.log('Call started');
      updateVapiButton('Идет звонок...', 'Нажмите для завершения');
    });

    vapi.on('call-end', () => {
      console.log('Call ended');
      vapiStarted = false;
      updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник');
    });

    vapi.on('speech-start', () => {
      console.log('User started speaking');
    });

    vapi.on('speech-end', () => {
      console.log('User stopped speaking');
    });

    vapi.on('message', (message) => {
      console.log('Message from VAPI:', message);
      
      // Check if this is a booking confirmation message
      if (message.type === 'function-call' || (message.content && message.content.includes('запись'))) {
        showVapiBookingModal();
      }
    });

    vapi.on('error', (error) => {
      console.error('VAPI Error:', error);
      updateVapiButton('Ошибка соединения', 'Попробуйте позже');
      setTimeout(() => {
        updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник');
      }, 3000);
    });

  } catch (error) {
    console.error('Failed to initialize VAPI:', error);
  }
};

// Update VAPI button text
const updateVapiButton = (title, subtitle) => {
  const button = document.getElementById('customVapiButton');
  if (button) {
    const titleEl = button.querySelector('.vapi-button__title');
    const subtitleEl = button.querySelector('.vapi-button__subtitle');
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
  }
};

// Handle VAPI button click
const handleVapiClick = async () => {
  console.log('VAPI button clicked');
  
  if (!isVapiLoaded || !vapi) {
    console.log('VAPI not loaded yet');
    updateVapiButton('Загрузка...', 'Подождите');
    
    // Try to initialize again
    initializeVAPI();
    
    setTimeout(() => {
      updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник');
    }, 3000);
    return;
  }

  try {
    if (vapiStarted) {
      // Stop the call if it's already running
      console.log('Stopping VAPI call');
      vapi.stop();
      vapiStarted = false;
      updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник');
    } else {
      // Start the call
      console.log('Starting VAPI call');
      updateVapiButton('Соединение...', 'Подготовка звонка');
      
      await vapi.start({
        assistantId: "e139db91-3cba-456d-b27e-fa7b4cde0e07",
        assistantOverrides: {
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "ru",
          },
          voice: {
            provider: "11labs",
            voiceId: "cgSgspJ2msm6clMCkdW9",
          },
        },
      });
      vapiStarted = true;
      console.log('VAPI call started successfully');
    }
  } catch (error) {
    console.error('Error with VAPI call:', error);
    updateVapiButton('Ошибка', 'Попробуйте позже');
    vapiStarted = false;
    setTimeout(() => {
      updateVapiButton('Поговорить с Bagira AI', 'Голосовой помощник');
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
  
  // Simple validation
  if (!phone || !email) {
    alert('Пожалуйста, заполните все поля');
    return;
  }
  
  // Simulate booking confirmation
  alert('Спасибо! Ваша запись подтверждена. Мы отправили детали на указанный email.');
  
  // Reset and close
  form.reset();
  closeModal('vapiBookingModal');
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Bagira AI...');
  
  // Set current year
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
  
  // Wait for VAPI SDK to load, then initialize
  const waitForVapi = () => {
    if (typeof Vapi !== 'undefined') {
      console.log('VAPI SDK found, initializing...');
      initializeVAPI();
    } else {
      console.log('Waiting for VAPI SDK...');
      setTimeout(waitForVapi, 500);
    }
  };
  
  waitForVapi();
  
  // Custom VAPI Button Event
  const customVapiButton = document.getElementById('customVapiButton');
  if (customVapiButton) {
    customVapiButton.addEventListener('click', handleVapiClick);
    console.log('Custom VAPI button event listener attached');
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
    
    // Video button
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
      '[data-vapi]',
      '.vapi-widget',
      'div[class*="vapi"]',
      'button[class*="vapi"]'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.id !== 'customVapiButton') { // Don't hide our custom button
          el.style.display = 'none !important';
          el.style.visibility = 'hidden !important';
          el.style.opacity = '0 !important';
          el.style.pointerEvents = 'none !important';
        }
      });
    });
  };
  
  hideOriginalVapiButtons();
  
  // Continuously hide original VAPI buttons as they might be added dynamically
  setInterval(hideOriginalVapiButtons, 1000);
  
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

// Load VAPI SDK dynamically
const loadVapiSDK = () => {
  if (document.querySelector('script[src*="vapi.ai"]')) {
    return; // Already loaded
  }
  
  const script = document.createElement('script');
  script.src = 'https://cdn.vapi.ai/js/vapi.js';
  script.async = true;
  script.onload = () => {
    console.log('VAPI SDK loaded');
    initializeVAPI();
  };
  script.onerror = () => {
    console.error('Failed to load VAPI SDK');
  };
  document.head.appendChild(script);
};

// Load VAPI SDK
loadVapiSDK(); 