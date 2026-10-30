using System.ComponentModel.DataAnnotations.Schema;

namespace OpTeamUs.Models
{
	public class Project
	{

		public Guid Id { get; set; } = Guid.NewGuid();

		public string Name { get; set; } = string.Empty;

		public string? Description { get; set; }

		public Guid WorkspaceId { get; set; }

		[ForeignKey("WorkspaceId")]
		public Workspace Workspace { get; set; } = null!;

		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

		public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
	

	}
}
