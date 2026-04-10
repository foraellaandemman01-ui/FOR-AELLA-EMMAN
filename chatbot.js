// =====================================================
// AELLA & EMMAN AI ASSISTANT
// =====================================================
// API key is safely stored in Cloudflare Worker (not here!)
// Change the WORKER_URL below to your Cloudflare Worker URL
// =====================================================

const WORKER_URL = 'https://aella-emman-chat.YOUR-SUBDOMAIN.workers.dev'; // ← Change this after deploying your Worker
const AI_MODEL = 'google/gemini-3-flash-preview';

// =====================================================
// BUSINESS KNOWLEDGE BASE
// =====================================================
const BUSINESS_KNOWLEDGE = `
You are the friendly AI assistant for "Aella & Emman Advertising" (also known as "For Aella & Emman"), a premium signage and printing business in Maramag, Bukidnon, Philippines.

## Business Information
- **Business Name:** Aella & Emman Advertising
- **Location:** North Poblacion, Maramag, Bukidnon, Philippines
- **Plus Code:** Q2F5+442, Maramag, Bukidnon
- **Phone:** 09551932115
- **Email:** foraellaandemman01@gmail.com
- **Operating Hours:** Monday to Saturday, 8:00 AM – 5:00 PM
- **Area Served:** Maramag, Bukidnon, and surrounding areas in Mindanao

## Services Offered

### 1. Signage Making
- Custom business signs and storefront signage
- Backlit LED signs and channel letters
- 3D lettering and acrylic build-ups
- Neon-style signs and illuminated displays
- Monument signs with stainless steel or metal finishes
- Indoor and outdoor commercial signage
- Wall-mounted and pylon signs

### 2. T-Shirt Printing
- Vinyl heat transfer printing
- Digital transfer printing
- Sublimation printing (full-color, all-over prints)
- Corporate uniforms and branded workwear
- Event merchandise and giveaway shirts
- Personal custom apparel
- Bulk orders available with volume discounts

### 3. Tarpaulin Printing
- Large-format banner printing (any custom size)
- Weather-resistant outdoor banners and streamers
- Event backdrops, stage banners, and photo walls
- Promotional tarpaulins for businesses
- UV-resistant inks for long outdoor life
- Birthday, wedding, fiesta, and barangay event tarps
- Fast turnaround available

## Notable Completed Projects
- **Quezon Hawkers Hub** — Illuminated commercial storefront signage with LED backlighting
- **Lambo Monument** — Stainless steel mirror-finish 3D lettering with thumbs-up sculpture
- **The Margarette Business Hotel** — Premium halo-lit channel letter signage
- **Knights of Columbus (K of C)** — Illuminated emblem/crest signage with multi-color LED
- **Julie's Bakeshop** — Full storefront signage system with 3D corner cube unit

## How to Order
1. Contact us via phone (09551932115) or email (foraellaandemman01@gmail.com)
2. Describe your project or send a reference design
3. We will provide a free quotation
4. Upon approval, we start production
5. Installation/delivery arranged upon completion

## Response Guidelines
- Be helpful, warm, and professional
- Keep responses concise — 2-3 sentences when a short answer works, but give detail when asked
- If asked about specific pricing, explain that it varies by size, materials, and design complexity, then encourage them to get a free quote
- Always offer the contact info: call 09551932115 or email foraellaandemman01@gmail.com
- If someone asks something unrelated to the business, politely say you're here to help with signage and printing inquiries
- Match the language the customer uses — if they speak Tagalog or Bisaya, respond in that language
- Be proud of the work — mention completed projects when relevant
- Use a friendly, approachable tone (not overly formal)
`;

// =====================================================
// CHAT STATE
// =====================================================
let chatHistory = [];
let isTyping = false;

