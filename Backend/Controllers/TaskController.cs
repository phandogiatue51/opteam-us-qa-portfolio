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
	[Route("api/tasks")]
	[Authorize]
	public class TaskController : ControllerBase
	{

		private readonly AppDbContext _context;

		private readonly WorkspaceAccessService _accessService;

		public TaskController(AppDbContext context, WorkspaceAccessService accessService)
		{
			_context = context;
			_accessService = accessService;
		}

		private Guid GetCurrentUserId()
		{
			return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
		}

		#region Create Task Item POST
		[HttpPost]
		public async Task<IActionResult> Create(CreateTaskRequest request)
		{
			//var project = await _context.Projects
			//	.Include(p => p.Workspace)
			//	.FirstOrDefaultAsync(p =>
			//		p.Id == request.ProjectId &&
			//		p.Workspace.OwnerId == GetCurrentUserId());

			//if (project == null)
			//	return Forbid("You do not own this project.");

			var project = await _context.Projects.Include(p => p.Workspace).FirstOrDefaultAsync(p => p.Id == request.ProjectId);

			if (project == null)
				return NotFound("Project not found.");

			var userId = GetCurrentUserId();

			var role = await _accessService
				.GetUserRoleInWorkspace(userId, project.WorkspaceId);

			if (role == null)
				return Forbid("Not a member of this workspace.");



			var taskItem = new TaskItem
			{
				Title = request.Title,
				Description = request.Description,
				ProjectId = project.Id
			};

			_context.Tasks.Add(taskItem);
			await _context.SaveChangesAsync();

			return Ok(new TaskResponse
			{
				Id = taskItem.Id,
				Title = taskItem.Title,
				Description = taskItem.Description,
				Status = taskItem.Status,
				ProjectId = taskItem.ProjectId,
				CreatedAt = taskItem.CreatedAt
			});
		}

		#endregion

		#region GET Task Item
		[HttpGet("project/{projectId}")]
		public async Task<IActionResult> GetByProject(Guid projectId)
		{
			var project = await _context.Projects
				.Include(p => p.Workspace)
				.FirstOrDefaultAsync(p =>
					p.Id == projectId &&
					p.Workspace.OwnerId == GetCurrentUserId());

			if (project == null)
				return Forbid("You do not own this project.");

			var tasks = await _context.Tasks
				.Where(t => t.ProjectId == projectId)
				.Select(t => new TaskResponse
				{
					Id = t.Id,
					Title = t.Title,
					Description = t.Description,
					Status = t.Status,
					ProjectId = t.ProjectId,
					CreatedAt = t.CreatedAt
				})
				.ToListAsync();

			return Ok(tasks);
		}

		#endregion

		#region Update task PUT
		[HttpPut("{id}")]
		public async Task<IActionResult> Update(Guid id, UpdateTaskRequest request)
		{
			var task = await _context.Tasks.FindAsync(id);

			if (task == null)
				return NotFound();

			var allowedStatuses = new[] { "todo", "in-progress", "done" };

			if (!allowedStatuses.Contains(request.Status.ToLower()))
			{
				return BadRequest("Invalid status value.");
			}

			task.Status = request.Status.ToLower();

			await _context.SaveChangesAsync();

			return Ok(new TaskResponse
			{
				Id = task.Id,
				Title = task.Title,
				Description = task.Description,
				Status = task.Status,
				ProjectId = task.ProjectId,
				CreatedAt = task.CreatedAt
			});
		}
		#endregion

		#region Delete task DELETE

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(Guid id)
		{
			var task = await _context.Tasks
				.Include(t => t.Project)
				.ThenInclude(p => p.Workspace)
				.FirstOrDefaultAsync(t => t.Id == id);

			if (task == null)
				return NotFound("Task not found.");

			var userId = GetCurrentUserId();

			var role = await _accessService
				.GetUserRoleInWorkspace(userId, task.Project.WorkspaceId);

			if (role == null)
				return Forbid("Not authorized in this workspace.");

			_context.Tasks.Remove(task);
			await _context.SaveChangesAsync();

			return NoContent();
		}

		#endregion


	}
}
