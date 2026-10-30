using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OpTeamUs.Data;
using OpTeamUs.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ===============================
// SERVICES
// ===============================

// Controllers
builder.Services.AddControllers();

// Adding CORS Services
builder.Services.AddCors(options =>
{
	options.AddPolicy("AllowFrontend",
		policy =>
		{
			policy.WithOrigins("http://localhost:3000")
				  .AllowAnyHeader()
				  .AllowAnyMethod();
		});

	options.AddPolicy("FrontendPolicy", policy =>
	{
		policy.WithOrigins("http://localhost:8081")
			  .AllowAnyHeader()
			  .AllowAnyMethod();
	});
});


// Swagger with JWT Support
builder.Services.AddSwaggerGen(options =>
{
	options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
	{
		Name = "Authorization",
		Type = SecuritySchemeType.Http,
		Scheme = "bearer",
		BearerFormat = "JWT",
		In = ParameterLocation.Header,
		Description = "Enter JWT token"
	});

	options.AddSecurityRequirement(new OpenApiSecurityRequirement
	{
		{
			new OpenApiSecurityScheme
			{
				Reference = new OpenApiReference
				{
					Type = ReferenceType.SecurityScheme,
					Id = "Bearer"
				}
			},
			Array.Empty<string>()
		}
	});
});

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
	connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
		?? "Host=localhost;Port=5432;Database=teamopsdb;Username=teamops";
}

builder.Services.AddDbContext<AppDbContext>(options =>
	options.UseNpgsql(connectionString));

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
	?? builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(secretKey))
{
	secretKey = "DefaultInsecureDevSecretKeyMustBe32Bytes!";
}

var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateIssuer = true,
			ValidateAudience = true,
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,
			ValidIssuer = jwtSettings["Issuer"] ?? "TeamOps",
			ValidAudience = jwtSettings["Audience"] ?? "TeamOpsUsers",
			IssuerSigningKey = new SymmetricSecurityKey(key)
		};
	});

builder.Services.AddAuthorization();

// Custom Services
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<WorkspaceAccessService>();

// ===============================
// BUILD APP
// ===============================

var app = builder.Build();

// ===============================
// MIDDLEWARE PIPELINE (ORDER MATTERS)
// ===============================

app.UseRouting();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

// ===============================
// AUTO MIGRATIONS
// ===============================

if (!app.Environment.IsEnvironment("Testing"))
{
	using (var scope = app.Services.CreateScope())
	{
		var services = scope.ServiceProvider;
		var dbContext = services.GetRequiredService<AppDbContext>();

		var retries = 10;
		while (retries > 0)
		{
			try
			{
				await dbContext.Database.MigrateAsync();
				break;
			}
			catch
			{
				retries--;
				await Task.Delay(3000);
			}
		}
	}
}

await app.RunAsync();

public partial class Program { }
