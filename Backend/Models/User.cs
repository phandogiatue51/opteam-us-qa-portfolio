namespace OpTeamUs.Models
{
	public class User
	{
		public Guid Id { get; set; } = Guid.NewGuid();

		public string Email { get; set; } = string.Empty;

		public string PasswordHash { get; set; } = string.Empty;

		public string Role { get; set; } = "User";
		public string FirstName { get; set; } = string.Empty;

		public string LastName { get; set; } = string.Empty;


		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


		public ICollection<Workspace> OwnedWorkspaces { get; set; } = new List<Workspace>();

		public ICollection<WorkspaceMember> WorkspaceMemberships { get; set; } = new List<WorkspaceMember>();

	}
}
