using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpTeamUs.Controllers;
using OpTeamUs.DTOs;
using OpTeamUs.Models;
using OpTeamUs.Tests.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace OpTeamUs.Tests.Unit.Controllers
{
	public class WorkspaceControllerTests
	{
		[Fact]
		public async Task Create_CreatesWorkspaceAndAddsOwnerMember()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var controller = new WorkspaceController(context);

			var userId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, userId);

			var request = new CreateWorkspaceRequest
			{
				Name = "Engineering Team"
			};

			// Act
			var result = await controller.Create(request);

			// Assert
			var okResult = Assert.IsType<OkObjectResult>(result);
			var response = Assert.IsType<WorkspaceResponse>(okResult.Value);
			Assert.Equal("Engineering Team", response.Name);
			Assert.NotEqual(Guid.Empty, response.Id);

			var createdWorkspace = await context.Workspaces.FindAsync(response.Id);
			Assert.NotNull(createdWorkspace);
			Assert.Equal(userId, createdWorkspace.OwnerId);

			var membership = await context.WorkspaceMembers
				.FirstOrDefaultAsync(m => m.WorkspaceId == response.Id && m.UserId == userId);
			Assert.NotNull(membership);
			Assert.Equal("Owner", membership.Role);
		}

		[Fact]
		public async Task GetMyWorkspaces_ReturnsOnlyWorkspacesOwnedByCurrentUser()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var controller = new WorkspaceController(context);

			var currentUserId = Guid.NewGuid();
			var otherUserId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, currentUserId);

			context.Workspaces.AddRange(
				new Workspace { Id = Guid.NewGuid(), Name = "My Workspace 1", OwnerId = currentUserId },
				new Workspace { Id = Guid.NewGuid(), Name = "My Workspace 2", OwnerId = currentUserId },
				new Workspace { Id = Guid.NewGuid(), Name = "Other User's Workspace", OwnerId = otherUserId }
			);
			await context.SaveChangesAsync();

			// Act
			var result = await controller.GetMyWorkspaces();

			// Assert
			var okResult = Assert.IsType<OkObjectResult>(result);
			var workspaces = Assert.IsAssignableFrom<IEnumerable<WorkspaceResponse>>(okResult.Value).ToList();
			Assert.Equal(2, workspaces.Count);
			Assert.All(workspaces, w => Assert.Contains("My Workspace", w.Name));
		}
	}
}

