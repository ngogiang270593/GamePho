using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;

namespace server.Migrations;

[DbContext(typeof(GameDbContext))]
[Migration("20261023090000_AddGameJourney")]
public sealed class AddGameJourney : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.CreateTable(
        name: "GameJourneys",
        columns: table => new { PlayerId = table.Column<int>(type: "INTEGER", nullable: false), StateJson = table.Column<string>(type: "TEXT", nullable: false) },
        constraints: table => table.PrimaryKey("PK_GameJourneys", x => x.PlayerId));
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable("GameJourneys");
}
