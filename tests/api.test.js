import { describe, expect, it } from "vitest";
import { GET } from "../app/api/user/[userId]/read-books/route";

describe("GET /api/user/[userId]/read-books", () => {
  it("returns a CSV download for a real user", async () => {
    const response = await GET(null, {
      params: {
        userId: "3",
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain(
      "read-books-3.csv"
    );

    const csv = await response.text();

    expect(csv).toContain('"Title","Author","Rating","Review","Read Date"');
    expect(csv.length).toBeGreaterThan('"Title,Author,Rating,Review","Read Date"'.length);
  });
});