using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace Horizon.Controllers
{
    [Route("api/projects")]
    [ApiController]
    public class ProjectsController : ControllerBase
    {
        private readonly string _projectsFilePath;
        private readonly IWebHostEnvironment _env;

        public ProjectsController(IWebHostEnvironment env)
        {
            _env = env;
            _projectsFilePath = Path.Combine(env.ContentRootPath, "Data", "projects_data.json");
            
            var directory = Path.GetDirectoryName(_projectsFilePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }
        }

        /// <summary>
        /// Load projects from JSON file
        /// </summary>
        [HttpGet("load")]
        public async Task<IActionResult> LoadProjects()
        {
            try
            {
                Console.WriteLine($"[LOAD] 📥 Reading from: {_projectsFilePath}");
                
                if (!System.IO.File.Exists(_projectsFilePath))
                {
                    Console.WriteLine("[LOAD] ⚠️ File not found, returning empty");
                    return Ok(new ProjectDataModel 
                    { 
                        Projects = new List<ProjectModel>(),
                        LastUpdated = DateTime.UtcNow,
                        Version = "2.0"
                    });
                }
                
                var json = await System.IO.File.ReadAllTextAsync(_projectsFilePath, System.Text.Encoding.UTF8);
                var data = JsonSerializer.Deserialize<ProjectDataModel>(json, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                
                Console.WriteLine($"[LOAD] ✅ Loaded {data?.Projects?.Count ?? 0} projects");
                return Ok(data);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LOAD] ❌ Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Save projects to JSON file
        /// </summary>
        [HttpPost("save")]
        public async Task<IActionResult> SaveProjects([FromBody] ProjectDataModel data)
        {
            try
            {
                Console.WriteLine($"[SAVE] 💾 Saving to: {_projectsFilePath}");
                
                if (data?.Projects == null)
                {
                    return BadRequest(new { success = false, message = "Invalid project data" });
                }
                
                data.LastUpdated = DateTime.UtcNow;
                data.Version = "2.0";
                
                var json = JsonSerializer.Serialize(data, new JsonSerializerOptions 
                { 
                    WriteIndented = true,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                });
                
                await System.IO.File.WriteAllTextAsync(_projectsFilePath, json, System.Text.Encoding.UTF8);
                Console.WriteLine($"[SAVE] ✅ Saved {data.Projects.Count} projects");
                
                return Ok(new { success = true, message = "Projects saved successfully", count = data.Projects.Count });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SAVE] ❌ Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    // ===== DATA MODELS =====
    
    public class ProjectDataModel
    {
        public List<ProjectModel> Projects { get; set; } = new();
        public DateTime LastUpdated { get; set; }
        public string Version { get; set; } = "2.0";
    }

    public class ProjectModel
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string CountryName { get; set; } = string.Empty;
        public string Flag { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public int Progress { get; set; }
        public string Scale { get; set; } = "medium";
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public int Budget { get; set; }
        public string Description { get; set; } = string.Empty;
        public int TeamSize { get; set; }
        public string Manager { get; set; } = string.Empty;
        public string Initials { get; set; } = string.Empty;
        public string ModifiedBy { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string PlanviewNumber { get; set; } = string.Empty;
        public string CreatedDate { get; set; } = string.Empty;
        public string? LastModified { get; set; }
    }
}