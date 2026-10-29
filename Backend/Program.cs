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

// CORS Policy (VERY IMPORTANT)
builder.Services.AddCors(options =>
{
	options.AddPolicy("FrontendPolicy", policy =>
	{
		policy.WithOrigins("http://localhost:8081")
			  .AllowAnyHeader()
			  .AllowAnyMethod();
	});
});

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
	options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateIssuer = true,
			ValidateAudience = true,
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,
			ValidIssuer = jwtSettings["Issuer"],
			ValidAudience = jwtSettings["Audience"],
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

//app.UseCors("FrontendPolicy");   // MUST BE HERE
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

// ===============================
// AUTO MIGRATIONS
// ===============================

using (var scope = app.Services.CreateScope())
{
	var services = scope.ServiceProvider;
	var dbContext = services.GetRequiredService<AppDbContext>();

	var retries = 10;
	while (retries > 0)
	{
		try
		{
			dbContext.Database.Migrate();
			break;
		}
		catch
		{
			retries--;
			Thread.Sleep(3000);
		}
	}
}

app.Run();