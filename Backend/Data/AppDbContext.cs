using Microsoft.EntityFrameworkCore;
using OpTeamUs.Models;


namespace OpTeamUs.Data
{
	public class AppDbContext : DbContext
	{

		public AppDbContext(DbContextOptions<AppDbContext> options)
		: base(options)
		{
		}

		public DbSet<User> Users => Set<User>();
		public DbSet<Workspace> Workspaces => Set<Workspace>();
		public DbSet<Project> Projects => Set<Project>();
		public DbSet<TaskItem> Tasks => Set<TaskItem>();
		public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();

	}
}
