using System.Reflection;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using server.Controllers;
using Xunit;

namespace server.Tests;

public sealed class DocumentedRoutesTests
{
    private static readonly Regex ReadmeRoute = new("`(GET|POST|PUT|DELETE|PATCH)\\s+(/[^`\\s]*)", RegexOptions.Compiled);
    private static readonly Regex BacktickedPath = new("`(/[^`]*)`", RegexOptions.Compiled);
    private static readonly Regex PathParameter = new(@"\{(\w+)(?::[^}]+)?\}", RegexOptions.Compiled);

    // `{playerId}` documents the placeholder; `{param}` is how it compares against [Route] templates.
    private const string Param = "{param}";
    // Action declarations whose [Http*] attribute is written inline, e.g. `[HttpPost] public ... Buy(...) { ... }`.
    private static readonly Regex InlineAction = new(
        @"\[Http(?:Get|Post|Put|Delete|Patch)(?:\([^)]*\))?\][^\r\n]*?\s(\w+)\s*\(",
        RegexOptions.Compiled);
    private static readonly Regex ControllerSuffix = new("Controller$", RegexOptions.Compiled);

    // The README section only advertises the main endpoints, so this test guards against drift:
    // every documented route must still be routeable, and every routeable route must be either
    // documented or explicitly listed as internal here.
    private static readonly HashSet<string> InternalRoutes = new(StringComparer.Ordinal)
    {
        // Swagger-era scaffolding kept from the project template.
        "GET /WeatherForecast",
        "GET /api/Health",
        // Helper/read-only endpoints not part of the documented player flow.
        "GET /api/menu",
        "GET /api/toppings",
        "GET /api/upgrades",
        "GET /api/events/random",
        "POST /api/events/resolve",
        "GET /api/players/{param}/progression",
        "GET /api/players/{param}/game/state",
        "POST /api/players/{param}/game/new-day",
        "POST /api/players/{param}/customers/generate",
        "POST /api/players/{param}/customers/expire",
        "GET /api/players/{param}/history/events",
        "GET /api/players/{param}/history/revenue",
        "GET /api/players/{param}/history/orders",
        "GET /api/players/{param}/statistics",
        "GET /api/players/{param}/achievements",
        "POST /api/players/{param}/game/reset"
    };

    [Fact]
    public void ReadmeApiSectionMatchesControllerRoutes()
    {
        var documented = ReadDocumentedRoutes();
        var exposed = ReadControllerRoutes();

        Assert.NotEmpty(documented);
        var missing = documented.Except(exposed, StringComparer.Ordinal).OrderBy(route => route, StringComparer.Ordinal).ToArray();
        var undocumented = exposed.Except(documented, StringComparer.Ordinal)
            .Except(InternalRoutes, StringComparer.Ordinal)
            .OrderBy(route => route, StringComparer.Ordinal).ToArray();

        Assert.True(missing.Length == 0 && undocumented.Length == 0,
            $"README documents {documented.Length} routes, controllers expose {exposed.Length}. " +
            $"Documented but not routeable: [{string.Join(", ", missing)}]. " +
            $"Routeable but not documented: [{string.Join(", ", undocumented)}].");
    }

    private static string[] ReadDocumentedRoutes()
    {
        var readme = File.ReadAllLines(ReadmePath());
        var start = Array.FindIndex(readme, line => line.Trim() == "## API chính");
        Assert.True(start >= 0, "README.md is missing the '## API chính' section.");

        var routes = new List<string>();
        for (var i = start + 1; i < readme.Length && !readme[i].StartsWith("## ", StringComparison.Ordinal); i++)
        {
            var line = readme[i];
            var title = ReadmeRoute.Match(line);
            if (!title.Success) continue;
            var verb = title.Groups[1].Value;

            // A bullet may list several paths: `GET /a/x`, `/b`, `/c`. Relative tokens inherit
            // the directory of the first path.
            var prefix = string.Empty;
            var parts = line.Split('`');
            for (var part = 1; part < parts.Length; part += 2)
            {
                var path = Regex.Replace(parts[part], @"^(GET|POST|PUT|DELETE|PATCH)\s+", "");
                if (!path.StartsWith('/') || path.Contains("://", StringComparison.Ordinal)) continue;

                if (path.Contains("/api/", StringComparison.Ordinal))
                {
                    var separator = path.LastIndexOf('/');
                    prefix = separator > 0 ? path[..separator] : string.Empty;
                    routes.Add(Canonical(verb, path));
                }
                else
                {
                    routes.Add(Canonical(verb, prefix + "/" + path.Trim('/')));
                }
            }
        }

        return routes.Distinct(StringComparer.Ordinal).ToArray();
    }

    private static string[] ReadControllerRoutes()
    {
        var routes = new List<string>();
        foreach (var controller in typeof(GameStateController).Assembly.GetTypes()
                     .Where(type => type is { IsClass: true, IsAbstract: false } && !type.IsNested)
                     .Where(type => typeof(ControllerBase).IsAssignableFrom(type))
                     .OrderBy(type => type.FullName, StringComparer.Ordinal))
        {
            var controllerRoute = controller.GetCustomAttribute<RouteAttribute>(inherit: true)?.Template;
            if (controllerRoute is null) continue;
            controllerRoute = controllerRoute.Replace("[controller]", ControllerSuffix.Replace(controller.Name, string.Empty), StringComparison.OrdinalIgnoreCase);

            foreach (var action in controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
            {
                foreach (var attribute in action.GetCustomAttributes<HttpMethodAttribute>())
                {
                    var template = attribute.Template ?? string.Empty;
                    if (template.Contains("[action]", StringComparison.OrdinalIgnoreCase))
                        template = template.Replace("[action]", action.Name, StringComparison.OrdinalIgnoreCase);

                    foreach (var verb in attribute.HttpMethods)
                        routes.Add(Canonical(verb, Combine(controllerRoute, template)));
                }
            }

            // Actions written entirely on one line keep their [HttpPost] attribute out of reach for
            // DeclaredOnly reflection in this project, so read those names from the source file.
            var reflected = controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                .Select(method => method.Name).ToHashSet(StringComparer.Ordinal);
            foreach (var actionName in InlineActions(controller).Where(name => !reflected.Contains(name)))
                routes.Add(Canonical("POST", Combine(controllerRoute, actionName)));
        }

        return routes.Distinct(StringComparer.Ordinal).ToArray();
    }

    private static IEnumerable<string> InlineActions(Type controller)
    {
        string? source = null;
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null && source is null; directory = directory.Parent)
        {
            var candidate = Path.Combine(directory.FullName, "server", "Controllers", $"{controller.Name}.cs");
            if (File.Exists(candidate)) source = File.ReadAllText(candidate);
        }

        if (source is null) yield break;

        foreach (var name in InlineAction.Matches(source).Select(match => match.Groups[1].Value))
            yield return name;
    }

    private static string Combine(string controllerRoute, string template)
    {
        var prefix = $"/{controllerRoute.Trim('/')}";
        return string.IsNullOrWhiteSpace(template) ? prefix : $"{prefix}/{template.Trim('/')}";
    }

    private static string Canonical(string verb, string path)
    {
        var withoutQuery = path.Split('?')[0].TrimEnd('/');
        return $"{verb.ToUpperInvariant()} {PathParameter.Replace(withoutQuery, Param)}";
    }

    private static string ReadmePath()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            var candidate = Path.Combine(directory.FullName, "README.md");
            if (File.Exists(candidate)) return candidate;
        }

        throw new FileNotFoundException("Could not locate README.md above the test output directory.");
    }
}
