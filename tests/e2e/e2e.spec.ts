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

  // 1. Go to http://localhost:3000
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/OpTeamUs/i);

  // 2. Register a new user via the UI
  await page.getByRole('link', { name: 'Sign up' }).first().click();
  await expect(page).toHaveURL(/.*register/);

  await page.getByLabel('First Name').fill(testUser.firstName);
  await page.getByLabel('Last Name').fill(testUser.lastName);
  await page.getByLabel('Email').fill(testUser.email);
  await page.getByLabel('Password').fill(testUser.password);
  await page.getByRole('button', { name: 'Create Account' }).click();

  // 3. Log in via the UI
  await expect(page).toHaveURL(/.*login/);
  await page.getByLabel('Email').fill(testUser.email);
  await page.getByLabel('Password').fill(testUser.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Verify dashboard navigation
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // 4. Create a Workspace
  await page.getByRole('button', { name: 'New Workspace' }).click();
  await page.getByPlaceholder('My Workspace').fill(workspaceName);
  await page.getByPlaceholder('Optional description').fill('E2E automated test workspace');
  await page.getByRole('button', { name: 'Create Workspace' }).click();

  // Assert workspace card is created and visible
  const workspaceCard = page.getByText(workspaceName);
  await expect(workspaceCard).toBeVisible();

  // 5. Create a Project inside that Workspace
  await workspaceCard.click();
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

  await page.getByRole('button', { name: 'New Project' }).click();
  await page.getByPlaceholder('My Project').fill(projectName);
  await page.getByPlaceholder('Optional description').fill('E2E automated test project');
  await page.getByRole('button', { name: 'Create Project' }).click();

  // Assert project card is created and visible
  const projectCard = page.getByText(projectName);
  await expect(projectCard).toBeVisible();

  // 6. Create a Task inside that Project
  await projectCard.click();
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();

  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByPlaceholder('Task title').fill(taskTitle);
  await page.getByPlaceholder('Optional description').fill('E2E task description');
  await page.getByRole('button', { name: 'Create Task' }).click();

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
  await taskMenuButton.click();
  await page.getByRole('menuitem', { name: 'Move to In Progress' }).click();

  // Assert it moved to "In Progress" and is no longer in "To Do"
  await expect(inProgressColumn.getByText(taskTitle)).toBeVisible();
  await expect(todoColumn.getByText(taskTitle)).not.toBeVisible();

  // 9. Move Task from "In Progress" -> "Done"
  await taskMenuButton.click();
  await page.getByRole('menuitem', { name: 'Move to Done' }).click();

  // Assert it moved to "Done" and is no longer in "In Progress"
  await expect(doneColumn.getByText(taskTitle)).toBeVisible();
  await expect(inProgressColumn.getByText(taskTitle)).not.toBeVisible();
});
