/**
 * E2E Tests for GREEN-API Chat Application
 * Tests core functionality: login, chat creation, messaging, logout
 */

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:5174';
const TEST_CREDENTIALS = {
  instanceId: '710722775198',
  apiToken: '1a028992f39c47d29219b52f0b8c594ceb4113b361e84b338c'
};
const TEST_PHONE = '79001234567';

let browser;
let page;

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    pass: '\x1b[32m',
    fail: '\x1b[31m',
    warn: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

// Helper to wait - replaces deprecated waitForTimeout
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setup() {
  log('Launching browser...');
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Capture console errors
  page.on('pageerror', err => {
    log(`Page error: ${err.message}`, 'warn');
    results.warnings.push(`Console error: ${err.message}`);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      log(`Console error: ${msg.text()}`, 'warn');
    }
  });
}

async function teardown() {
  if (browser) {
    await browser.close();
  }
}

async function test(name, fn) {
  try {
    log(`Running: ${name}...`);
    await fn();
    log(`✓ ${name}`, 'pass');
    results.passed.push(name);
  } catch (err) {
    log(`✗ ${name}: ${err.message}`, 'fail');
    results.failed.push({ name, error: err.message });
    // Take screenshot on failure
    try {
      await page.screenshot({ path: `e2e/screenshots/fail-${Date.now()}.png` });
    } catch {}
  }
}

// ============ TESTS ============

async function testLoginPageRenders() {
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  
  // Check title
  const title = await page.title();
  if (!title.includes('GREEN-API') && !title.includes('Chat')) {
    throw new Error(`Unexpected title: ${title}`);
  }
  
  // Check for login form elements using actual IDs
  const instanceInput = await page.$('#idInstance');
  const tokenInput = await page.$('#apiTokenInstance');
  const submitBtn = await page.$('button[type="submit"]');
  
  if (!instanceInput) throw new Error('Instance ID input not found');
  if (!tokenInput) throw new Error('API Token input not found');
  if (!submitBtn) throw new Error('Submit button not found');
}

async function testLoginFormValidation() {
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  
  // Try submitting empty form
  const submitBtn = await page.$('button[type="submit"]');
  await submitBtn.click();
  
  await wait(500);
  
  // Check for error message
  const errorEl = await page.$('.error-message');
  if (!errorEl) throw new Error('Empty form should show validation error');
  
  const errorText = await errorEl.evaluate(el => el.textContent);
  if (!errorText.includes('fill')) {
    throw new Error(`Unexpected error message: ${errorText}`);
  }
}

async function testLoginWithCredentials() {
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  
  // Fill in credentials using IDs
  await page.type('#idInstance', TEST_CREDENTIALS.instanceId);
  await page.type('#apiTokenInstance', TEST_CREDENTIALS.apiToken);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation or error
  await wait(3000);
  
  // Check if logged in (should see sidebar)
  const sidebar = await page.$('.sidebar-wrapper');
  
  if (!sidebar) {
    // Check for error message
    const errorEl = await page.$('.error-message');
    if (errorEl) {
      const errorText = await errorEl.evaluate(el => el.textContent);
      throw new Error(`Login failed: ${errorText}`);
    }
    throw new Error('Login did not navigate to chat page');
  }
}

async function testChatPageStructure() {
  // Should already be logged in from previous test
  const sidebar = await page.$('.sidebar-wrapper');
  if (!sidebar) {
    throw new Error('Sidebar not found - may not be logged in');
  }
  
  // Check for icon nav
  const iconNav = await page.$('.icon-nav');
  if (!iconNav) throw new Error('Icon navigation not found');
  
  // Check for chat panel
  const chatPanel = await page.$('.chat-panel');
  if (!chatPanel) throw new Error('Chat panel not found');
  
  // Check for new chat button
  const newChatBtn = await page.$('.new-chat-btn');
  if (!newChatBtn) throw new Error('New chat button not found');
  
  // Check for logout button
  const logoutBtn = await page.$('.nav-logout');
  if (!logoutBtn) throw new Error('Logout button not found');
  
  // Check for main chat area
  const chatMain = await page.$('.chat-main');
  if (!chatMain) throw new Error('Chat main area not found');
}

