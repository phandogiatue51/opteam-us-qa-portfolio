using OpTeamUs.DTOs;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;

namespace OpTeamUs.Tests.Integration
{
	public class ProjectAndTaskIntegrationTests : IClassFixture<CustomWebApplicationFactory>
	{
		private readonly CustomWebApplicationFactory _factory;

		public ProjectAndTaskIntegrationTests(CustomWebApplicationFactory factory)
		{
			_factory = factory;
		}

		private async Task<string> RegisterUserAndGetTokenAsync(HttpClient client, string email)
		{
			var response = await client.PostAsJsonAsync("/auth/register", new RegisterRequest
			{
				Email = email,
				Password = "Password123!",
				FirstName = "Test",
				LastName = "User"
			});
			response.EnsureSuccessStatusCode();
			var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
			return auth!.Token;
		}

		[Fact]
		public async Task Full_Trello_Linear_Workflow_EndToEnd()
		{
			var ownerClient = _factory.CreateClient();
			var colleagueClient = _factory.CreateClient();

			// 1. Register Owner and Colleague
			var ownerEmail = $"owner_{Guid.NewGuid():N}@example.com";
			var colleagueEmail = $"colleague_{Guid.NewGuid():N}@example.com";

			var ownerToken = await RegisterUserAndGetTokenAsync(ownerClient, ownerEmail);
			var colleagueToken = await RegisterUserAndGetTokenAsync(colleagueClient, colleagueEmail);

			ownerClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
			colleagueClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", colleagueToken);

			// 2. Owner creates a workspace
			var wsResponse = await ownerClient.PostAsJsonAsync("/api/workspaces", new CreateWorkspaceRequest
			{
				Name = "Scrum Workspace"
			});
			Assert.Equal(HttpStatusCode.OK, wsResponse.StatusCode);
			var workspace = await wsResponse.Content.ReadFromJsonAsync<WorkspaceResponse>();
			Assert.NotNull(workspace);

			// 3. Owner invites Colleague as "Member"
			var inviteResponse = await ownerClient.PostAsJsonAsync("/api/members/invite", new InviteMemberRequest
			{
				WorkspaceId = workspace.Id,
				Email = colleagueEmail,
				Role = "Member"
			});
			Assert.Equal(HttpStatusCode.OK, inviteResponse.StatusCode);

			// 4. Colleague attempts to create a project -> Should fail with 403 Forbid (Members cannot create projects)
			var forbiddenProject = await colleagueClient.PostAsJsonAsync("/api/projects", new CreateProjectRequest
			{
				WorkspaceId = workspace.Id,
				Name = "Unauthorized Project",
				Description = "Should be forbidden"
			});
			Assert.Equal(HttpStatusCode.Forbidden, forbiddenProject.StatusCode);

			// 5. Owner creates a project
			var projectResponse = await ownerClient.PostAsJsonAsync("/api/projects", new CreateProjectRequest
			{
				WorkspaceId = workspace.Id,
				Name = "Q4 Sprint Project",
				Description = "Sprint deliverables"
			});
			Assert.Equal(HttpStatusCode.OK, projectResponse.StatusCode);
			var project = await projectResponse.Content.ReadFromJsonAsync<ProjectResponse>();
			Assert.NotNull(project);

			// 6. Colleague (Member) creates a task inside the project -> Succeeds
			var taskCreateResponse = await colleagueClient.PostAsJsonAsync("/api/tasks", new CreateTaskRequest
			{
				ProjectId = project.Id,
				Title = "Build landing page hero section",
				Description = "Figma design link attached"
			});
			Assert.Equal(HttpStatusCode.OK, taskCreateResponse.StatusCode);
			var createdTask = await taskCreateResponse.Content.ReadFromJsonAsync<TaskResponse>();
			Assert.NotNull(createdTask);
			Assert.Equal("todo", createdTask.Status);

			// 7. Colleague updates task status to "in-progress"
			var updateResponse = await colleagueClient.PutAsJsonAsync($"/api/tasks/{createdTask.Id}", new UpdateTaskRequest
			{
				Status = "in-progress"
			});
			Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
			var updatedTask = await updateResponse.Content.ReadFromJsonAsync<TaskResponse>();
			Assert.Equal("in-progress", updatedTask!.Status);

			// 8. Colleague updates task with invalid status -> 400 Bad Request
			var invalidStatusResponse = await colleagueClient.PutAsJsonAsync($"/api/tasks/{createdTask.Id}", new UpdateTaskRequest
			{
				Status = "invalid-status-state"
			});
			Assert.Equal(HttpStatusCode.BadRequest, invalidStatusResponse.StatusCode);

			// 9. Owner views tasks under the project
			var getTasksResponse = await ownerClient.GetAsync($"/api/tasks/project/{project.Id}");
			Assert.Equal(HttpStatusCode.OK, getTasksResponse.StatusCode);
			var taskList = await getTasksResponse.Content.ReadFromJsonAsync<List<TaskResponse>>();
			Assert.NotNull(taskList);
			Assert.Contains(taskList, t => t.Id == createdTask.Id && t.Status == "in-progress");

			// 10. Owner deletes the task -> 204 NoContent
			var deleteResponse = await ownerClient.DeleteAsync($"/api/tasks/{createdTask.Id}");
			Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

			// 11. Deleting again returns 404 NotFound
			var deleteAgainResponse = await ownerClient.DeleteAsync($"/api/tasks/{createdTask.Id}");
			Assert.Equal(HttpStatusCode.NotFound, deleteAgainResponse.StatusCode);
		}
	}
}
