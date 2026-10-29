using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpTeamUs.Data;
using OpTeamUs.DTOs;
using OpTeamUs.Models;
using OpTeamUs.Services;
using System.Security.Claims;

namespace OpTeamUs.Controllers
{
	[ApiController]
	[Route("api/projects")]
	[Authorize]
	public class ProjectController : ControllerBase
	{

		private readonly AppDbContext _context;

		private readonly WorkspaceAccessService _accessService;

		public ProjectController(AppDbContext context, WorkspaceAccessService accessService)
		{
			_context = context;
			_accessService = accessService;
		}

		private Guid GetCurrentUserId()
		{
			return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
		}

		#region Create Project POST
		[HttpPost]
		public async Task<IActionResult> Create(CreateProjectRequest request)
		{
			var userId = GetCurrentUserId();

			var role = await _accessService
				.GetUserRoleInWorkspace(userId, request.WorkspaceId);

			if (role == null)
				return Forbid("Not a member of this workspace.");

			if (role == "Member")
				return Forbid("Members cannot create projects.");

			var project = new Project
			{
				Name = request.Name,
				Description = request.Description,
				WorkspaceId = request.WorkspaceId
			};

			_context.Projects.Add(project);
			await _context.SaveChangesAsync();

			return Ok(new ProjectResponse
			{
				Id = project.Id,
				Name = project.Name,
				Description = project.Description,
				WorkspaceId = project.WorkspaceId,
				CreatedAt = project.CreatedAt
			});
		}
		#endregion

		#region GET Project
		[HttpGet("workspace/{workspaceId}")]
		public async Task<IActionResult> GetByWorkspace(Guid workspaceId)
		{
			var workspace = await _context.Workspaces
				.FirstOrDefaultAsync(w =>
					w.Id == workspaceId &&
					w.OwnerId == GetCurrentUserId());

			if (workspace == null)
				return Forbid("You do not own this workspace.");

			var projects = await _context.Projects
				.Where(p => p.WorkspaceId == workspaceId)
				.Select(p => new ProjectResponse
				{
					Id = p.Id,
					Name = p.Name,
					Description = p.Description,
					WorkspaceId = p.WorkspaceId,
					CreatedAt = p.CreatedAt
				})
				.ToListAsync();

			return Ok(projects);
		}

		#endregion

	}

}
