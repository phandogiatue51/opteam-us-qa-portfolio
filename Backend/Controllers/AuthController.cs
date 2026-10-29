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
	//[Route("api/[controller]")] // original
	[Route("auth")]
	public class AuthController : ControllerBase
	{

		private readonly AppDbContext _context;
		private readonly JwtService _jwtService;

		public AuthController(AppDbContext context, JwtService jwtService)
		{
			_context = context;
			_jwtService = jwtService;
		}

		#region Register User Post 
		[HttpPost("register")]
		public async Task<IActionResult> Register(RegisterRequest request)
		{
			if (await _context.Users.AnyAsync(u => u.Email == request.Email))
				return BadRequest("Email already exists");

			var user = new User
			{

				Email = request.Email,
				FirstName = request.FirstName,
				LastName = request.LastName,
				PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
				Role = "User" // default role 
			};

			_context.Users.Add(user);
			await _context.SaveChangesAsync();

			var token = _jwtService.GenerateToken(user);

			return Ok(new AuthResponse { Token = token });
		}

		#endregion

		#region Login User Post 
		[HttpPost("login")]
		public async Task<IActionResult> Login(LoginRequest request)
		{
			var user = await _context.Users
				.FirstOrDefaultAsync(u => u.Email == request.Email);

			if (user == null)
				return Unauthorized("Invalid credentials");

			var validPassword = BCrypt.Net.BCrypt.Verify(
				request.Password,
				user.PasswordHash
			);

			if (!validPassword)
				return Unauthorized("Invalid credentials");

			var token = _jwtService.GenerateToken(user);

			return Ok(new AuthResponse { Token = token });
		}

		#endregion

		#region GET User 
		[Authorize]
		[HttpGet("me")]
		public async Task<IActionResult> Me()
		{
			var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

			var user = await _context.Users
				.Where(u => u.Id == userId)
				.Select(u => new
				{
					u.Id,
					u.FirstName,
					u.LastName,
					u.Email,
					u.CreatedAt,
					u.Role
				})
				.FirstOrDefaultAsync();

			if (user == null)
				return NotFound();

			return Ok(user);
		}

		#endregion

	}

}
