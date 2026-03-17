import { test, expect } from '@playwright/test'

const MOCK_TEST_CASE = {
  test_name: 'get_users_happy_path',
  description: 'Verifies GET /users returns 200 with a list of users',
  test_type: 'happy_path',
  priority: 'high',
  code: "def test_get_users():\n    response = requests.get('/users')\n    assert response.status_code == 200",
}

const MOCK_RESPONSE = {
  endpoint_count: 1,
  test_cases: [MOCK_TEST_CASE],
  framework: 'pytest',
  generation_time_seconds: 1.23,
}

test.beforeEach(async ({ context }) => {
  // Grant permissions for clipboard access
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
})

test('1. Page loads with correct initial state', async ({ page }) => {
  await page.goto('/')

  // Check header is visible
  const header = page.locator('header')
  await expect(header).toBeVisible()

  // Check textarea has placeholder text
  const textarea = page.locator('textarea')
  await expect(textarea).toHaveAttribute('placeholder', /spec|content/i)

  // Check button is disabled
  const button = page.locator('button:has-text("Generate")')
  await expect(button).toBeDisabled()
})

test('2. Button enables when textarea has content', async ({ page }) => {
  await page.goto('/')

  const textarea = page.locator('textarea')
  const button = page.locator('button:has-text("Generate")')

  // Initially disabled
  await expect(button).toBeDisabled()

  // Fill textarea
  await textarea.fill('{"openapi": "3.0.0"}')

  // Button should now be enabled
  await expect(button).toBeEnabled()
})

test('3. Clicking Generate shows loading state', async ({ page }) => {
  // Delay response long enough to observe loading state, then fulfill cleanly
  await page.route('http://localhost:8000/generate', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 30_000))
    await route.fulfill({ status: 200, body: '{}' })
  })

  await page.goto('/')

  const textarea = page.locator('textarea')
  await textarea.fill('{"openapi": "3.0.0"}')
  await page.locator('button:has-text("Generate Test Cases")').click()

  // Loading state element appears while request is in flight
  await expect(page.locator('[data-testid="loading-state"]')).toBeVisible()
})

test('4. Successful response renders cards', async ({ page }) => {
  await page.route('http://localhost:8000/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RESPONSE),
    })
  })

  await page.goto('/')

  const textarea = page.locator('textarea')
  const button = page.locator('button:has-text("Generate")')

  await textarea.fill('{"openapi": "3.0.0"}')
  await button.click()

  // Wait for test card to appear
  const testCard = page.locator('h3:has-text("get_users_happy_path")')
  await expect(testCard).toBeVisible()

  // Check priority badge
  const priorityBadge = page.locator('span:has-text("high")')
  await expect(priorityBadge).toBeVisible()

  // Check test_type badge
  const typeBadge = page.locator('span:has-text("happy_path")')
  await expect(typeBadge).toBeVisible()

  // Check code block
  const codeBlock = page.locator('code').first()
  await expect(codeBlock).toContainText('test_get_users')

  // Check stats line (scoped to right panel to avoid matching the Framework label)
  const statsLine = page.locator('[data-testid="right-panel"] span:has-text("endpoints")')
  await expect(statsLine).toBeVisible()
})

test('5. Error response shows banner', async ({ page }) => {
  await page.route('http://localhost:8000/generate', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Invalid OpenAPI spec format' }),
    })
  })

  await page.goto('/')

  const textarea = page.locator('textarea')
  const button = page.locator('button:has-text("Generate")')

  await textarea.fill('invalid spec')
  await button.click()

  // Check error banner appears (red background)
  const errorBanner = page.locator('[role="alert"]')
  await expect(errorBanner).toBeVisible()

  // Check error detail text is shown
  await expect(page.locator('body')).toContainText(/invalid|error|detail/i)
})

test('6. Error banner can be dismissed', async ({ page }) => {
  await page.route('http://localhost:8000/generate', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Invalid spec' }),
    })
  })

  await page.goto('/')

  const textarea = page.locator('textarea')
  const button = page.locator('button:has-text("Generate")')

  await textarea.fill('invalid')
  await button.click()

  // Error banner appears
  const errorBanner = page.locator('[role="alert"]')
  await expect(errorBanner).toBeVisible()

  // Click dismiss button (close button, marked with ×)
  const dismissButton = errorBanner.locator('button, [class*="close"], svg').first()
  await dismissButton.click()

  // Banner should disappear
  await expect(errorBanner).not.toBeVisible()
})

test('7. Framework select changes value', async ({ page }) => {
  await page.goto('/')

  // Framework select is the second select element
  const frameworkSelect = page.locator('select').nth(1)

  // Default value should be pytest
  await expect(frameworkSelect).toHaveValue('pytest')

  // Change to jest
  await frameworkSelect.selectOption('jest')
  await expect(frameworkSelect).toHaveValue('jest')

  // Change to playwright
  await frameworkSelect.selectOption('playwright')
  await expect(frameworkSelect).toHaveValue('playwright')

  // Change back to cypress
  await frameworkSelect.selectOption('cypress')
  await expect(frameworkSelect).toHaveValue('cypress')
})

test('8. Format select changes value', async ({ page }) => {
  await page.goto('/')

  // Format select is the first select element
  const formatSelect = page.locator('select').first()

  // Default value should be json
  await expect(formatSelect).toHaveValue('json')

  // Change to yaml
  await formatSelect.selectOption('yaml')
  await expect(formatSelect).toHaveValue('yaml')

  // Change back to json
  await formatSelect.selectOption('json')
  await expect(formatSelect).toHaveValue('json')
})

test('9. Copy button copies code to clipboard', async ({ page, context }) => {
  await page.route('http://localhost:8000/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RESPONSE),
    })
  })

  await page.goto('/')

  const textarea = page.locator('textarea')
  const button = page.locator('button:has-text("Generate")')

  await textarea.fill('{"openapi": "3.0.0"}')
  await button.click()

  // Wait for test card to appear
  const testCard = page.locator('[data-testid="test-card"]').first()
  await expect(testCard).toBeVisible()

  // Hover over the card to show copy button
  await testCard.hover()

  // Click copy button
  const copyButton = testCard.locator('button:has-text("Copy"), button:has-text("copy"), [class*="copy"]').first()
  await expect(copyButton).toBeVisible()
  await copyButton.click()

  // Verify clipboard content
  const clipboardText = await page.evaluate(() => {
    return navigator.clipboard.readText()
  })
  expect(clipboardText).toContain('test_get_users')

  // Check for "✓ Copied!" or similar confirmation
  const copiedIndicator = testCard.locator('text=/copied|✓/i')
  await expect(copiedIndicator).toBeVisible({ timeout: 2000 })
})
