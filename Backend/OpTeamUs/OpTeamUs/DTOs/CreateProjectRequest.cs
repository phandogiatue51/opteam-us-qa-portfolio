using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace OpTeamUs.DTOs
{
	public class CreateProjectRequest
	{
		[Required]
		[JsonRequired]
		public Guid WorkspaceId { get; set; }

		[Required]
		public string Name { get; set; } = string.Empty;

		public string? Description { get; set; }
	}
}
