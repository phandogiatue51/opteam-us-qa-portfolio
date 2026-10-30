using Microsoft.Extensions.Configuration;
using OpTeamUs.Models;
using OpTeamUs.Services;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Xunit;

namespace OpTeamUs.Tests.Unit.Services
{
	public class JwtServiceTests
	{
		private JwtService CreateJwtService()
		{
			var inMemorySettings = new Dictionary<string, string?>
			{
				{ "Jwt:Key", "ThisIsASuperSecretKeyForTestingOpTeamUs123456!" },
				{ "Jwt:Issuer", "TestIssuer" },
				{ "Jwt:Audience", "TestAudience" },
				{ "Jwt:ExpiryMinutes", "60" }
			};

			IConfiguration configuration = new ConfigurationBuilder()
				.AddInMemoryCollection(inMemorySettings)
				.Build();

			return new JwtService(configuration);
		}

		[Fact]
		public void GenerateToken_ReturnsValidTokenFormat()
		{
			// Arrange
			var jwtService = CreateJwtService();
			var user = new User
			{
				Id = Guid.NewGuid(),
				Email = "john.doe@example.com",
				Role = "User"
			};

			// Act
			var token = jwtService.GenerateToken(user);

			// Assert
			Assert.False(string.IsNullOrWhiteSpace(token));
			var tokenParts = token.Split('.');
			Assert.Equal(3, tokenParts.Length); // Header.Payload.Signature
		}

		[Fact]
		public void GenerateToken_IncludesExpectedClaimsAndIssuer()
		{
			// Arrange
			var jwtService = CreateJwtService();
			var userId = Guid.NewGuid();
			var email = "admin@example.com";
			var role = "Admin";

			var user = new User
			{
				Id = userId,
				Email = email,
				Role = role
			};

			// Act
			var tokenString = jwtService.GenerateToken(user);

			// Assert
			var handler = new JwtSecurityTokenHandler();
			var jwt = handler.ReadJwtToken(tokenString);

			Assert.Equal("TestIssuer", jwt.Issuer);
			Assert.Contains(jwt.Audiences, a => a == "TestAudience");
			Assert.Equal(userId.ToString(), jwt.Claims.First(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "nameid").Value);
			Assert.Equal(email, jwt.Claims.First(c => c.Type == ClaimTypes.Email || c.Type == "email").Value);
			Assert.Equal(role, jwt.Claims.First(c => c.Type == ClaimTypes.Role || c.Type == "role").Value);
		}
	}
}

