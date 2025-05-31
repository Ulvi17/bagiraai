// Set current year in footer
document.addEventListener('DOMContentLoaded', function() {
  const currentYearElement = document.getElementById('currentYear');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
});

// VAPI Configuration
var vapiInstance = null;
const apiKey = "58f89212-0e94-4123-8f9e-3bc0dde56fe0";
const vapiSquadId = "f468f8d5-b6bd-44fd-b39e-358278e86404";

// Load VAPI SDK and initialize
(function (d, t) {
  var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
  g.src = "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
  g.defer = g.async = true;
  s.parentNode.insertBefore(g, s);

  g.onload = function () {
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

    // Modal and form elements
    const bagiraModal = document.getElementById("bagiraFormModal");
    const bagiraClientForm = document.getElementById("bagiraForm");
    const closeBagiraModalBtn = document.getElementById("closeBagiraModal");
    const phoneClientInput = document.getElementById("phoneInput");
    const bagiraModalHeader = document.getElementById("bagiraModalHeader");

    // Listen for VAPI messages
    vapiInstance.on("message", (message) => {
      if (message.type === "transcript" && message.role === "assistant" && message.transcriptType === "final" && message.transcript) {
        const assistantUtterance = message.transcript.toLowerCase().trim();
        const coreTriggerPhrase = "please type your phone number below to confirm."; 
        
        if (assistantUtterance.includes(coreTriggerPhrase)) {
          if (bagiraModal && bagiraModal.style.display !== "flex") {
            bagiraModal.style.display = "flex";
            if (phoneClientInput) phoneClientInput.focus();
            if (bagiraModalHeader) {
              bagiraModalHeader.textContent = "Пожалуйста, введите ваш телефон и email для подтверждения записи.";
            }
          }
        }
      }
    });

    // Close modal event
    if (closeBagiraModalBtn) { 
      closeBagiraModalBtn.addEventListener("click", () => { 
        if (bagiraModal) bagiraModal.style.display = "none"; 
      });
    }

    // Form submission event
    if (bagiraClientForm) { 
      bagiraClientForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const phone = phoneClientInput ? phoneClientInput.value : '';
        const email = document.getElementById("emailInput") ? document.getElementById("emailInput").value : '';
        const submitButton = bagiraClientForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton ? submitButton.textContent : '';
        
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Отправка...";
        }

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
          if (bagiraModal) bagiraModal.style.display = "none";
          if (bagiraClientForm) bagiraClientForm.reset(); 
        })
        .catch(error => {
          console.error("Ошибка отправки формы Bagira AI:", error);
          alert("Что-то пошло не так. ❌\n" + (error.message || error));
          if (bagiraModal) bagiraModal.style.display = "none";
        })
        .finally(() => {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
          }
        });
      });
    }
  };
})(document, "script");

