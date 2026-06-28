using Microsoft.EntityFrameworkCore;

namespace QueryGrid.Samples.ShowcaseApi.Data;

public sealed class ShowcaseDbContext(DbContextOptions<ShowcaseDbContext> options) : DbContext(options)
{
  public DbSet<ShowcaseRow> ShowcaseRows => Set<ShowcaseRow>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.Entity<ShowcaseRow>(entity =>
    {
      entity.HasKey(row => row.Id);
      entity.Property(row => row.Label).HasMaxLength(200);
      entity.Property(row => row.OptionalNote).HasMaxLength(500);
      entity.Property(row => row.InternalCode).HasMaxLength(50);
      entity.Property(row => row.SortDisabledField).HasMaxLength(100);
      entity.Property(row => row.FilterDisabledField).HasMaxLength(100);
      entity.Property(row => row.Price).HasPrecision(18, 4);
    });
  }
}
