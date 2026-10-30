namespace OpTeamUs.DTOs
{
	public class CreateTaskRequest
	{

		public Guid ProjectId { get; set; }
		public string Title { get; set; } = string.Empty;
		public string? Description { get; set; }

	}
}
