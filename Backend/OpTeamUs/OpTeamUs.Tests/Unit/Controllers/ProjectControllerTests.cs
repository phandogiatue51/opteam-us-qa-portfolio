using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpTeamUs.Controllers;
using OpTeamUs.DTOs;
using OpTeamUs.Models;
using OpTeamUs.Services;
using OpTeamUs.Tests.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace OpTeamUs.Tests.Unit.Controllers
{
	public class ProjectControllerTests
	{
		[Fact]
		public async Task Create_WhenUserNotMember_ReturnsForbid()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new ProjectController(context, accessService);

			var userId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, userId);

			var request = new CreateProjectRequest
			{
				Name = "Project Alpha",
				WorkspaceId = workspaceId
			};

			// Act
			var result = await controller.Create(request);

			// Assert
			Assert.IsType<ForbidResult>(result);
		}

		[Fact]
		public async Task Create_WhenUserIsOnlyMemberRole_ReturnsForbid()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new ProjectController(context, accessService);

			var userId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, userId);

			context.WorkspaceMembers.Add(new WorkspaceMember
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				WorkspaceId = workspaceId,
				Role = "Member"
			});
			await context.SaveChangesAsync();

			var request = new CreateProjectRequest
			{
				Name = "Project Alpha",
				WorkspaceId = workspaceId
			};

			// Act
			var result = await controller.Create(request);

			// Assert
			Assert.IsType<ForbidResult>(result);
		}

		[Fact]
		public async Task Create_WhenUserIsOwner_CreatesProjectSuccessfully()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new ProjectController(context, accessService);

			var userId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, userId);

			context.WorkspaceMembers.Add(new WorkspaceMember
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				WorkspaceId = workspaceId,
				Role = "Owner"
			});
			await context.SaveChangesAsync();

			var request = new CreateProjectRequest
			{
				Name = "Project Alpha",
				Description = "Alpha project description",
				WorkspaceId = workspaceId
			};

			// Act
			var result = await controller.Create(request);

			// Assert
			var okResult = Assert.IsType<OkObjectResult>(result);
			var response = Assert.IsType<ProjectResponse>(okResult.Value);
			Assert.Equal("Project Alpha", response.Name);
			Assert.Equal("Alpha project description", response.Description);
			Assert.Equal(workspaceId, response.WorkspaceId);

			var savedProject = await context.Projects.FirstOrDefaultAsync(p => p.Id == response.Id);
			Assert.NotNull(savedProject);
		}

		[Fact]
		public async Task GetByWorkspace_WhenUserDoesNotOwnWorkspace_ReturnsForbid()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new ProjectController(context, accessService);

			var currentUserId = Guid.NewGuid();
			var ownerId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, currentUserId);

			context.Workspaces.Add(new Workspace
			{
				Id = workspaceId,
				Name = "Someone else's workspace",
				OwnerId = ownerId
			});
			await context.SaveChangesAsync();

			// Act
			var result = await controller.GetByWorkspace(workspaceId);

			// Assert
			Assert.IsType<ForbidResult>(result);
		}

		[Fact]
		public async Task GetByWorkspace_WhenUserOwnsWorkspace_ReturnsProjects()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new ProjectController(context, accessService);

			var currentUserId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, currentUserId);

			context.Workspaces.Add(new Workspace
			{
				Id = workspaceId,
				Name = "My Workspace",
				OwnerId = currentUserId
			});
			context.Projects.AddRange(
				new Project { Id = Guid.NewGuid(), Name = "Project 1", WorkspaceId = workspaceId },
				new Project { Id = Guid.NewGuid(), Name = "Project 2", WorkspaceId = workspaceId }
			);
			await context.SaveChangesAsync();

			// Act
			var result = await controller.GetByWorkspace(workspaceId);

			// Assert
			var okResult = Assert.IsType<OkObjectResult>(result);
			var projects = Assert.IsAssignableFrom<IEnumerable<ProjectResponse>>(okResult.Value).ToList();
			Assert.Equal(2, projects.Count);
		}
	}
}

