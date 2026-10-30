using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using OpTeamUs.Controllers;
using OpTeamUs.DTOs;
using OpTeamUs.Models;
using OpTeamUs.Services;
using OpTeamUs.Tests.Helpers;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace OpTeamUs.Tests.Unit.Controllers
{
	public class AuthControllerTests
	{
		private JwtService CreateJwtService()
		{
			var inMemorySettings = new Dictionary<string, string?>
			{
				{ "Jwt:Key", "SuperSecretKeyForAuthControllerTests123456!" },
				{ "Jwt:Issuer", "TestIssuer" },
				{ "Jwt:Audience", "TestAudience" },
				{ "Jwt:ExpiryMinutes", "60" }
			};

			var configuration = new ConfigurationBuilder()
				.AddInMemoryCollection(inMemorySettings)
				.Build();

			return new JwtService(configuration);
		}

		[Fact]
		public async Task Register_WhenEmailIsNew_ReturnsOkWithTokenAndSavesUser()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var jwtService = CreateJwtService();
			var controller = new AuthController(context, jwtService);

			var request = new RegisterRequest
			{
				Email = "newuser@example.com",
				Password = "Password123!",
				FirstName = "John",
				LastName = "Doe"
			};

			// Act
			var result = await controller.Register(request);

			// Assert
			var okResult = Assert.IsType<OkObjectResult>(result);
			var response = Assert.IsType<AuthResponse>(okResult.Value);
			Assert.False(string.IsNullOrWhiteSpace(response.Token));

			var savedUser = await context.Users.FindAsync(response.Token != null ? (await context.Users.FirstAsync()).Id : Guid.Empty);
			Assert.NotNull(savedUser);
			Assert.Equal("newuser@example.com", savedUser.Email);
			Assert.Equal("John", savedUser.FirstName);
			Assert.Equal("User", savedUser.Role);
			Assert.True(BCrypt.Net.BCrypt.Verify("Password123!", savedUser.PasswordHash));
		}

		[Fact]
		public async Task Register_WhenEmailAlreadyExists_ReturnsBadRequest()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var jwtService = CreateJwtService();
			var controller = new AuthController(context, jwtService);

			context.Users.Add(new User
			{
				Id = Guid.NewGuid(),
				Email = "duplicate@example.com",
				PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!")
			});
			await context.SaveChangesAsync();

			var request = new RegisterRequest
			{
				Email = "duplicate@example.com",
				Password = "AnotherPassword123!"
			};

			// Act
			var result = await controller.Register(request);

			// Assert
			var badRequest = Assert.IsType<BadRequestObjectResult>(result);
			Assert.Equal("Email already exists", badRequest.Value);
		}

		[Fact]
		public async Task Login_WhenUserNotFound_ReturnsUnauthorized()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var jwtService = CreateJwtService();
			var controller = new AuthController(context, jwtService);

			var request = new LoginRequest
			{
				Email = "nonexistent@example.com",
				Password = "Password123!"
			};

			// Act
			var result = await controller.Login(request);

			// Assert
			var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
			Assert.Equal("Invalid credentials", unauthorized.Value);
		}

		[Fact]
		public async Task Login_WhenPasswordInvalid_ReturnsUnauthorized()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var jwtService = CreateJwtService();
			var controller = new AuthController(context, jwtService);

			context.Users.Add(new User
			{
				Id = Guid.NewGuid(),
				Email = "validuser@example.com",
				PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!")
			});
			await context.SaveChangesAsync();

			var request = new LoginRequest
			{
				Email = "validuser@example.com",
				Password = "WrongPassword123!"
			};

			// Act
			var result = await controller.Login(request);

			// Assert
			var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
			Assert.Equal("Invalid credentials", unauthorized.Value);
		}

		[Fact]
		public async Task Login_WhenCredentialsAreValid_ReturnsOkWithToken()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var jwtService = CreateJwtService();
			var controller = new AuthController(context, jwtService);

			context.Users.Add(new User
			{
				Id = Guid.NewGuid(),
				Email = "validuser@example.com",
				PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!"),
				Role = "User"
			});
			await context.SaveChangesAsync();

			var request = new LoginRequest
			{
				Email = "validuser@example.com",
				Password = "CorrectPassword123!"
			};

			// Act
			var result = await controller.Login(request);

			// Assert
			var okResult = Assert.IsType<OkObjectResult>(result);
			var response = Assert.IsType<AuthResponse>(okResult.Value);
			Assert.False(string.IsNullOrWhiteSpace(response.Token));
		}

		[Fact]
		public async Task Me_WhenAuthenticated_ReturnsCurrentUserInfo()
		{
			// Arrange
			using var context = TestDbContextFactory.CreateInMemoryDbContext();
			var jwtService = CreateJwtService();
			var controller = new AuthController(context, jwtService);

			var userId = Guid.NewGuid();
			var user = new User
			{
				Id = userId,
				Email = "me@example.com",
				FirstName = "Jane",
				LastName = "Smith",
				Role = "User"
			};
			context.Users.Add(user);
			await context.SaveChangesAsync();

			TestControllerHelper.SetUserContext(controller, userId, "User", "me@example.com");

			// Act
			var result = await controller.Me();

			// Assert
			var okResult = Assert.IsType<OkObjectResult>(result);
			Assert.NotNull(okResult.Value);
		}
	}
}
