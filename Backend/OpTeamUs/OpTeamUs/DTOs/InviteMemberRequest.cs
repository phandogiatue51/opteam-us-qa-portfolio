using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace OpTeamUs.DTOs
{
	public class InviteMemberRequest
	{
		[Required]
		[JsonRequired]
		public Guid WorkspaceId { get; set; }

		[Required]
		[EmailAddress]
		public string Email { get; set; } = string.Empty;

		public string Role { get; set; } = "Member";
	}
}
