using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpTeamUs.Controllers;
using OpTeamUs.DTOs;
using OpTeamUs.Models;
using OpTeamUs.Tests.Helpers;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace OpTeamUs.Tests.Unit.Controllers
{
	public class MembershipControllerTests
	{
		[Fact]
		public async Task Invite_WhenUserIsNotWorkspaceOwner_ReturnsForbid()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var controller = new MembershipController(context);

			var callerId = Guid.NewGuid();
			var realOwnerId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, callerId);

			context.Workspaces.Add(new Workspace
			{
				Id = workspaceId,
				Name = "Private Workspace",
				OwnerId = realOwnerId
			});
			await context.SaveChangesAsync();

			var request = new InviteMemberRequest
			{
				WorkspaceId = workspaceId,
				Email = "invitee@example.com",
				Role = "Member"
			};

			// Act
			var result = await controller.Invite(request);

			// Assert
			Assert.IsType<ForbidResult>(result);
		}

		[Fact]
		public async Task Invite_WhenTargetUserNotFound_ReturnsNotFound()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var controller = new MembershipController(context);

			var ownerId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, ownerId);

			context.Workspaces.Add(new Workspace
			{
				Id = workspaceId,
				Name = "My Workspace",
				OwnerId = ownerId
			});
			await context.SaveChangesAsync();

			var request = new InviteMemberRequest
			{
				WorkspaceId = workspaceId,
				Email = "doesnotexist@example.com",
				Role = "Member"
			};

			// Act
			var result = await controller.Invite(request);

			// Assert
			var notFound = Assert.IsType<NotFoundObjectResult>(result);
			Assert.Equal("User not found.", notFound.Value);
		}

		[Fact]
		public async Task Invite_WhenUserAlreadyMember_ReturnsBadRequest()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var controller = new MembershipController(context);

			var ownerId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			var targetUserId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, ownerId);

			context.Workspaces.Add(new Workspace
			{
				Id = workspaceId,
				Name = "My Workspace",
				OwnerId = ownerId
			});
			context.Users.Add(new User
			{
				Id = targetUserId,
				Email = "colleague@example.com"
			});
			context.WorkspaceMembers.Add(new WorkspaceMember
			{
				Id = Guid.NewGuid(),
				WorkspaceId = workspaceId,
				UserId = targetUserId,
				Role = "Member"
			});
			await context.SaveChangesAsync();

			var request = new InviteMemberRequest
			{
				WorkspaceId = workspaceId,
				Email = "colleague@example.com",
				Role = "Member"
			};

			// Act
			var result = await controller.Invite(request);

			// Assert
			var badRequest = Assert.IsType<BadRequestObjectResult>(result);
			Assert.Equal("User already a member.", badRequest.Value);
		}

		[Fact]
		public async Task Invite_WhenValid_AddsMemberAndReturnsOk()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var controller = new MembershipController(context);

			var ownerId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			var targetUserId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, ownerId);

			context.Workspaces.Add(new Workspace
			{
				Id = workspaceId,
				Name = "My Workspace",
				OwnerId = ownerId
			});
			context.Users.Add(new User
			{
				Id = targetUserId,
				Email = "newcolleague@example.com"
			});
			await context.SaveChangesAsync();

			var request = new InviteMemberRequest
			{
				WorkspaceId = workspaceId,
				Email = "newcolleague@example.com",
				Role = "Admin"
			};

			// Act
			var result = await controller.Invite(request);

			// Assert
			var okResult = Assert.IsType<OkObjectResult>(result);
			Assert.Equal("Member added successfully.", okResult.Value);

			var membership = await context.WorkspaceMembers
				.FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == targetUserId);
			Assert.NotNull(membership);
			Assert.Equal("Admin", membership.Role);
		}

		[Fact]
		public async Task GetMembers_WhenUserNotMemberOfWorkspace_ReturnsForbid()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var controller = new MembershipController(context);

			var nonMemberId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, nonMemberId);

			// Act
			var result = await controller.GetMembers(workspaceId);

			// Assert
			Assert.IsType<ForbidResult>(result);
		}

		[Fact]
		public async Task GetMembers_WhenUserIsMember_ReturnsMemberList()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var controller = new MembershipController(context);

			var userId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();
			TestControllerHelper.SetUserContext(controller, userId);

			var user = new User { Id = userId, Email = "member@example.com" };
			context.Users.Add(user);
			context.WorkspaceMembers.Add(new WorkspaceMember
			{
				Id = Guid.NewGuid(),
				WorkspaceId = workspaceId,
				UserId = userId,
				User = user,
				Role = "Owner"
			});
			await context.SaveChangesAsync();

			// Act
			var result = await controller.GetMembers(workspaceId);

			// Assert
			var okResult = Assert.IsType<OkObjectResult>(result);
			var members = Assert.IsAssignableFrom<IEnumerable>(okResult.Value);
			var list = members.Cast<object>().ToList();
			Assert.Single(list);
		}
	}
}

