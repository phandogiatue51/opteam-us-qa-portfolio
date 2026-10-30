using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace OpTeamUs.DTOs
{
	public class CreateTaskRequest
	{
		[Required]
		[JsonRequired]
		public Guid ProjectId { get; set; }

		[Required]
		public string Title { get; set; } = string.Empty;

		public string? Description { get; set; }
	}
}
