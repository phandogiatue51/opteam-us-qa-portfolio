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
	[Route("api/members")]
	[Authorize]
	public class MembershipController : ControllerBase
	{

		private readonly AppDbContext _context;

		public MembershipController(AppDbContext context)
		{
			_context = context;
		}

		private Guid GetCurrentUserId()
		{
			return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
		}

		#region Invite Memeber POST
		[HttpPost("invite")]
		public async Task<IActionResult> Invite(InviteMemberRequest request)
		{
			var workspace = await _context.Workspaces
				.FirstOrDefaultAsync(w =>
					w.Id == request.WorkspaceId &&
					w.OwnerId == GetCurrentUserId());

			if (workspace == null)
				return Forbid("Only workspace owner can invite members.");

			var user = await _context.Users
				.FirstOrDefaultAsync(u => u.Email == request.Email);

			if (user == null)
				return NotFound("User not found.");

			var existingMembership = await _context.WorkspaceMembers
				.FirstOrDefaultAsync(m =>
					m.WorkspaceId == request.WorkspaceId &&
					m.UserId == user.Id);

			if (existingMembership != null)
				return BadRequest("User already a member.");

			var membership = new WorkspaceMember
			{
				WorkspaceId = request.WorkspaceId,
				UserId = user.Id,
				Role = request.Role
			};

			_context.WorkspaceMembers.Add(membership);
			await _context.SaveChangesAsync();

			return Ok("Member added successfully.");
		}
		#endregion

		#region GET Existing Memember
		[HttpGet("workspace/{workspaceId}")]
		public async Task<IActionResult> GetMembers(Guid workspaceId)
		{
			var userId = GetCurrentUserId();

			var isMember = await _context.WorkspaceMembers
				.AnyAsync(m =>
					m.WorkspaceId == workspaceId &&
					m.UserId == userId);

			if (!isMember)
				return Forbid("You are not a member of this workspace.");

			var members = await _context.WorkspaceMembers
				.Where(m => m.WorkspaceId == workspaceId)
				.Include(m => m.User)
				.Select(m => new
				{
					m.User.Email,
					m.Role,
					m.JoinedAt
				})
				.ToListAsync();

			return Ok(members);
		}
		#endregion

	}
}