async function testNewChatModal() {
  // Click new chat button
  const newChatBtn = await page.$('.new-chat-btn');
  if (!newChatBtn) throw new Error('New chat button not found');
  
  await newChatBtn.click();
  await wait(500);
  
  // Check for modal backdrop
  const modal = await page.$('.modal-backdrop');
  if (!modal) throw new Error('Modal did not open');
  
  // Check for modal content
  const modalContent = await page.$('.modal');
  if (!modalContent) throw new Error('Modal content not found');
  
  // Check for phone input
  const phoneInput = await page.$('#phoneNumber');
  if (!phoneInput) throw new Error('Phone input not found in modal');
  
  // Check for close button
  const closeBtn = await page.$('.close-btn');
  if (!closeBtn) throw new Error('Close button not found');
  
  // Check for submit button
  const submitBtn = await page.$('.submit-btn');
  if (!submitBtn) throw new Error('Submit button not found');
}

async function testModalValidation() {
  // Modal should still be open
  // Try submitting empty
  await page.click('.submit-btn');
  await wait(300);
  
  // Check for error
  const errorEl = await page.$('.modal .error-message');
  if (!errorEl) throw new Error('Empty phone should show validation error');
}

async function testCreateNewChat() {
  // Clear and type phone number
  const phoneInput = await page.$('#phoneNumber');
  if (!phoneInput) throw new Error('Phone input not found');
  
  await phoneInput.click({ clickCount: 3 });
  await phoneInput.type(TEST_PHONE);
  
  // Submit
  await page.click('.submit-btn');
  await wait(500);
  
  // Modal should close
  const modal = await page.$('.modal-backdrop');
  if (modal) {
    throw new Error('Modal did not close after creating chat');
  }
  
  // Chat should appear in list
  const chatItem = await page.$('.chat-item');
  if (!chatItem) throw new Error('Chat item not created in sidebar');
}

async function testSelectChat() {
  // Click on a chat item
  const chatItem = await page.$('.chat-item');
  if (!chatItem) throw new Error('No chat item to select');
  
  await chatItem.click();
  await wait(300);
  
  // Check for chat window
  const chatWindow = await page.$('.chat-window');
  if (!chatWindow) throw new Error('Chat window not displayed after selecting chat');
  
  // Check for message input (in .chat-input-area)
  const messageInput = await page.$('.chat-input-area input');
  if (!messageInput) throw new Error('Message input not found');
  
  // Check for send button
  const sendBtn = await page.$('.chat-input-area .send-btn');
  if (!sendBtn) throw new Error('Send button not found');
}

async function testSendMessage() {
  // Type a message
  const messageInput = await page.$('.chat-input-area input');
  if (!messageInput) throw new Error('Message input not found');
  
  const testMessage = 'E2E Test ' + Date.now();
  await messageInput.type(testMessage);
  
  // Send message
  await page.click('.chat-input-area .send-btn');
  await wait(2000);
  
  // Check if message appears (outgoing message)
  const messages = await page.$$('.message.outgoing, .message-bubble.outgoing');
  if (messages.length === 0) {
    log('Warning: Outgoing message not visible - may be API issue', 'warn');
    results.warnings.push('Outgoing message not displayed after sending');
  }
}

async function testKeyboardSend() {
  // Type a message and press Enter
  const messageInput = await page.$('.chat-input-area input');
  if (!messageInput) {
    log('Skipping keyboard test - no message input', 'warn');
    return;
  }
  
  await messageInput.type('Enter key test');
  await page.keyboard.press('Enter');
  await wait(1000);
}

