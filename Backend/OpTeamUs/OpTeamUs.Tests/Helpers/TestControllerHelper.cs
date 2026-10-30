using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;

namespace OpTeamUs.Tests.Helpers
{
	public static class TestControllerHelper
	{
		public static void SetUserContext(ControllerBase controller, Guid userId, string role = "User", string email = "test@example.com")
		{
			var claims = new[]
			{
				new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
				new Claim(ClaimTypes.Role, role),
				new Claim(ClaimTypes.Email, email)
			};

			var identity = new ClaimsIdentity(claims, "TestAuth");
			var claimsPrincipal = new ClaimsPrincipal(identity);

			controller.ControllerContext = new ControllerContext
			{
				HttpContext = new DefaultHttpContext
				{
					User = claimsPrincipal
				}
			};
		}
	}
}

