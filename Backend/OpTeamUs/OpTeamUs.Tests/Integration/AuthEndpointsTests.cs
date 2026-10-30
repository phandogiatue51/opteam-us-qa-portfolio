using OpTeamUs.DTOs;
using System;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;

namespace OpTeamUs.Tests.Integration
{
	public class AuthEndpointsTests : IClassFixture<CustomWebApplicationFactory>
	{
		private readonly CustomWebApplicationFactory _factory;

		public AuthEndpointsTests(CustomWebApplicationFactory factory)
		{
			_factory = factory;
		}

		[Fact]
		public async Task Register_And_Login_FullLifecycle_Succeeds()
		{
			var client = _factory.CreateClient();
			var email = $"integration_{Guid.NewGuid():N}@example.com";
			var password = "StrongPassword123!";

			// 1. Register new user
			var registerRequest = new RegisterRequest
			{
				Email = email,
				Password = password,
				FirstName = "Integration",
				LastName = "Tester"
			};

			var regResponse = await client.PostAsJsonAsync("/auth/register", registerRequest);
			Assert.Equal(HttpStatusCode.OK, regResponse.StatusCode);

			var regAuth = await regResponse.Content.ReadFromJsonAsync<AuthResponse>();
			Assert.NotNull(regAuth);
			Assert.False(string.IsNullOrWhiteSpace(regAuth.Token));

			// 2. Register again with same email -> 400 Bad Request
			var dupResponse = await client.PostAsJsonAsync("/auth/register", registerRequest);
			Assert.Equal(HttpStatusCode.BadRequest, dupResponse.StatusCode);

			// 3. Login with wrong password -> 401 Unauthorized
			var wrongLoginResponse = await client.PostAsJsonAsync("/auth/login", new LoginRequest
			{
				Email = email,
				Password = "WrongPassword!"
			});
			Assert.Equal(HttpStatusCode.Unauthorized, wrongLoginResponse.StatusCode);

			// 4. Login with correct credentials -> 200 OK
			var loginResponse = await client.PostAsJsonAsync("/auth/login", new LoginRequest
			{
				Email = email,
				Password = password
			});
			Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

			var loginAuth = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
			Assert.NotNull(loginAuth);
			Assert.False(string.IsNullOrWhiteSpace(loginAuth.Token));

			// 5. Access /auth/me without token -> 401 Unauthorized
			var unauthMe = await client.GetAsync("/auth/me");
			Assert.Equal(HttpStatusCode.Unauthorized, unauthMe.StatusCode);

			// 6. Access /auth/me with Bearer token -> 200 OK
			using var meRequest = new HttpRequestMessage(HttpMethod.Get, "/auth/me");
			meRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", loginAuth.Token);

			var authMeResponse = await client.SendAsync(meRequest);
			Assert.Equal(HttpStatusCode.OK, authMeResponse.StatusCode);
		}
	}
}