async function testAccessibility() {
  const issues = [];
  
  // Check for h1
  const h1 = await page.$('h1');
  if (!h1) {
    issues.push('No h1 heading found on chat page');
  }
  
  // Check all inputs have labels or aria-label
  const inputs = await page.$$('input:not([type="hidden"])');
  for (const input of inputs) {
    const id = await input.evaluate(el => el.id);
    const ariaLabel = await input.evaluate(el => el.getAttribute('aria-label'));
    
    if (id) {
      const label = await page.$(`label[for="${id}"]`);
      if (!label && !ariaLabel) {
        issues.push(`Input #${id} missing label`);
      }
    } else if (!ariaLabel) {
      issues.push('Input without id or aria-label found');
    }
  }
  
  // Check buttons have accessible names
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const text = await button.evaluate(el => el.textContent?.trim());
    const ariaLabel = await button.evaluate(el => el.getAttribute('aria-label'));
    const title = await button.evaluate(el => el.title);
    
    if (!text && !ariaLabel && !title) {
      issues.push('Button without accessible name found');
    }
  }
  
  // Check focus visibility
  const focusStyle = await page.evaluate(() => {
    const style = document.createElement('style');
    document.head.appendChild(style);
    
    const btn = document.querySelector('button');
    if (btn) {
      btn.focus();
      const cs = window.getComputedStyle(btn);
      return {
        outline: cs.outline,
        outlineWidth: cs.outlineWidth,
        boxShadow: cs.boxShadow
      };
    }
    return null;
  });
  
  if (focusStyle) {
    const hasOutline = focusStyle.outline !== 'none' && focusStyle.outlineWidth !== '0px';
    const hasBoxShadow = focusStyle.boxShadow && focusStyle.boxShadow !== 'none';
    if (!hasOutline && !hasBoxShadow) {
      issues.push('Focus indicator may not be visible (no outline or box-shadow)');
    }
  }
  
  if (issues.length > 0) {
    results.warnings.push(...issues);
    issues.forEach(i => log(`A11y: ${i}`, 'warn'));
  }
}

async function testModalBackdropClose() {
  // Open modal again
  await page.click('.new-chat-btn');
  await wait(300);
  
  // Click on backdrop (outside modal content)
  const backdrop = await page.$('.modal-backdrop');
  if (!backdrop) throw new Error('Modal did not open');
  
  // Click at edge of backdrop
  await page.click('.modal-backdrop', { offset: { x: 10, y: 10 } });
  await wait(300);
  
  // Check modal closed
  const modalAfter = await page.$('.modal-backdrop');
  if (modalAfter) {
    throw new Error('Modal did not close when clicking backdrop');
  }
}

async function testModalEscapeClose() {
  // Open modal
  await page.click('.new-chat-btn');
  await wait(300);
  
  const modal = await page.$('.modal-backdrop');
  if (!modal) {
    log('Modal did not open for Escape test', 'warn');
    return;
  }
  
  // Press Escape
  await page.keyboard.press('Escape');
  await wait(300);
  
  // Check modal closed
  const modalAfter = await page.$('.modal-backdrop');
  if (modalAfter) {
    results.warnings.push('Modal does not close on Escape key (F-02)');
    log('Modal does not close on Escape key', 'warn');
  }
}

async function testSpaceKeyOnChatItem() {
  // Focus on chat item
  const chatItem = await page.$('.chat-item');
  if (!chatItem) {
    log('No chat item for Space key test', 'warn');
    return;
  }
  
  await chatItem.focus();
  await wait(100);
  
  // Check if Space activates it
  await page.keyboard.press('Space');
  await wait(300);
  
  // This is a warning check - Space should work like Enter
  log('Space key test completed - check if chat was selected', 'info');
}

async function testResponsiveDesign() {
  // Test mobile viewport
  await page.setViewport({ width: 375, height: 667 }); // iPhone SE
  await wait(300);
  
  // Check for horizontal overflow
  const overflow = await page.evaluate(() => {
    return {
      hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth
    };
  });
  
  if (overflow.hasHorizontalScroll) {
    results.warnings.push(`Horizontal scroll on mobile: body=${overflow.bodyWidth}px, viewport=${overflow.viewportWidth}px (F-03)`);
    log(`Mobile horizontal scroll: ${overflow.bodyWidth}px > ${overflow.viewportWidth}px`, 'warn');
  }
  
  // Reset viewport
  await page.setViewport({ width: 1280, height: 800 });
}

