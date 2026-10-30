namespace OpTeamUs.DTOs
{
	public class ProjectResponse
	{

		public Guid Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public string? Description { get; set; }
		public Guid WorkspaceId { get; set; }
		public DateTime CreatedAt { get; set; }

	}
}
