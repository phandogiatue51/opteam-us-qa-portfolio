import { test, expect } from '@playwright/test';

test('Full flow: Register, Login, Create Workspace, Project, Task and move through Kanban columns', async ({ page }) => {
  const timestamp = Date.now();
  const testUser = {
    firstName: 'QA',
    lastName: 'Tester',
    email: `qa_user_${timestamp}@example.com`,
    password: 'Password123!',
  };
  const workspaceName = `Workspace ${timestamp}`;
  const projectName = `Project ${timestamp}`;
  const taskTitle = `E2E Task ${timestamp}`;

  // Helper for clicking with a 1-second duration/delay
  const clickWithDelay = async (locator: { click: () => Promise<void> }) => {
    await page.waitForTimeout(1000);
    await locator.click();
  };

  // 1. Go to http://localhost:3000
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/OpTeamUs/i);

  // 2. Register a new user via the UI
  await clickWithDelay(page.getByRole('link', { name: 'Sign up' }).first());
  await expect(page).toHaveURL(/.*register/);

  await page.getByLabel('First Name').fill(testUser.firstName);
  await page.getByLabel('Last Name').fill(testUser.lastName);
  await page.getByLabel('Email').fill(testUser.email);
  await page.getByLabel('Password').fill(testUser.password);
  await clickWithDelay(page.getByRole('button', { name: 'Create Account' }));

  // 3. Log in via the UI
  await expect(page).toHaveURL(/.*login/);
  await page.getByLabel('Email').fill(testUser.email);
  await page.getByLabel('Password').fill(testUser.password);
  await clickWithDelay(page.getByRole('button', { name: 'Sign in' }));

  // Verify dashboard navigation
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // 4. Create a Workspace
  await clickWithDelay(page.getByRole('button', { name: 'New Workspace' }));
  await page.getByPlaceholder('My Workspace').fill(workspaceName);
  await page.getByPlaceholder('Optional description').fill('E2E automated test workspace');
  await clickWithDelay(page.getByRole('button', { name: 'Create Workspace' }));

  // Assert workspace card is created and visible
  const workspaceCard = page.getByText(workspaceName);
  await expect(workspaceCard).toBeVisible();

  // 5. Create a Project inside that Workspace
  await clickWithDelay(workspaceCard);
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

  await clickWithDelay(page.getByRole('button', { name: 'New Project' }));
  await page.getByPlaceholder('My Project').fill(projectName);
  await page.getByPlaceholder('Optional description').fill('E2E automated test project');
  await clickWithDelay(page.getByRole('button', { name: 'Create Project' }));

  // Assert project card is created and visible
  const projectCard = page.getByText(projectName);
  await expect(projectCard).toBeVisible();

  // 6. Create a Task inside that Project
  await clickWithDelay(projectCard);
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();

  await clickWithDelay(page.getByRole('button', { name: 'New Task' }));
  await page.getByPlaceholder('Task title').fill(taskTitle);
  await page.getByPlaceholder('Optional description').fill('E2E task description');
  await clickWithDelay(page.getByRole('button', { name: 'Create Task' }));

  // 7. Verify Task starts in the "To Do" column
  const todoColumn = page.locator('div.flex-col').filter({ has: page.getByText('To Do', { exact: true }) });
  const inProgressColumn = page.locator('div.flex-col').filter({ has: page.getByText('In Progress', { exact: true }) });
  const doneColumn = page.locator('div.flex-col').filter({ has: page.getByText('Done', { exact: true }) });

  await expect(todoColumn.getByText(taskTitle)).toBeVisible();

  // Specific locator for the task card's 3-dot dropdown menu button
  const taskMenuButton = page
    .locator('div.flex.items-start', { has: page.getByText(taskTitle, { exact: true }) })
    .locator('button[aria-haspopup="menu"]');

  // 8. Move Task from "To Do" -> "In Progress"
  await clickWithDelay(taskMenuButton);
  await clickWithDelay(page.getByRole('menuitem', { name: 'Move to In Progress' }));

  // Assert it moved to "In Progress" and is no longer in "To Do"
  await expect(inProgressColumn.getByText(taskTitle)).toBeVisible();
  await expect(todoColumn.getByText(taskTitle)).not.toBeVisible();

  // 9. Move Task from "In Progress" -> "Done"
  await clickWithDelay(taskMenuButton);
  await clickWithDelay(page.getByRole('menuitem', { name: 'Move to Done' }));

  // Assert it moved to "Done" and is no longer in "In Progress"
  await expect(doneColumn.getByText(taskTitle)).toBeVisible();
  await expect(inProgressColumn.getByText(taskTitle)).not.toBeVisible();
});