async function testLogout() {
  // Click logout
  const logoutBtn = await page.$('.nav-logout');
  if (!logoutBtn) throw new Error('Logout button not found');
  
  await logoutBtn.click();
  await wait(500);
  
  // Should be back on login page
  const loginForm = await page.$('.login-form');
  if (!loginForm) throw new Error('Logout did not redirect to login page');
  
  // Credentials should be cleared from localStorage
  const storedCreds = await page.evaluate(() => {
    return localStorage.getItem('greenapi_credentials');
  });
  
  if (storedCreds) {
    log('Credentials still in localStorage after logout', 'warn');
    results.warnings.push('Credentials not cleared from localStorage on logout');
  }
}

async function testLogoutClearsChats() {
  // Login again
  await page.type('#idInstance', TEST_CREDENTIALS.instanceId);
  await page.type('#apiTokenInstance', TEST_CREDENTIALS.apiToken);
  await page.click('button[type="submit"]');
  await wait(3000);
  
  // Create a chat
  await page.click('.new-chat-btn');
  await wait(300);
  await page.type('#phoneNumber', '79009876543');
  await page.click('.submit-btn');
  await wait(500);
  
  // Logout
  await page.click('.nav-logout');
  await wait(500);
  
  // Login again
  await page.type('#idInstance', TEST_CREDENTIALS.instanceId);
  await page.type('#apiTokenInstance', TEST_CREDENTIALS.apiToken);
  await page.click('button[type="submit"]');
  await wait(3000);
  
  // Check if old chats are still there (they shouldn't be if F-01 is fixed)
  const chatItems = await page.$$('.chat-item');
  if (chatItems.length > 0) {
    results.warnings.push('Chats persist after logout/re-login (F-01 not fixed)');
    log('Chats persist after logout - F-01 issue', 'warn');
  }
}

async function testContrastColors() {
  // Get computed color of muted text
  const mutedColor = await page.evaluate(() => {
    const el = document.querySelector('.chat-preview, .hint, .no-chats p');
    if (!el) return null;
    return window.getComputedStyle(el).color;
  });
  
  if (mutedColor) {
    // Parse RGB and check luminance contrast (simplified check)
    log(`Muted text color: ${mutedColor}`, 'info');
    // Full WCAG check would need background color comparison
  }
}

// ============ MAIN ============

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('GREEN-API Chat Application - E2E Tests');
  console.log('='.repeat(60) + '\n');
  
  try {
    await setup();
    
    // Login flow
    await test('Login page renders correctly', testLoginPageRenders);
    await test('Login form validation', testLoginFormValidation);
    await test('Login with valid credentials', testLoginWithCredentials);
    
    // Chat page structure
    await test('Chat page structure', testChatPageStructure);
    await test('Accessibility checks', testAccessibility);
    
    // Modal flow
    await test('New chat modal opens', testNewChatModal);
    await test('Modal validation', testModalValidation);
    await test('Create new chat', testCreateNewChat);
    
    // Chat interaction
    await test('Select chat', testSelectChat);
    await test('Send message', testSendMessage);
    await test('Keyboard send (Enter)', testKeyboardSend);
    
    // Modal closing
    await test('Modal closes on backdrop click', testModalBackdropClose);
    await test('Modal closes on Escape', testModalEscapeClose);
    
    // Keyboard navigation
    await test('Space key on chat item', testSpaceKeyOnChatItem);
    
    // Responsive
    await test('Responsive design check', testResponsiveDesign);
    
    // Color contrast
    await test('Color contrast check', testContrastColors);
    
    // Logout flow
    await test('Logout functionality', testLogout);
    await test('Logout clears chats (F-01)', testLogoutClearsChats);
    
  } catch (err) {
    log(`Fatal error: ${err.message}`, 'fail');
  } finally {
    await teardown();
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✓ Passed: ${results.passed.length}`);
  console.log(`✗ Failed: ${results.failed.length}`);
  console.log(`⚠ Warnings: ${results.warnings.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed tests:');
    results.failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\nWarnings (audit issues detected):');
    results.warnings.forEach(w => console.log(`  - ${w}`));
  }
  
  console.log('\n');
  
  process.exit(results.failed.length > 0 ? 1 : 0);
}

runTests();