// =====================================================
// BUILD CHAT WIDGET UI
// =====================================================
function initChatbot() {
    const widget = document.createElement('div');
    widget.id = 'chatbot-widget';
    widget.innerHTML = `
        <button id="chatbot-toggle" aria-label="Open AI Assistant">
            <i class="fas fa-comment-dots" id="chatbot-icon-open"></i>
            <i class="fas fa-times" id="chatbot-icon-close" style="display:none"></i>
            <span id="chatbot-pulse"></span>
        </button>

        <div id="chatbot-window">
            <div id="chatbot-header">
                <div id="chatbot-header-info">
                    <div id="chatbot-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div>
                        <div id="chatbot-header-title">Aella & Emman AI</div>
                        <div id="chatbot-header-status">
                            <span id="chatbot-status-dot"></span>
                            Online
                        </div>
                    </div>
                </div>
                <button id="chatbot-close" aria-label="Close chat">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>

            <div id="chatbot-messages">
                <div class="chatbot-msg bot">
                    <div class="chatbot-msg-bubble">
                        Kumusta! 👋 I'm the Aella & Emman AI assistant. Ask me about our signage, t-shirt printing, tarpaulin services, or anything about our business!
                    </div>
                </div>
                <div id="chatbot-suggestions">
                    <button class="chatbot-chip" onclick="sendSuggestion(this)">What services do you offer?</button>
                    <button class="chatbot-chip" onclick="sendSuggestion(this)">How can I get a quote?</button>
                    <button class="chatbot-chip" onclick="sendSuggestion(this)">Where are you located?</button>
                    <button class="chatbot-chip" onclick="sendSuggestion(this)">Show me your past projects</button>
                </div>
            </div>

            <div id="chatbot-input-area">
                <input type="text" id="chatbot-input" placeholder="Type your message..." autocomplete="off">
                <button id="chatbot-send" aria-label="Send message">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    document.getElementById('chatbot-toggle').addEventListener('click', toggleChat);
    document.getElementById('chatbot-close').addEventListener('click', toggleChat);
    document.getElementById('chatbot-send').addEventListener('click', handleSend);
    document.getElementById('chatbot-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
}

// =====================================================
// CHAT TOGGLE
// =====================================================
function toggleChat() {
    const window_ = document.getElementById('chatbot-window');
    const iconOpen = document.getElementById('chatbot-icon-open');
    const iconClose = document.getElementById('chatbot-icon-close');
    const pulse = document.getElementById('chatbot-pulse');
    const isOpen = window_.classList.contains('open');

    if (isOpen) {
        window_.classList.remove('open');
        iconOpen.style.display = '';
        iconClose.style.display = 'none';
    } else {
        window_.classList.add('open');
        iconOpen.style.display = 'none';
        iconClose.style.display = '';
        if (pulse) pulse.remove();
        document.getElementById('chatbot-input').focus();
    }
}

// =====================================================
// SEND MESSAGE
// =====================================================
function sendSuggestion(btn) {
    const text = btn.textContent;
    const suggestions = document.getElementById('chatbot-suggestions');
    if (suggestions) suggestions.remove();
    sendMessage(text);
}

function handleSend() {
    const input = document.getElementById('chatbot-input');
    const text = input.value.trim();
    if (!text || isTyping) return;
    input.value = '';

    const suggestions = document.getElementById('chatbot-suggestions');
    if (suggestions) suggestions.remove();

    sendMessage(text);
}

async function sendMessage(text) {
    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });
    showTyping();

    try {
        // Call YOUR Cloudflare Worker (not OpenRouter directly)
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: BUSINESS_KNOWLEDGE },
                    ...chatHistory
                ],
                max_tokens: 400,
                temperature: 0.7,
            })
        });

        const data = await response.json();
        hideTyping();

        if (data.error) {
            console.error('API Error:', data.error);
            appendMessage('bot', `⚠️ ${data.error.message || 'Something went wrong'}. Contact us at **09551932115**.`);
            return;
        }

        const reply = data.choices?.[0]?.message?.content
            || "Sorry, I couldn't process that. Please contact us at 09551932115!";

        chatHistory.push({ role: 'assistant', content: reply });
        appendMessage('bot', reply);

    } catch (error) {
        hideTyping();
        console.error('Network Error:', error);
        appendMessage('bot', 'Connection issue. Please call us at **09551932115** or email **foraellaandemman01@gmail.com**!');
    }
}

// =====================================================
// UI HELPERS
// =====================================================
function appendMessage(sender, text) {
    const container = document.getElementById('chatbot-messages');
    const msg = document.createElement('div');
    msg.className = `chatbot-msg ${sender}`;

    const formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    msg.innerHTML = `<div class="chatbot-msg-bubble">${formatted}</div>`;
    container.appendChild(msg);
    requestAnimationFrame(() => msg.classList.add('visible'));
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    isTyping = true;
    const container = document.getElementById('chatbot-messages');
    const typing = document.createElement('div');
    typing.className = 'chatbot-msg bot chatbot-typing';
    typing.id = 'chatbot-typing-indicator';
    typing.innerHTML = `
        <div class="chatbot-msg-bubble">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    container.appendChild(typing);
    requestAnimationFrame(() => typing.classList.add('visible'));
    container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    isTyping = false;
    const typing = document.getElementById('chatbot-typing-indicator');
    if (typing) typing.remove();
}

// =====================================================
// INITIALIZE ON DOM READY
// =====================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}
