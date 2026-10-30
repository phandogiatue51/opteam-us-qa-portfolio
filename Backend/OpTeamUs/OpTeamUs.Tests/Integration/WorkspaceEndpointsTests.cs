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
	public class WorkspaceEndpointsTests : IClassFixture<CustomWebApplicationFactory>
	{
		private readonly CustomWebApplicationFactory _factory;

		public WorkspaceEndpointsTests(CustomWebApplicationFactory factory)
		{
			_factory = factory;
		}

		private async Task<string> RegisterAndGetTokenAsync(HttpClient client, string email)
		{
			var regResponse = await client.PostAsJsonAsync("/auth/register", new RegisterRequest
			{
				Email = email,
				Password = "Password123!",
				FirstName = "Workspace",
				LastName = "Owner"
			});
			regResponse.EnsureSuccessStatusCode();
			var auth = await regResponse.Content.ReadFromJsonAsync<AuthResponse>();
			return auth!.Token;
		}

		[Fact]
		public async Task Workspace_Endpoints_RequireAuthentication()
		{
			var client = _factory.CreateClient();

			var getResponse = await client.GetAsync("/api/workspaces");
			Assert.Equal(HttpStatusCode.Unauthorized, getResponse.StatusCode);

			var postResponse = await client.PostAsJsonAsync("/api/workspaces", new CreateWorkspaceRequest
			{
				Name = "Unauthorized Workspace"
			});
			Assert.Equal(HttpStatusCode.Unauthorized, postResponse.StatusCode);
		}

		[Fact]
		public async Task Create_And_GetMyWorkspaces_Flow_Succeeds()
		{
			var client = _factory.CreateClient();
			var token = await RegisterAndGetTokenAsync(client, $"ws_user_{Guid.NewGuid():N}@example.com");

			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			// Create workspace
			var createResponse = await client.PostAsJsonAsync("/api/workspaces", new CreateWorkspaceRequest
			{
				Name = "Integration Workspace"
			});
			Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

			var createdWs = await createResponse.Content.ReadFromJsonAsync<WorkspaceResponse>();
			Assert.NotNull(createdWs);
			Assert.Equal("Integration Workspace", createdWs.Name);

			// Get my workspaces
			var listResponse = await client.GetAsync("/api/workspaces");
			Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

			var workspaces = await listResponse.Content.ReadFromJsonAsync<List<WorkspaceResponse>>();
			Assert.NotNull(workspaces);
			Assert.Contains(workspaces, w => w.Id == createdWs.Id && w.Name == "Integration Workspace");
		}
	}
}
