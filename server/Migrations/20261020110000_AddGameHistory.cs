using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;

#nullable disable

namespace server.Migrations;

[DbContext(typeof(GameDbContext))]
[Migration("20261020110000_AddGameHistory")]
public partial class AddGameHistory : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "GameHistories",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                PlayerId = table.Column<int>(type: "INTEGER", nullable: false),
                ActionType = table.Column<string>(type: "TEXT", nullable: false),
                Summary = table.Column<string>(type: "TEXT", nullable: false),
                MoneyChange = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                ReputationChange = table.Column<int>(type: "INTEGER", nullable: false),
                ViralChange = table.Column<int>(type: "INTEGER", nullable: false),
                RelatedId = table.Column<int>(type: "INTEGER", nullable: true),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_GameHistories", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_GameHistories_PlayerId_CreatedAt",
            table: "GameHistories",
            columns: new[] { "PlayerId", "CreatedAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "GameHistories");
    }
}
