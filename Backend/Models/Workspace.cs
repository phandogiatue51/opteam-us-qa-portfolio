using System.ComponentModel.DataAnnotations.Schema;

namespace OpTeamUs.Models
{
	public class Workspace
	{

		public Guid Id { get; set; } = Guid.NewGuid();

		public string Name { get; set; } = string.Empty;

		public Guid OwnerId { get; set; }

		[ForeignKey("OwnerId")]
		public User Owner { get; set; } = null!;

		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


		public ICollection<Project> Projects { get; set; } = new List<Project>();

		public ICollection<WorkspaceMember> Members { get; set; } = new List<WorkspaceMember>();

	}
}
