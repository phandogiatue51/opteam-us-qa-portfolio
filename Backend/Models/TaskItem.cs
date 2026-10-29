using System.ComponentModel.DataAnnotations.Schema;

namespace OpTeamUs.Models
{
	public class TaskItem
	{

		public Guid Id { get; set; } = Guid.NewGuid();

		public string Title { get; set; } = string.Empty;

		public string? Description { get; set; }

		public string Status { get; set; } = "todo"; // todo, in-progress, done

		public Guid ProjectId { get; set; }

		[ForeignKey("ProjectId")]
		public Project Project { get; set; } = null!;

		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;                         

	}
}
