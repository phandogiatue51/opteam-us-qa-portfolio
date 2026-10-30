using Microsoft.EntityFrameworkCore;
using OpTeamUs.Data;
using System;

namespace OpTeamUs.Tests.Helpers
{
	public static class TestDbContextFactory
	{
		public static AppDbContext CreateInMemoryDbContext(string? dbName = null)
		{
			var options = new DbContextOptionsBuilder<AppDbContext>()
				.UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
				.Options;

			return new AppDbContext(options);
		}
	}
}

