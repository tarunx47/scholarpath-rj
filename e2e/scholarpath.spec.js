import { test, expect } from '@playwright/test';

const DASHBOARD_HEADING = 'Your scholarships';

async function chooseRohit(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try as Rohit', exact: true }).click();
  await expect(page.getByRole('heading', { name: DASHBOARD_HEADING, exact: true })).toBeVisible();
}

// Card <li> that contains the scheme's <h2> name.
function cardFor(page, name) {
  return page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name, exact: true }),
  });
}

async function firstCardName(page) {
  return (await page.getByRole('heading', { level: 2 }).first().innerText()).trim();
}

test.describe('ScholarPath browser flows', () => {
  test('Dashboard: tabs, save and mark as applied', async ({ page }) => {
    await chooseRohit(page);

    await expect(page.getByRole('tab', { name: 'Recommended', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Saved', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Applied', exact: true })).toBeVisible();

    const name = await firstCardName(page);
    const card = cardFor(page, name);

    // Save first card
    await card.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(card.getByRole('button', { name: 'Saved', exact: true })).toHaveAttribute('aria-pressed', 'true');

    // Saved tab shows it
    await page.getByRole('tab', { name: 'Saved', exact: true }).click();
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();

    // Recommended tab: mark first card as applied
    await page.getByRole('tab', { name: 'Recommended', exact: true }).click();
    await cardFor(page, name).getByRole('button', { name: 'Mark as applied', exact: true }).click();

    // Applied tab shows it
    await page.getByRole('tab', { name: 'Applied', exact: true }).click();
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  });

  test('Scheme Details: open from Dashboard and go back', async ({ page }) => {
    await chooseRohit(page);

    const name = await firstCardName(page);
    await cardFor(page, name).getByRole('button', { name: 'View details', exact: true }).click();

    await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
    await expect(page.getByText('Eligibility not yet verified', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('No verified eligibility criteria published yet.', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Missing information', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Back to results', exact: true }).click();
    await expect(page.getByRole('heading', { name: DASHBOARD_HEADING, exact: true })).toBeVisible();
  });

  test('Profile: edit, see eligibility, and form Back', async ({ page }) => {
    await chooseRohit(page);

    await page.getByRole('button', { name: 'Edit profile', exact: true }).click();

    await expect(page.getByLabel('State')).toHaveValue('Rajasthan');
    const income = page.getByLabel('Annual family income (optional)');
    await expect(income).toHaveValue('150000');

    await income.fill('300000');
    await page.getByRole('button', { name: 'See eligibility', exact: true }).click();

    await expect(page.getByRole('heading', { name: DASHBOARD_HEADING, exact: true })).toBeVisible();

    const storedIncome = await page.evaluate(
      () => JSON.parse(sessionStorage.getItem('scholarpath.profile')).annual_family_income,
    );
    expect(storedIncome).toBe(300000);

    // Re-open the form and press its Back button; expected to return to Dashboard.
    await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.getByRole('heading', { name: DASHBOARD_HEADING, exact: true })).toBeVisible();
  });

  test('Persistence: saved and applied survive reload and re-entry', async ({ page }) => {
    await chooseRohit(page);

    const savedName = await firstCardName(page);
    await cardFor(page, savedName).getByRole('button', { name: 'Save', exact: true }).click();

    // Mark a different card (second one) as applied.
    const appliedName = (await page.getByRole('heading', { level: 2 }).nth(1).innerText()).trim();
    await cardFor(page, appliedName).getByRole('button', { name: 'Mark as applied', exact: true }).click();

    const before = await page.evaluate(() => ({
      saved: JSON.parse(sessionStorage.getItem('scholarpath.saved')),
      applied: JSON.parse(sessionStorage.getItem('scholarpath.applied')),
    }));
    expect(before.saved.length).toBeGreaterThan(0);
    expect(before.applied.length).toBeGreaterThan(0);

    await page.reload();

    const after = await page.evaluate(() => ({
      saved: JSON.parse(sessionStorage.getItem('scholarpath.saved')),
      applied: JSON.parse(sessionStorage.getItem('scholarpath.applied')),
    }));
    expect(after.saved).toEqual(before.saved);
    expect(after.applied).toEqual(before.applied);

    // Re-enter via Home and check the Saved tab.
    await page.getByRole('button', { name: 'Try as Rohit', exact: true }).click();
    await expect(page.getByRole('heading', { name: DASHBOARD_HEADING, exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'Saved', exact: true }).click();
    await expect(page.getByRole('heading', { name: savedName, exact: true })).toBeVisible();
  });
});
