namespace OpTeamUs.DTOs
{
	public class InviteMemberRequest
	{

		public Guid WorkspaceId { get; set; }
		public string Email { get; set; } = string.Empty;
		public string Role { get; set; } = "Member";

	}
}
