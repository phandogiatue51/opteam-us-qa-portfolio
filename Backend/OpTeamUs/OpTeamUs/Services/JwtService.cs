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

			var key = new SymmetricSecurityKey(
				Encoding.UTF8.GetBytes(jwtSettings["Key"]!)
			);

			var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var claims = new[]
			{
				//new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
				//new Claim(JwtRegisteredClaimNames.Email, user.Email)
				new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
				new Claim(ClaimTypes.Email, user.Email),
				new Claim(ClaimTypes.Role, user.Role)

			};

			var token = new JwtSecurityToken(
				issuer: jwtSettings["Issuer"],
				audience: jwtSettings["Audience"],
				claims: claims,
				expires: DateTime.UtcNow.AddMinutes(
					int.Parse(jwtSettings["ExpiryMinutes"]!)
				),
				signingCredentials: credentials
			);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}

	}
}
