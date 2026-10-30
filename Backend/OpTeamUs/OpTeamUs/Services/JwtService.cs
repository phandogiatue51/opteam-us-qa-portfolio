using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using OpTeamUs.Models;

namespace OpTeamUs.Services
{
	public class JwtService
	{
		private readonly IConfiguration _configuration;

		public JwtService(IConfiguration configuration)
		{
			_configuration = configuration;
		}

		public string GenerateToken(User user)
		{
			var jwtSettings = _configuration.GetSection("Jwt");
			var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
				?? _configuration["Jwt:Key"];

			if (string.IsNullOrWhiteSpace(secretKey))
			{
				secretKey = "DefaultInsecureDevSecretKeyMustBe32Bytes!";
			}

			var key = new SymmetricSecurityKey(
				Encoding.UTF8.GetBytes(secretKey)
			);

			var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var claims = new[]
			{
				new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
				new Claim(ClaimTypes.Email, user.Email),
				new Claim(ClaimTypes.Role, user.Role)
			};

			var token = new JwtSecurityToken(
				issuer: jwtSettings["Issuer"],
				audience: jwtSettings["Audience"],
				claims: claims,
				expires: DateTime.UtcNow.AddMinutes(
					int.Parse(jwtSettings["ExpiryMinutes"] ?? "60")
				),
				signingCredentials: credentials
			);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}
	}
}
