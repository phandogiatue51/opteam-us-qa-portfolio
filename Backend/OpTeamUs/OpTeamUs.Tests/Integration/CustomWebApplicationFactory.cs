using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OpTeamUs.Data;
using System;
using System.Linq;

namespace OpTeamUs.Tests.Integration
{
	public class CustomWebApplicationFactory : WebApplicationFactory<Program>
	{
		private readonly string _databaseName = Guid.NewGuid().ToString();

		protected override void ConfigureWebHost(IWebHostBuilder builder)
		{
			builder.UseEnvironment("Testing");

			builder.ConfigureServices(services =>
			{
				// Remove existing PostgreSQL AppDbContext registration
				var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
				if (descriptor != null)
				{
					services.Remove(descriptor);
				}

				// Register InMemory database for tests
				services.AddDbContext<AppDbContext>(options =>
				{
					options.UseInMemoryDatabase(_databaseName);
				});
			});
		}
	}
}
