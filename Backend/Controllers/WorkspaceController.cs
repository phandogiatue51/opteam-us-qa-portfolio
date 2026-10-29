using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using OpTeamUs.Data;
using OpTeamUs.DTOs;
using OpTeamUs.Models;
using System.Security.Claims;

namespace OpTeamUs.Controllers
{
	[ApiController]
	[Route("api/workspaces")]
	[Authorize]
	public class WorkspaceController : ControllerBase
	{

		private readonly AppDbContext _context;

		public WorkspaceController(AppDbContext context)
		{
			_context = context;
		}

		private Guid GetCurrentUserId()
		{
			return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
		}

		#region Create Work Space POST
		[HttpPost]
		public async Task<IActionResult> Create(CreateWorkspaceRequest request)
		{
			var userId = GetCurrentUserId();

			var workspace = new Workspace
			{
				Name = request.Name,
				OwnerId = userId
			};

			_context.Workspaces.Add(workspace);
			await _context.SaveChangesAsync();

			// Automatically add Owner to WorkspaceMembers
			var ownerMembership = new WorkspaceMember
			{
				WorkspaceId = workspace.Id,
				UserId = userId,
				Role = "Owner"
			};

			_context.WorkspaceMembers.Add(ownerMembership);
			await _context.SaveChangesAsync();

			return Ok(new WorkspaceResponse
			{
				Id = workspace.Id,
				Name = workspace.Name,
				CreatedAt = workspace.CreatedAt
			});
		}
		#endregion

		#region GET Work Space 
		[HttpGet]
		public async Task<IActionResult> GetMyWorkspaces()
		{
			var userId = GetCurrentUserId();

			var workspaces = await _context.Workspaces
				.Where(w => w.OwnerId == userId)
				.Select(w => new WorkspaceResponse
				{
					Id = w.Id,
					Name = w.Name,
					CreatedAt = w.CreatedAt
				})
				.ToListAsync();

			return Ok(workspaces);
		}

		#endregion

	}
}
