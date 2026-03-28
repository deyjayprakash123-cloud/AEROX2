import { setThinkingState } from '../animations/neural';
import { sendCognitiveRequest } from './personality';

export function initUIElements() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => { preloader.style.display = 'none'; }, 1000);
  }

  // Pre-load logic for custom hovering cursor
  const cursor = document.querySelector('.cursor') as HTMLElement;
  if (cursor) {
    document.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    });

    document.querySelectorAll('button, a, label, .tilt-card').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
  }

  const startChatBtn = document.getElementById('start-chat-btn');
  const chatContainer = document.querySelector('.start-chat-container') as HTMLElement;
  const chatPanel = document.getElementById('chat-panel');
  const closeChatBtn = document.getElementById('close-chat-btn');

  startChatBtn?.addEventListener('click', () => {
    chatPanel?.classList.add('open');
    if (chatContainer) chatContainer.style.display = 'none';
  });

  closeChatBtn?.addEventListener('click', () => {
    chatPanel?.classList.remove('open');
    if (chatContainer) chatContainer.style.display = 'flex';
  });

  const slider = document.getElementById('persona-slider') as HTMLInputElement;
  const personaVal = document.getElementById('persona-val') as HTMLSpanElement;

  if (slider && personaVal) {
    slider.addEventListener('input', (e: Event) => {
      personaVal.textContent = (e.target as HTMLInputElement).value;
    });
  }

  const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
  const chatInput = document.getElementById('chat-input') as HTMLInputElement;
  const fileUpload = document.getElementById('file-upload') as HTMLInputElement;

  let loadedFileText = "";

  // File Upload Logic
  fileUpload?.addEventListener('change', (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        loadedFileText = e.target?.result as string;
        chatInput.value = `[Embedded File: ${file.name}] ` + chatInput.value;
        chatInput.focus();
      };
      reader.readAsText(file);
    }
  });

  if (sendBtn && chatInput) {
    const handleDispatch = () => {
      let finalMsg = chatInput.value.trim();
      if (!finalMsg && !loadedFileText) return;
      
      // Merge File context implicitly if loaded
      const payloadMessage = loadedFileText ? `Context Object:\n${loadedFileText}\n\nUser Question:\n${finalMsg}` : finalMsg;

      loadedFileText = ""; // Clear file buffer 
      fileUpload.value = '';

      handleUserInput(payloadMessage, finalMsg, slider);
      chatInput.value = '';
    }

    sendBtn.addEventListener('click', handleDispatch);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleDispatch();
    });
  }
}

export function appendBubble(content: string | HTMLElement, type: 'user'|'ai'): HTMLDivElement {
  const chatHistory = document.getElementById('chat-history') as HTMLDivElement;
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${type}`;
  
  if (typeof content === 'string') {
    let formatted = content.replace(/\*\*\[(.*?)\]\*\*\:/g, '<strong>$1</strong>:');
    formatted = formatted.replace(/\n/g, '<br/>');
    bubble.innerHTML = formatted;
  } else {
    bubble.appendChild(content);
  }
  
  if (chatHistory) {
    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
  return bubble;
}

async function handleUserInput(payloadMessage: string, displayMessage: string, slider: HTMLInputElement) {
  const chatHistory = document.getElementById('chat-history') as HTMLDivElement;
  appendBubble(displayMessage || "Analyzing uploaded document.", 'user');
  
  setThinkingState(true);
  
  const typingBubble = document.createElement('div');
  typingBubble.className = `typing`;
  typingBubble.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div>`;
  const indicator = appendBubble(typingBubble, 'ai');

  try {
    const numPersonalities = parseInt(slider.value, 10);
    const data = await sendCognitiveRequest(payloadMessage, numPersonalities);

    chatHistory.removeChild(indicator);
    
    if (data.error) {
       appendBubble(`Error: ${data.error}`, 'ai');
    } else {
       // Convert markdown images to HTML img tags for Image Generation intent
       let cleanedAnswer = data.answer.replace(/!\[.*?\]\((.*?)\)/g, '<img src="$1" alt="AI Generated Image" />');
       appendBubble(cleanedAnswer, 'ai');
    }
  } catch (err: any) {
    if (chatHistory && indicator.parentElement === chatHistory) {
      chatHistory.removeChild(indicator);
    }
    appendBubble(`Connection interrupted. Neural pathways offline.`, 'ai');
  } finally {
    setThinkingState(false);
  }
}