// Pilot Program Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
  const pilotModal = document.getElementById("pilotFormModal");
  const joinPilotBtn = document.getElementById("joinPilotBtnHero");
  const closePilotModalBtn = document.getElementById("closePilotModal");
  const pilotProgramForm = document.getElementById("pilotProgramForm");
  const pilotFormMessage = document.getElementById("pilotFormMessage");
  const submitPilotFormBtn = document.getElementById("submitPilotForm");

  // Open pilot modal
  if (joinPilotBtn) {
    joinPilotBtn.addEventListener("click", () => {
      if (pilotModal) { 
        pilotModal.style.display = "flex";
        if (pilotFormMessage) pilotFormMessage.style.display = "none"; 
        if (pilotProgramForm) pilotProgramForm.reset(); 
      }
    });
  }

  // Close pilot modal
  if (closePilotModalBtn) {
    closePilotModalBtn.addEventListener("click", () => {
      if (pilotModal) pilotModal.style.display = "none";
    });
  }

  // Close modals when clicking outside
  window.addEventListener("click", (event) => {
    const bagiraModalElement = document.getElementById("bagiraFormModal");
    const pilotModalElement = document.getElementById("pilotFormModal");

    if (event.target === pilotModalElement) {
      pilotModalElement.style.display = "none";
    }
    if (event.target === bagiraModalElement) { 
      bagiraModalElement.style.display = "none";
    }
  });
  
  // Pilot form submission
  if (pilotProgramForm) {
    pilotProgramForm.addEventListener("submit", function(e) {
      e.preventDefault();
      if (pilotFormMessage) pilotFormMessage.style.display = "none"; 
      if (submitPilotFormBtn) {
        submitPilotFormBtn.disabled = true;
        submitPilotFormBtn.textContent = "Отправка...";
      }

      const formData = {
        name: document.getElementById("pilotName") ? document.getElementById("pilotName").value : '',
        companyName: document.getElementById("pilotCompanyName") ? document.getElementById("pilotCompanyName").value : '',
        website: document.getElementById("pilotWebsite") ? document.getElementById("pilotWebsite").value : ''
      };

      fetch("https://primary-production-3672.up.railway.app/webhook/vapi-pilotform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      .then(response => {
        if (response.ok) {
          if (pilotFormMessage) {
            pilotFormMessage.textContent = "Спасибо! Мы скоро с вами свяжемся.";
            pilotFormMessage.className = "modal-message success"; 
          }
          if (pilotProgramForm) pilotProgramForm.reset();
        } else {
          return response.json().catch(() => ({ 
            message: response.statusText || "Неизвестная ошибка сервера"
          })).then(err => { throw err; });
        }
      })
      .catch(error => {
        console.error("Ошибка отправки пилотной формы:", error);
        let errorMessage = "Ошибка отправки. Пожалуйста, попробуйте еще раз.";
        if (error && error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        if (pilotFormMessage) {
          pilotFormMessage.textContent = "Ошибка: " + errorMessage;
          pilotFormMessage.className = "modal-message error"; 
        }
      })
      .finally(() => {
        if (submitPilotFormBtn) {
          submitPilotFormBtn.disabled = false;
          submitPilotFormBtn.textContent = "Отправить заявку";
        }
        if (pilotFormMessage) pilotFormMessage.style.display = "block"; 
      });
    });
  }
});

// Enhanced VAPI button positioning fix with multiple checks
function ensureVapiButtonPosition() {
  const vapiButton = document.querySelector('div[data-vapi]');
  if (vapiButton) {
    // Force reset all positioning
    vapiButton.style.cssText = `
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      z-index: 99999 !important;
      pointer-events: auto !important;
      transform: none !important;
      width: auto !important;
      height: auto !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    `;
    
    // Also fix any child elements
    const childElements = vapiButton.querySelectorAll('*');
    childElements.forEach(child => {
      child.style.position = 'relative';
      child.style.zIndex = '100001';
    });
    
    console.log('VAPI button positioning enforced');
    return true;
  }
  return false;
}

// Multiple timing checks for VAPI button positioning
window.addEventListener('load', function() {
  // Initial checks with different delays
  setTimeout(() => ensureVapiButtonPosition(), 1000);
  setTimeout(() => ensureVapiButtonPosition(), 2000);
  setTimeout(() => ensureVapiButtonPosition(), 3000);
  setTimeout(() => ensureVapiButtonPosition(), 5000);
});

// Monitor for VAPI button changes and re-apply positioning
const vapiObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1 && (node.hasAttribute('data-vapi') || node.querySelector('[data-vapi]'))) {
          setTimeout(() => ensureVapiButtonPosition(), 100);
        }
      });
    }
  });
});

// Start observing when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  vapiObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Ensure positioning on scroll (in case of any scroll-related issues)
let scrollTimer;
window.addEventListener('scroll', function() {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    ensureVapiButtonPosition();
  }, 100);
});

// Ensure positioning on resize
window.addEventListener('resize', function() {
  setTimeout(() => ensureVapiButtonPosition(), 100);
}); 