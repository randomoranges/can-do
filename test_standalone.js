// Simple test to verify STANDALONE_MODE functionality
const puppeteer = require('puppeteer');

async function testStandaloneMode() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Check if login screen is displayed
    const loginScreen = await page.$('[data-testid="login-screen"]');
    if (!loginScreen) {
      throw new Error('Login screen not found');
    }
    
    // Check if Google login button is disabled (should be in standalone mode)
    const googleBtn = await page.$('[data-testid="google-login-btn-disabled"]');
    if (!googleBtn) {
      throw new Error('Google login button should be disabled in standalone mode');
    }
    
    // Check if "Get Started" button exists (should be "Get Started" in standalone mode)
    const guestBtn = await page.$('[data-testid="guest-mode-btn"]');
    const guestBtnText = await page.evaluate(el => el.textContent, guestBtn);
    if (!guestBtnText.includes('Get Started')) {
      throw new Error('Guest button should say "Get Started" in standalone mode');
    }
    
    // Click guest mode button
    await guestBtn.click();
    
    // Wait for landing screen
    await page.waitForSelector('[data-testid="landing-screen"]', { timeout: 5000 });
    
    // Click personal profile
    await page.click('[data-testid="profile-personal-btn"]');
    
    // Wait for profile screen
    await page.waitForSelector('[data-testid="profile-screen"]', { timeout: 5000 });
    
    // Click on today section
    await page.click('[data-testid="section-card-today"]');
    
    // Wait for section screen
    await page.waitForSelector('[data-testid="section-screen-today"]', { timeout: 5000 });
    
    // Click add task button
    await page.click('[data-testid="section-add-fab"]');
    
    // Wait for add task input
    await page.waitForSelector('[data-testid="add-task-input"]', { timeout: 5000 });
    
    // Type a task
    await page.type('[data-testid="add-task-input"]', 'Test task in standalone mode');
    
    // Click add button
    await page.click('[data-testid="add-task-submit-btn"]');
    
    // Wait for task to appear
    await page.waitForSelector('[data-testid^="task-item-"]', { timeout: 5000 });
    
    console.log('✅ STANDALONE_MODE test passed! All functionality working correctly.');
    
  } catch (error) {
    console.error('❌ STANDALONE_MODE test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testStandaloneMode().catch(console.error);