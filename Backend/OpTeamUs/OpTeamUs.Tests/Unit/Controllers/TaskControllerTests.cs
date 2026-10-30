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
	public class TaskControllerTests
	{
		[Fact]
		public async Task Create_WhenProjectNotFound_ReturnsNotFound()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new TaskController(context, accessService);

			TestControllerHelper.SetUserContext(controller, Guid.NewGuid());

			var request = new CreateTaskRequest
			{
				ProjectId = Guid.NewGuid(),
				Title = "Implement login"
			};

			// Act
			var result = await controller.Create(request);

			// Assert
			var notFound = Assert.IsType<NotFoundObjectResult>(result);
			Assert.Equal("Project not found.", notFound.Value);
		}

		[Fact]
		public async Task Create_WhenUserNotWorkspaceMember_ReturnsForbid()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new TaskController(context, accessService);

			var userId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			var projectId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, userId);

			var workspace = new Workspace { Id = workspaceId, Name = "Workspace", OwnerId = Guid.NewGuid() };
			var project = new Project { Id = projectId, Name = "Project", WorkspaceId = workspaceId, Workspace = workspace };
			context.Workspaces.Add(workspace);
			context.Projects.Add(project);
			await context.SaveChangesAsync();

			var request = new CreateTaskRequest
			{
				ProjectId = projectId,
				Title = "Unassigned task"
			};

			// Act
			var result = await controller.Create(request);

			// Assert
			Assert.IsType<ForbidResult>(result);
		}

		[Fact]
		public async Task Create_WhenUserIsMember_CreatesTaskWithDefaultTodoStatus()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new TaskController(context, accessService);

			var userId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			var projectId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, userId);

			var workspace = new Workspace { Id = workspaceId, Name = "Workspace", OwnerId = userId };
			var project = new Project { Id = projectId, Name = "Project", WorkspaceId = workspaceId, Workspace = workspace };
			context.Workspaces.Add(workspace);
			context.Projects.Add(project);
			context.WorkspaceMembers.Add(new WorkspaceMember
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				WorkspaceId = workspaceId,
				Role = "Member"
			});
			await context.SaveChangesAsync();

			var request = new CreateTaskRequest
			{
				ProjectId = projectId,
				Title = "Build frontend",
				Description = "React components"
			};

			// Act
			var result = await controller.Create(request);

			// Assert
			var okResult = Assert.IsType<OkObjectResult>(result);
			var response = Assert.IsType<TaskResponse>(okResult.Value);
			Assert.Equal("Build frontend", response.Title);
			Assert.Equal("React components", response.Description);
			Assert.Equal("todo", response.Status);
			Assert.Equal(projectId, response.ProjectId);

			var savedTask = await context.Tasks.FirstOrDefaultAsync(t => t.Id == response.Id);
			Assert.NotNull(savedTask);
		}

		[Fact]
		public async Task Update_WhenTaskNotFound_ReturnsNotFound()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new TaskController(context, accessService);

			var request = new UpdateTaskRequest { Status = "done" };

			// Act
			var result = await controller.Update(Guid.NewGuid(), request);

			// Assert
			Assert.IsType<NotFoundResult>(result);
		}

		[Theory]
		[InlineData("invalid-status")]
		[InlineData("archived")]
		[InlineData("blocked")]
		public async Task Update_WhenStatusIsInvalid_ReturnsBadRequest(string invalidStatus)
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new TaskController(context, accessService);

			var taskId = Guid.NewGuid();
			context.Tasks.Add(new TaskItem
			{
				Id = taskId,
				Title = "Existing Task",
				Status = "todo",
				ProjectId = Guid.NewGuid()
			});
			await context.SaveChangesAsync();

			var request = new UpdateTaskRequest { Status = invalidStatus };

			// Act
			var result = await controller.Update(taskId, request);

			// Assert
			var badRequest = Assert.IsType<BadRequestObjectResult>(result);
			Assert.Equal("Invalid status value.", badRequest.Value);
		}

		[Theory]
		[InlineData("todo")]
		[InlineData("in-progress")]
		[InlineData("done")]
		[InlineData("IN-PROGRESS")]
		public async Task Update_WhenStatusIsValid_UpdatesTaskAndReturnsOk(string validStatus)
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new TaskController(context, accessService);

			var taskId = Guid.NewGuid();
			context.Tasks.Add(new TaskItem
			{
				Id = taskId,
				Title = "Existing Task",
				Status = "todo",
				ProjectId = Guid.NewGuid()
			});
			await context.SaveChangesAsync();

			var request = new UpdateTaskRequest { Status = validStatus };

			// Act
			var result = await controller.Update(taskId, request);

			// Assert
			var okResult = Assert.IsType<OkObjectResult>(result);
			var response = Assert.IsType<TaskResponse>(okResult.Value);
			Assert.Equal(validStatus.ToLower(), response.Status);

			var updatedTask = await context.Tasks.FindAsync(taskId);
			Assert.NotNull(updatedTask);
			Assert.Equal(validStatus.ToLower(), updatedTask.Status);
		}

		[Fact]
		public async Task Delete_WhenTaskNotFound_ReturnsNotFound()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new TaskController(context, accessService);

			TestControllerHelper.SetUserContext(controller, Guid.NewGuid());

			// Act
			var result = await controller.Delete(Guid.NewGuid());

			// Assert
			var notFound = Assert.IsType<NotFoundObjectResult>(result);
			Assert.Equal("Task not found.", notFound.Value);
		}

		[Fact]
		public async Task Delete_WhenUserNotAuthorizedInWorkspace_ReturnsForbid()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new TaskController(context, accessService);

			var userId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			var projectId = Guid.NewGuid();
			var taskId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, userId);

			var workspace = new Workspace { Id = workspaceId, Name = "Workspace", OwnerId = Guid.NewGuid() };
			var project = new Project { Id = projectId, Name = "Project", WorkspaceId = workspaceId, Workspace = workspace };
			var task = new TaskItem { Id = taskId, Title = "Task to delete", ProjectId = projectId, Project = project };

			context.Workspaces.Add(workspace);
			context.Projects.Add(project);
			context.Tasks.Add(task);
			await context.SaveChangesAsync();

			// Act
			var result = await controller.Delete(taskId);

			// Assert
			Assert.IsType<ForbidResult>(result);
		}

		[Fact]
		public async Task Delete_WhenAuthorized_RemovesTaskAndReturnsNoContent()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var accessService = new WorkspaceAccessService(context);
			var controller = new TaskController(context, accessService);

			var userId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			var projectId = Guid.NewGuid();
			var taskId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, userId);

			var workspace = new Workspace { Id = workspaceId, Name = "Workspace", OwnerId = userId };
			var project = new Project { Id = projectId, Name = "Project", WorkspaceId = workspaceId, Workspace = workspace };
			var task = new TaskItem { Id = taskId, Title = "Task to delete", ProjectId = projectId, Project = project };

			context.Workspaces.Add(workspace);
			context.Projects.Add(project);
			context.Tasks.Add(task);
			context.WorkspaceMembers.Add(new WorkspaceMember
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				WorkspaceId = workspaceId,
				Role = "Owner"
			});
			await context.SaveChangesAsync();

			// Act
			var result = await controller.Delete(taskId);

			// Assert
			Assert.IsType<NoContentResult>(result);
			var deletedTask = await context.Tasks.FindAsync(taskId);
			Assert.Null(deletedTask);
		}
	}
}

