using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace OpTeamUs.Controllers
{
	[ApiController]
	[Route("api/test")]
	public class TestController : ControllerBase
	{
		// Public GET
		[HttpGet("public")]
		public IActionResult Public()
		{
			return Ok("This is a public endpoint.");
		}

		[Authorize]
		[HttpGet("protected")]
		public IActionResult Protected()
		{
			var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
			var email = User.FindFirstValue(ClaimTypes.Email);

			return Ok(new
			{
				Message = "You are authenticated!",
				UserId = userId,
				Email = email
			});
		}

		// Authorized GET
		[Authorize(Roles = "Admin")]
		[HttpGet("admin-only")]
		public IActionResult AdminOnly()
		{
			return Ok("You are an Admin.");
		}


	}
}
