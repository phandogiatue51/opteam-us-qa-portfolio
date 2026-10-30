using OpTeamUs.DTOs;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;

namespace OpTeamUs.Tests.Integration
{
	public class MembershipIntegrationTests : IClassFixture<CustomWebApplicationFactory>
	{
		private readonly CustomWebApplicationFactory _factory;

		public MembershipIntegrationTests(CustomWebApplicationFactory factory)
		{
			_factory = factory;
		}

		private async Task<string> RegisterUserAndGetTokenAsync(HttpClient client, string email)
		{
			var response = await client.PostAsJsonAsync("/auth/register", new RegisterRequest
			{
				Email = email,
				Password = "Password123!",
				FirstName = "Member",
				LastName = "Test"
			});
			response.EnsureSuccessStatusCode();
			var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
			return auth!.Token;
		}

		[Fact]
		public async Task Membership_Invite_And_GetMembers_SecurityRules_Enforced()
		{
			var ownerClient = _factory.CreateClient();
			var strangerClient = _factory.CreateClient();
			var inviteeClient = _factory.CreateClient();

			var ownerEmail = $"owner_mem_{Guid.NewGuid():N}@example.com";
			var strangerEmail = $"stranger_{Guid.NewGuid():N}@example.com";
			var inviteeEmail = $"invitee_{Guid.NewGuid():N}@example.com";

			var ownerToken = await RegisterUserAndGetTokenAsync(ownerClient, ownerEmail);
			var strangerToken = await RegisterUserAndGetTokenAsync(strangerClient, strangerEmail);
			var inviteeToken = await RegisterUserAndGetTokenAsync(inviteeClient, inviteeEmail);

			ownerClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
			strangerClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", strangerToken);
			inviteeClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", inviteeToken);

			// 1. Owner creates workspace
			var wsResponse = await ownerClient.PostAsJsonAsync("/api/workspaces", new CreateWorkspaceRequest
			{
				Name = "Team Workspace"
			});
			var workspace = await wsResponse.Content.ReadFromJsonAsync<WorkspaceResponse>();
			Assert.NotNull(workspace);

			// 2. Stranger tries to invite someone to owner's workspace -> 403 Forbidden
			var strangerInvite = await strangerClient.PostAsJsonAsync("/api/members/invite", new InviteMemberRequest
			{
				WorkspaceId = workspace.Id,
				Email = inviteeEmail,
				Role = "Member"
			});
			Assert.Equal(HttpStatusCode.Forbidden, strangerInvite.StatusCode);

			// 3. Owner invites non-existent user -> 404 NotFound
			var notFoundInvite = await ownerClient.PostAsJsonAsync("/api/members/invite", new InviteMemberRequest
			{
				WorkspaceId = workspace.Id,
				Email = "doesnotexist@nowhere.com",
				Role = "Member"
			});
			Assert.Equal(HttpStatusCode.NotFound, notFoundInvite.StatusCode);

			// 4. Owner invites valid user -> 200 OK
			var validInvite = await ownerClient.PostAsJsonAsync("/api/members/invite", new InviteMemberRequest
			{
				WorkspaceId = workspace.Id,
				Email = inviteeEmail,
				Role = "Admin"
			});
			Assert.Equal(HttpStatusCode.OK, validInvite.StatusCode);

			// 5. Owner invites same user again -> 400 BadRequest
			var duplicateInvite = await ownerClient.PostAsJsonAsync("/api/members/invite", new InviteMemberRequest
			{
				WorkspaceId = workspace.Id,
				Email = inviteeEmail,
				Role = "Admin"
			});
			Assert.Equal(HttpStatusCode.BadRequest, duplicateInvite.StatusCode);

			// 6. Stranger tries to view members -> 403 Forbidden
			var strangerGetMembers = await strangerClient.GetAsync($"/api/members/workspace/{workspace.Id}");
			Assert.Equal(HttpStatusCode.Forbidden, strangerGetMembers.StatusCode);

			// 7. Invitee (now member) views members -> 200 OK
			var memberGetMembers = await inviteeClient.GetAsync($"/api/members/workspace/{workspace.Id}");
			Assert.Equal(HttpStatusCode.OK, memberGetMembers.StatusCode);
		}
	}
}

