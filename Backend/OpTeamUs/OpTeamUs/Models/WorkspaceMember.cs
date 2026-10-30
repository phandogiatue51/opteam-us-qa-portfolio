using System.ComponentModel.DataAnnotations.Schema;

namespace OpTeamUs.Models
{
	public class WorkspaceMember
	{

		public Guid Id { get; set; } = Guid.NewGuid();

		public Guid WorkspaceId { get; set; }

		[ForeignKey("WorkspaceId")]
		public Workspace Workspace { get; set; } = null!;

		public Guid UserId { get; set; }

		[ForeignKey("UserId")]
		public User User { get; set; } = null!;

		public string Role { get; set; } = "Member"; // Owner, Admin, Member

		public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

	}
}
