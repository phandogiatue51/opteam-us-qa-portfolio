using Microsoft.EntityFrameworkCore;
using OpTeamUs.Data;

namespace OpTeamUs.Services
{
	public class WorkspaceAccessService
	{

		private readonly AppDbContext _context;

		public WorkspaceAccessService(AppDbContext context)
		{
			_context = context;
		}

		public async Task<string?> GetUserRoleInWorkspace(Guid userId, Guid workspaceId)
		{
			var membership = await _context.WorkspaceMembers
				.FirstOrDefaultAsync(m =>
					m.UserId == userId &&
					m.WorkspaceId == workspaceId);

			return membership?.Role;
		}


	}
}
