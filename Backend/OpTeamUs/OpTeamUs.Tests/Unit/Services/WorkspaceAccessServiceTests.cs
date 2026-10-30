using OpTeamUs.Models;
using OpTeamUs.Services;
using OpTeamUs.Tests.Helpers;
using System;
using System.Threading.Tasks;
using Xunit;

namespace OpTeamUs.Tests.Unit.Services
{
	public class WorkspaceAccessServiceTests
	{
		[Fact]
		public async Task GetUserRoleInWorkspace_WhenMemberExists_ReturnsRole()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var service = new WorkspaceAccessService(context);

			var userId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();

			context.WorkspaceMembers.Add(new WorkspaceMember
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				WorkspaceId = workspaceId,
				Role = "Admin"
			});
			await context.SaveChangesAsync();

			// Act
			var role = await service.GetUserRoleInWorkspace(userId, workspaceId);

			// Assert
			Assert.Equal("Admin", role);
		}

		[Fact]
		public async Task GetUserRoleInWorkspace_WhenMemberDoesNotExist_ReturnsNull()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var service = new WorkspaceAccessService(context);

			var userId = Guid.NewGuid();
			var workspaceId = Guid.NewGuid();

			// Act
			var role = await service.GetUserRoleInWorkspace(userId, workspaceId);

			// Assert
			Assert.Null(role);
		}

		[Fact]
		public async Task GetUserRoleInWorkspace_WhenDifferentWorkspaceMember_ReturnsNull()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var service = new WorkspaceAccessService(context);

			var userId = Guid.NewGuid();
			var workspaceA = Guid.NewGuid();
			var workspaceB = Guid.NewGuid();

			context.WorkspaceMembers.Add(new WorkspaceMember
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				WorkspaceId = workspaceA,
				Role = "Member"
			});
			await context.SaveChangesAsync();

			// Act
			var role = await service.GetUserRoleInWorkspace(userId, workspaceB);

			// Assert
			Assert.Null(role);
		}
	}
}

