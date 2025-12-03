using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using ExcelDataReader;
using Horizon.Services;
using System.Data;
using System.Text;

namespace Horizon.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DataController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly string _dataPath;
        private readonly ILogger<DataController> _logger;
        private readonly IDataSyncService _dataSyncService;

        public DataController(
            IWebHostEnvironment environment,
            ILogger<DataController> logger,
            IConfiguration configuration,
            IDataSyncService dataSyncService)
        {
            _environment = environment;
            _logger = logger;
            _dataSyncService = dataSyncService;
            _dataPath = configuration.GetValue<string>("DataPath")
                        ?? Path.Combine(environment.ContentRootPath, "Data");

            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

            if (!Directory.Exists(_dataPath))
            {
                Directory.CreateDirectory(_dataPath);
                _logger.LogInformation("Data directory created at: {DataPath}", _dataPath);
            }
        }


        // ============================================================
        // HELPER METHODS
        // ============================================================

        private string NormalizeColumnName(string columnName)
        {
            return columnName
                .ToLower()
                .Replace(" ", "_")
                .Replace("-", "_")
                .Replace(".", "_")
                                .TrimEnd('_');

        }

        private List<Dictionary<string, object>> ReadExcelFile(string fileName)
        {
            var filePath = Path.Combine(_dataPath, fileName);

            if (!System.IO.File.Exists(filePath))
            {
                throw new FileNotFoundException($"Excel file not found: {fileName}");
            }

            var assets = new List<Dictionary<string, object>>();

            // Use FileShare.ReadWrite to allow other processes to access the file
            using (var stream = System.IO.File.Open(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            using (var reader = ExcelReaderFactory.CreateReader(stream))
            {
                var result = reader.AsDataSet(new ExcelDataSetConfiguration()
{
    UseColumnDataType = false,
    ConfigureDataTable = (_) => new ExcelDataTableConfiguration()
    {
        UseHeaderRow = true,
        FilterRow = r => true
    }
});


                var table = result.Tables[0];

                _logger.LogInformation("Reading Excel file '{FileName}' with {ColumnCount} columns and {RowCount} rows.",
                    fileName, table.Columns.Count, table.Rows.Count);

                foreach (DataRow row in table.Rows)
                {
                    var asset = new Dictionary<string, object>();
                    var seenKeys = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

                    foreach (DataColumn column in table.Columns)
                    {
                        var rawName = column.ColumnName?.Trim();
                        if (string.IsNullOrWhiteSpace(rawName))
                            rawName = $"column_{column.Ordinal + 1}";

                        string key = NormalizeColumnName(rawName);

                        // Handle duplicate column names (e.g., multiple "Country code" columns)
                        // For duplicates, use the LAST occurrence
                        if (seenKeys.ContainsKey(key))
                        {
                            seenKeys[key]++;
                            // Overwrite with latest value - this ensures we use the LAST column
                        }
                        else
                        {
                            seenKeys[key] = 1;
                        }

                        var value = row[column];
                        asset[key] = value == DBNull.Value ? null : value;
                    }

                    assets.Add(asset);
                }
            }

            return assets;
        }

        private async Task<string> ReadJsonFile(string fileName)
        {
            var filePath = Path.Combine(_dataPath, fileName);

            if (!System.IO.File.Exists(filePath))
            {
                throw new FileNotFoundException($"JSON file not found: {fileName}");
            }

            return await System.IO.File.ReadAllTextAsync(filePath);
        }

        // ============================================================
        // DATA SYNC ENDPOINT
        // ============================================================

        [HttpPost("sync")]
        public async Task<IActionResult> TriggerSync(CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Manual data sync requested.");
                await _dataSyncService.TriggerSyncAsync(cancellationToken);
                return Ok(new { message = "Data sync triggered." });
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Manual data sync request was cancelled.");
                return StatusCode(499, new { error = "Data sync cancelled" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Manual data sync failed.");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================================
        // INVENTORY ENDPOINT
        // ============================================================

        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventory()
        {
            try
            {
                var apiDataDir = Path.Combine(_environment.WebRootPath, "api", "data");
                var filePath = Path.Combine(apiDataDir, "inventory.json");

                if (!System.IO.File.Exists(filePath))
                {
                    if (!Directory.Exists(apiDataDir))
                    {
                        Directory.CreateDirectory(apiDataDir);
                        _logger.LogWarning("Created missing 'api/data' directory at {DataDir}", apiDataDir);
                    }

                    _logger.LogWarning("Inventory file not found at {FilePath}", filePath);
                    return NotFound(new { error = "Inventory file not found" });
                }
                
                var json = await System.IO.File.ReadAllTextAsync(filePath);
                return Content(json, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading inventory file.");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================================
        // APPS ENDPOINT
        // ============================================================

        [HttpGet("apps")]
        public async Task<IActionResult> GetApps()
        {
            try
            {
                var json = await ReadJsonFile("apps.json");
                return Content(json, "application/json");
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading apps.json");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================================
        // CONTRACTS ENDPOINT
        // ============================================================

        [HttpGet("contracts")]
        public async Task<IActionResult> GetContracts()
        {
            try
            {
                var json = await ReadJsonFile("contracts.json");
                return Content(json, "application/json");
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading contracts.json");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================================
        // ASSETS ENDPOINT - EXCEL READER
        // ============================================================

        [HttpGet("assets")]
        public IActionResult GetAssets()
        {
            try
            {
                var assets = ReadExcelFile("Horizon_Report.xlsx");
                var json = JsonSerializer.Serialize(assets);
                return Content(json, "application/json");
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading assets Excel file.");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================================
        // STOCKROOM ENDPOINTS
        // ============================================================
        
        [HttpGet("stockroom-assets")]
        public IActionResult GetStockroomAssets()
        {
            try
            {
                string excelPath = Path.Combine(_environment.ContentRootPath, "Data", "Horizon_Stocks.xlsx");
                
                if (!System.IO.File.Exists(excelPath))
                {
                    _logger.LogWarning("Stockroom assets file not found: {ExcelPath}", excelPath);
                    return NotFound(new { error = "File not found", path = excelPath });
                }

                using (var stream = System.IO.File.Open(excelPath, FileMode.Open, FileAccess.Read))
                using (var reader = ExcelReaderFactory.CreateReader(stream))
                {
                    var result = reader.AsDataSet(new ExcelDataSetConfiguration()
{
    UseColumnDataType = false,
    ConfigureDataTable = (_) => new ExcelDataTableConfiguration()
    {
        UseHeaderRow = true,
        FilterRow = r => true
    }
});


                    var table = result.Tables[0];
                    var assets = new List<Dictionary<string, object>>();

                    foreach (DataRow row in table.Rows)
                    {
                        var asset = new Dictionary<string, object>();
                        foreach (DataColumn column in table.Columns)
                        {
                            string key = column.ColumnName.ToLower().Replace(" ", "_").Replace(".", "_");
                            var value = row[column];
                            asset[key] = value == DBNull.Value ? null : value;
                        }
                        assets.Add(asset);
                    }

                    return Content(JsonSerializer.Serialize(assets), "application/json");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading stockroom assets Excel file.");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("stockroom-summary")]
        public IActionResult GetStockroomSummary()
        {
            try
            {
                string excelPath = Path.Combine(_environment.ContentRootPath, "Data", "Horizon_Stocks.xlsx");
                
                if (!System.IO.File.Exists(excelPath))
                {
                    _logger.LogWarning("Stock summary file not found: {ExcelPath}", excelPath);
                    return NotFound(new { error = "File not found" });
                }

                using (var stream = System.IO.File.Open(excelPath, FileMode.Open, FileAccess.Read))
                using (var reader = ExcelReaderFactory.CreateReader(stream))
                {
                    var result = reader.AsDataSet(new ExcelDataSetConfiguration()
{
    UseColumnDataType = false,
    ConfigureDataTable = (_) => new ExcelDataTableConfiguration()
    {
        UseHeaderRow = true,
        FilterRow = r => true
    }
});


                    var table = result.Tables[0];
                    var countryGroups = new Dictionary<string, int>();
                    var substateGroups = new Dictionary<string, int>();

                    foreach (DataRow row in table.Rows)
                    {
                        var country = row["Country"]?.ToString() ?? "Unknown";
                        var substate = row["Substate"]?.ToString() ?? "Unknown";
                        
                        if (!countryGroups.ContainsKey(country)) countryGroups[country] = 0;
                        countryGroups[country]++;
                        
                        if (!substateGroups.ContainsKey(substate)) substateGroups[substate] = 0;
                        substateGroups[substate]++;
                    }

                    var summary = new
                    {
                        totalAssets = table.Rows.Count,
                        countries = countryGroups.Select(kvp => new { country = kvp.Key, count = kvp.Value }),
                        substates = substateGroups.Select(kvp => new { substate = kvp.Key, count = kvp.Value })
                    };

                    return Content(JsonSerializer.Serialize(summary), "application/json");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading stockroom summary.");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================================
        // GLOBAL SEARCH ENDPOINT
        // ============================================================

        [HttpGet("global-search")]
        public async Task<IActionResult> GlobalSearch(
            [FromQuery] string query,
            [FromQuery] string? userCountries = null)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { error = "Search query is required" });
            }

            var searchTerm = query.ToLower();
            var allowedCountries = !string.IsNullOrEmpty(userCountries)
                ? userCountries.Split(',').Select(c => c.Trim()).ToList()
                : new List<string>();

            var results = new
            {
                assets = new List<object>(),
                stockAssets = new List<object>(),
                appUsers = new List<object>(),
                teamMembers = new List<object>()
            };

            try
            {
                try
                {
                    var assetsData = ReadExcelFile("Horizon_Report.xlsx");

                    foreach (var asset in assetsData)
                    {
                        if (allowedCountries.Any())
                        {
                            var assetCountry = asset.ContainsKey("country") ? asset["country"]?.ToString() : "";
                            var assetCountryCode = GetCountryCodeFromName(assetCountry);
                            
                            if (!allowedCountries.Contains(assetCountryCode))
                                continue;
                        }

                        var searchableFields = new[]
                        {
                            "configuration_item", "serial_number", "mac_address",
                            "ip_address", "assigned_to", "display_name", "model"
                        };

                        var matchFound = searchableFields.Any(field =>
                            asset.ContainsKey(field) &&
                            asset[field] != null &&
                            asset[field].ToString()!.ToLower().Contains(searchTerm));

                        if (matchFound)
                        {
                            results.assets.Add(new
                            {
                                type = "asset",
                                hostname = asset.GetValueOrDefault("configuration_item")?.ToString(),
                                displayName = asset.GetValueOrDefault("display_name")?.ToString(),
                                serial = asset.GetValueOrDefault("serial_number")?.ToString(),
                                model = asset.GetValueOrDefault("model")?.ToString(),
                                assignedTo = asset.GetValueOrDefault("assigned_to")?.ToString(),
                                country = asset.GetValueOrDefault("country")?.ToString(),
                                category = asset.GetValueOrDefault("model_category")?.ToString(),
                                ipAddress = asset.GetValueOrDefault("ip_address")?.ToString(),
                                macAddress = asset.GetValueOrDefault("mac_address")?.ToString(),
                                city = asset.GetValueOrDefault("city")?.ToString(),
                                rawData = asset
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Assets search error.");
                }

                try
                {
                    var stockData = ReadExcelFile("Horizon_Stocks.xlsx");

                    foreach (var asset in stockData)
                    {
                        if (allowedCountries.Any())
                        {
                            var assetCountry = asset.ContainsKey("country") ? asset["country"]?.ToString() : "";
                            var assetCountryCode = GetCountryCodeFromName(assetCountry);
                            
                            if (!allowedCountries.Contains(assetCountryCode))
                                continue;
                        }

                        var searchableFields = new[]
                        {
                            "configuration_item", "serial_number", "model", "stockroom", "reserved_for"
                        };

                        var matchFound = searchableFields.Any(field =>
                            asset.ContainsKey(field) &&
                            asset[field] != null &&
                            asset[field].ToString()!.ToLower().Contains(searchTerm));

                        if (matchFound)
                        {
                            results.stockAssets.Add(new
                            {
                                type = "stock",
                                hostname = asset.GetValueOrDefault("configuration_item")?.ToString(),
                                serial = asset.GetValueOrDefault("serial_number")?.ToString(),
                                model = asset.GetValueOrDefault("model")?.ToString(),
                                country = asset.GetValueOrDefault("country")?.ToString(),
                                stockroom = asset.GetValueOrDefault("stockroom")?.ToString(),
                                substate = asset.GetValueOrDefault("substate")?.ToString(),
                                state = asset.GetValueOrDefault("state")?.ToString(),
                                reservedFor = asset.GetValueOrDefault("reserved_for")?.ToString(),
                                rawData = asset
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Stock assets search error.");
                }

                try
                {
                    var usersJson = await ReadJsonFile("users.json");
                    using (JsonDocument doc = JsonDocument.Parse(usersJson))
                    {
                        var root = doc.RootElement;
                        JsonElement usersArray = root.TryGetProperty("users", out var ua) ? ua : root;

                        foreach (var user in usersArray.EnumerateArray())
                        {
                            var name = user.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                            var email = user.TryGetProperty("email", out var e) ? e.GetString() ?? "" : "";
                            var fedexId = user.TryGetProperty("fedexId", out var f) ? f.GetString() ?? "" : "";

                            if (name.ToLower().Contains(searchTerm) || 
                                email.ToLower().Contains(searchTerm) ||
                                fedexId.ToLower().Contains(searchTerm))
                            {
                                results.appUsers.Add(new
                                {
                                    type = "appUser",
                                    name = name,
                                    email = email,
                                    fedexId = fedexId,
                                    role = user.TryGetProperty("role", out var r) ? r.GetString() : ""
                                });
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "App users search error.");
                }

                try
                {
                    var teamMembersPath = Path.Combine(_environment.WebRootPath, "api", "data", "team-members.json");

                    if (System.IO.File.Exists(teamMembersPath))
                    {
                        var teamJson = await System.IO.File.ReadAllTextAsync(teamMembersPath);
                        using (JsonDocument doc = JsonDocument.Parse(teamJson))
                        {
                            var root = doc.RootElement;
                            JsonElement membersArray = root.TryGetProperty("teamMembers", out var tm) ? tm : root;

                            if (membersArray.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var member in membersArray.EnumerateArray())
                                {
                                    var name = member.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                                    var email = member.TryGetProperty("email", out var e) ? e.GetString() ?? "" : "";
                                    var id = member.TryGetProperty("id", out var i) ? i.GetInt32().ToString() : "";

                                    if (name.ToLower().Contains(searchTerm) || 
                                        email.ToLower().Contains(searchTerm) ||
                                        id.Contains(searchTerm))
                                    {
                                        results.teamMembers.Add(new
                                        {
                                            type = "teamMember",
                                            name = name,
                                            email = email,
                                            employeeId = id,
                                            jobTitle = member.TryGetProperty("jobTitle", out var jt) ? jt.GetString() : "",
                                            department = member.TryGetProperty("department", out var d) ? d.GetString() : "",
                                            country = member.TryGetProperty("country", out var c) ? c.GetString() : "",
                                            countryName = member.TryGetProperty("countryName", out var cn) ? cn.GetString() : "",
                                            location = member.TryGetProperty("location", out var l) ? l.GetString() : "",
                                            phone = member.TryGetProperty("phone", out var p) ? p.GetString() : ""
                                        });
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Team members file not found at {Path}", teamMembersPath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Team members search error.");
                }

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Global search error.");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private string GetCountryCodeFromName(string? countryName)
        {
            if (string.IsNullOrEmpty(countryName)) return "";

            var normalized = countryName.Trim();
            if (normalized.Equals("Turkey", StringComparison.OrdinalIgnoreCase) ||
                normalized.Equals("Türkiye", StringComparison.OrdinalIgnoreCase))
                return "TR";

            var countryMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Spain", "ES" }, { "Portugal", "PT" }, { "Switzerland", "CH" },
                { "Czech Republic", "CZ" }, { "Austria", "AT" }, { "Romania", "RO" },
                { "Hungary", "HU" }, { "Greece", "GR" }, { "Bulgaria", "BG" },
                { "Slovakia", "SK" }, { "Belgium", "BE" }, { "Denmark", "DK" },
                { "Finland", "FI" }, { "France", "FR" }, { "Germany", "DE" },
                { "Ireland", "IE" }, { "Italy", "IT" }, { "Netherlands", "NL" },
                { "Poland", "PL" }, { "Sweden", "SE" }, { "United Kingdom", "GB" }
            };

            return countryMap.TryGetValue(normalized, out var code) ? code : "";
        }

        // ============================================================
        // GENERIC JSON ENDPOINT
        // ============================================================

        [HttpGet("json/{filename}")]
        public async Task<IActionResult> GetJsonData(string filename)
        {
            try
            {
                if (!filename.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(new { error = "Only JSON files allowed" });

                if (filename.Contains("..") || filename.Contains("/") || filename.Contains("\\"))
                    return BadRequest(new { error = "Invalid filename" });

                var json = await ReadJsonFile(filename);
                return Content(json, "application/json");
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading JSON file {Filename}", filename);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================================
        // SAVE DATA ENDPOINT
        // ============================================================

        [HttpPost("save")]
        public async Task<IActionResult> SaveData([FromBody] JsonElement data)
        {
            try
            {
                var apiDataDir = Path.Combine(_environment.WebRootPath, "api", "data");
                if (!Directory.Exists(apiDataDir))
                {
                    Directory.CreateDirectory(apiDataDir);
                    _logger.LogInformation("Created api/data directory at {DataDir}", apiDataDir);
                }

                var filePath = Path.Combine(apiDataDir, "inventory.json");

                var options = new JsonSerializerOptions { WriteIndented = true };
                var json = JsonSerializer.Serialize(data, options);

                await System.IO.File.WriteAllTextAsync(filePath, json);

                _logger.LogInformation("Inventory data saved successfully to {FilePath}", filePath);
                return Ok(new { success = true, message = "Data saved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving data.");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // ============================================================
        // COUNTRY TASKS ENDPOINTS (INC & SCTASK Analysis)
        // ============================================================

        [HttpGet("country-tasks")]
        public IActionResult GetCountryTasks()
        {
            try
            {
                var tasks = ReadExcelFile("Horizon_Tasks.xlsx");
                var json = JsonSerializer.Serialize(tasks);
                return Content(json, "application/json");
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading country tasks Excel file.");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("country-tasks/summary")]
        public IActionResult GetCountryTasksSummary()
        {
            try
            {
                var tasks = ReadExcelFile("Horizon_Tasks.xlsx");

                var totalTasks = tasks.Count;
                var incidents = tasks.Count(t => t.ContainsKey("number") &&
                    t["number"]?.ToString()?.StartsWith("INC", StringComparison.OrdinalIgnoreCase) == true);
                var requests = tasks.Count(t => t.ContainsKey("number") &&
                    t["number"]?.ToString()?.StartsWith("SCTASK", StringComparison.OrdinalIgnoreCase) == true);

                var closedTasks = tasks.Count(t => t.ContainsKey("state") &&
                    (t["state"]?.ToString()?.Contains("Closed", StringComparison.OrdinalIgnoreCase) == true));

                var highPriorityTasks = tasks.Count(t => t.ContainsKey("priority") &&
                    t["priority"]?.ToString() == "5");

                var avgDuration = tasks
                    .Where(t => t.ContainsKey("business_duration") &&
                        double.TryParse(t["business_duration"]?.ToString(), out _))
                    .Select(t => Convert.ToDouble(t["business_duration"]))
                    .DefaultIfEmpty(0)
                    .Average();

                var countryGroups = tasks
                    .Where(t => t.ContainsKey("country_code") && !string.IsNullOrWhiteSpace(t["country_code"]?.ToString()))
                    .GroupBy(t => t["country_code"]?.ToString() ?? "Unknown")
                    .Select(g => new
                    {
                        countryCode = g.Key,
                        totalTasks = g.Count(),
                        incidents = g.Count(t => t.ContainsKey("number") &&
                            t["number"]?.ToString()?.StartsWith("INC", StringComparison.OrdinalIgnoreCase) == true),
                        requests = g.Count(t => t.ContainsKey("number") &&
                            t["number"]?.ToString()?.StartsWith("SCTASK", StringComparison.OrdinalIgnoreCase) == true),
                        closedTasks = g.Count(t => t.ContainsKey("state") &&
                            (t["state"]?.ToString()?.Contains("Closed", StringComparison.OrdinalIgnoreCase) == true)),
                        inProgressTasks = g.Count(t => t.ContainsKey("state") &&
                            (t["state"]?.ToString()?.Contains("Progress", StringComparison.OrdinalIgnoreCase) == true ||
                             t["state"]?.ToString()?.Contains("Work in Progress", StringComparison.OrdinalIgnoreCase) == true)),
                        highPriorityTasks = g.Count(t => t.ContainsKey("priority") &&
                            t["priority"]?.ToString() == "5"),
                        avgDuration = g
                            .Where(t => t.ContainsKey("business_duration") &&
                                double.TryParse(t["business_duration"]?.ToString(), out _))
                            .Select(t => Convert.ToDouble(t["business_duration"]))
                            .DefaultIfEmpty(0)
                            .Average(),
                        priorityDistribution = g
                            .Where(t => t.ContainsKey("priority"))
                            .GroupBy(t => t["priority"]?.ToString() ?? "Unknown")
                            .Select(p => new { priority = p.Key, count = p.Count() })
                            .OrderByDescending(p => p.count),
                        stateDistribution = g
                            .Where(t => t.ContainsKey("state"))
                            .GroupBy(t => t["state"]?.ToString() ?? "Unknown")
                            .Select(s => new { state = s.Key, count = s.Count() })
                            .OrderByDescending(s => s.count),
                        topAssignmentGroups = g
                            .Where(t => t.ContainsKey("assignment_group") && !string.IsNullOrWhiteSpace(t["assignment_group"]?.ToString()))
                            .GroupBy(t => t["assignment_group"]?.ToString())
                            .Select(ag => new { group = ag.Key, count = ag.Count() })
                            .OrderByDescending(ag => ag.count)
                            .Take(5),
                        topAssignees = g
                            .Where(t => t.ContainsKey("assigned_to") && !string.IsNullOrWhiteSpace(t["assigned_to"]?.ToString()))
                            .GroupBy(t => t["assigned_to"]?.ToString())
                            .Select(a => new { assignee = a.Key, count = a.Count() })
                            .OrderByDescending(a => a.count)
                            .Take(5)
                    })
                    .OrderByDescending(g => g.totalTasks)
                    .ToList();

                var summary = new
                {
                    globalStats = new
                    {
                        totalTasks = totalTasks,
                        incidents = incidents,
                        requests = requests,
                        closedTasks = closedTasks,
                        highPriorityTasks = highPriorityTasks,
                        avgDurationHours = Math.Round(avgDuration / 3600, 2),
                        closedPercentage = totalTasks > 0 ? Math.Round((double)closedTasks / totalTasks * 100, 2) : 0
                    },
                    countries = countryGroups
                };

                return Ok(summary);
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating country tasks summary.");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
